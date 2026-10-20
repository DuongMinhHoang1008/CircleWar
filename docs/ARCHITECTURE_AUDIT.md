# Architecture audit

Audit date: 2026-10-19. This document describes the checked-in workspace as found; it does not assume an earlier design is authoritative.

## Current architecture

- `apps/web/src/main.tsx` owns the React room UI, persists the guest identity in browser storage, fetches room state, requests replay data and mounts `Arena` for replay playback.
- `apps/web/src/networking.ts` sends versioned HTTP room actions, obtains one-time WebSocket tickets, reconnects and refreshes full state after room invalidations. WebSockets carry invalidation messages, not gameplay commands or physics snapshots.
- `packages/shared/src/protocol.ts` defines strict Zod schemas for protocol 3, room settings and player actions.
- `packages/shared/src/room.ts` owns the room state machine, lobby/preparation actions, battle locking, round settlement and reward progression. `applyAction` clones state before mutation. `advance` advances up to 120 battle ticks per call and creates replay metadata when the battle finishes.
- `packages/battle-engine/src/index.ts` is the shared deterministic engine. It provides `createBattle`, `stepBattle`, `calculateBattleResult`, state serialization and hashing. It imports shared balance/catalog data but no DOM, React, PixiJS or Cloudflare APIs.
- `apps/worker/src/index.ts` routes requests to one SQLite-backed Cloudflare Durable Object per room. `Room.fetch` serializes handlers with `blockConcurrencyWhile`; `Room.alarm` persists progress and resumes simulation after each bounded batch.
- `apps/web/src/rendering/Arena.tsx` renders with PixiJS. In multiplayer it currently reconstructs the battle locally from the replay's config and seed, advances `stepBattle` against a server-clock-derived target tick, and verifies periodic hashes. On divergence it can use the final state returned by the replay endpoint.

## Gameplay systems and invariants

The current source implements six base classes and a catalog of 20 character IDs, character skills and supers, weapons, equipment, team bonds and friend groups, integer fixed-step physics, moving safe bounds, round pacing, HP, shields, damage, eliminations, ranking, shop/inventory, Gold, rewards, comeback options, multiple rounds and rematches. Room settings support 2–20 players, 1–3 characters per player, spectators and a 10–120 second preparation period. The engine supports up to 60 fighters for debug/benchmark configurations; the room's 20-player and 3-character limits permit at most 60.

Gameplay invariants to retain:

- Battle runs at 30 integer ticks per second with the current fixed-point math, seeded RNG streams and engine version `chaos-integer-v9`.
- `safeBounds`, `applyRoundTempo`, combat, character hooks, damage, skills, supers, elimination ordering and `calculateBattleResult` remain the existing source of truth.
- Combat runs to at most one surviving team; `shrinkSeconds` controls the wall schedule and is not a round-duration limit.
- Players cannot issue battle-affecting commands during `SIMULATING` or `REPLAY_READY`. `applyAction` accepts shop/progression actions only during the active preparation window and before a player is ready. Skills and supers are automatic engine behaviors.
- No current spectator vote, betting, live movement control, mid-battle purchase, equipment change or external event changes battle outcomes.
- `settle` uses the result saved by the room, is guarded by `settledRound`, and retains the existing reward formula and HP/Gold progression.
- Client rendering and audio do not determine the room's saved result.

## Current simulation ownership and replay

`lock` in `packages/shared/src/room.ts` clones eligible players' loadouts into a `BattleConfig`, creates the battle with a server-selected room RNG seed, and enters `SIMULATING`. The Durable Object calls `advance` from alarms, persists the mutated room after each batch, and stores the official result and final `BattleState` in `Replay` when the engine finishes. `viewRoom` removes `simulation`, checksums and the replay's `final` state from ordinary room-state responses.

The current replay is not a recorded trajectory. It contains immutable config/hash, seed, start time, periodic state hashes, official result and final state. The authenticated `/replay` endpoint currently returns this full record, including final state. `Arena` repeats deterministic simulation on each client and checks server-produced hashes. Thus results are server-owned, but clients still calculate authoritative-looking trajectories locally; there is no snapshot interpolation, event timeline, chunking or replay seeking. The replay API also exposes the full result/final state before playback ends. There are no mid-battle decisions that depend on secrecy today, but this does not meet a future mode's result-secrecy requirements.

## Dependencies and infrastructure

The root npm workspaces use TypeScript, React 19, Vite, PixiJS 8, Zod, Cloudflare Workers/Durable Objects, SQLite-backed Durable Objects, Wrangler, Miniflare, Vitest and Playwright. `apps/worker/wrangler.jsonc` configures the Worker and SQLite DO migration. GitHub Actions deploys the frontend to Pages. No persistent game server or external database is required by the current source. Existing tests cover engine determinism/physics, room actions, recovery and browser flows; existing reports record local tests and benchmarks.

## Systems that can remain unchanged

- Gameplay data, room action rules, balance, deterministic engine, renderer art and visual effects.
- The HTTP room API, WebSocket invalidation protocol, guest session model, SQLite DO persistence and Alarm-based resumable simulation.
- The existing engine package boundary; it is already free of browser/rendering and Cloudflare dependencies.
- The existing final result calculation and idempotent settlement guard.

## Systems requiring modification for snapshot playback

- `packages/shared/src/room.ts`: replay schema and capture pipeline need bounded, versioned visual frames/events, storage size policy and publication timing.
- `apps/worker/src/index.ts`: replay retrieval needs version/size checks and chunk or range delivery if measurements exceed the per-room record budget.
- `apps/web/src/networking.ts` and `apps/web/src/main.tsx`: retrieve and resume replay chunks by room/round/tick rather than downloading the current monolithic full replay.
- `apps/web/src/rendering/Arena.tsx`: display authoritative recorded frames and interpolate render-only properties without calling `stepBattle` for multiplayer playback; keep the local debug mode separate.
- Tests and deployment/performance documentation: compare recorded playback with the current engine, test reconnect/late join, measure replay bytes and verify DO storage limits.

## Compatibility and migration risks

- Full `BattleState` snapshots are too large to persist at every tick. Compact frames, sampling cadence, event retention and compression need measurements before choosing a format.
- Sparse frames can visually misrepresent fast collisions, dashes, projectiles and short-lived character effects. The renderer consumes zones, pending casts, events, fighter buffs and state timers, not just positions.
- The current replay API returns the final state and official result. Hiding those fields alone cannot conceal the winner if clients receive config and seed and can reproduce the engine.
- A replay format/version change must preserve existing active rooms and completed replays or explicitly reject them with a useful message. The project currently stores only the latest round's replay.
- Changing the client playback clock or interpolation can affect perceived timing, audio, kill feed, HUD and inspection behavior even if official combat rules remain unchanged.
- Replay storage size and Cloudflare free-tier capacity have not been measured for a recorded-frame format. Existing local engine benchmark figures cannot establish production limits.

## Data migration risks

No external game database schema or provider migration is present. Durable Object data is stored as a single `data` record. Adding replay fields requires version-tolerant reads for already persisted rooms; replacing that record shape without compatibility handling could strand active sessions or simulations. The current engine rejects unsupported versions, so deploy sequencing must account for active simulations. No destructive data migration is recommended.

## Recommended migration strategy

1. Keep current gameplay, server-side simulation, room lifecycle and renderer intact as the fallback.
2. Define a compact, versioned visual replay frame and event schema from the fields the renderer actually uses; add byte-count reporting and golden-engine comparisons.
3. Record frames at a measured cadence during the existing server simulation, while retaining the deterministic path behind a mode/version switch.
4. Add authenticated, bounded chunk retrieval and replay resume by round/tick. Preserve full-state resynchronization through the official terminal snapshot.
5. Add a replay renderer that interpolates between authoritative frames and reconstructs only render state; compare side by side with the existing renderer across representative character effects.
6. Keep the current deterministic playback as fallback until correctness, recovery and storage tests pass. Do not turn on recorded playback by default before those checks.
7. After verified migration, choose and document result publication timing. Current gameplay has no battle-time actions affected by outcome secrecy; a future betting/voting mode would need a replay-delivery design that does not reveal the result prematurely.

## Selected architecture and reasons

The existing server-authoritative precomputation model is compatible with all current battle rules because all battle-affecting inputs are frozen before `lock` and no live battle interaction exists. Retain it. Use server-recorded replay plus client interpolation as the target, with the current deterministic client playback as a compatibility fallback until recorded replay is measured and verified. Do not add R2, a paid service, another database or a permanently running server without evidence that SQLite DO storage is insufficient.

## Status

The repository already has server-side precomputation, resumable simulation, persisted results, reconnectable room state and deterministic client playback. It does not yet have authoritative trajectory recording, client interpolation, replay chunks/seeking, or delayed result publication. Those acceptance items remain incomplete; this audit does not claim the full architecture refactor is finished.

## Implementation update — 2026-10-19

The snapshot-playback migration has now been implemented. `captureReplayFrame` records compact render data every three simulation ticks. `Room.save` gzip-compresses pending frames and persists them as per-game/per-round/per-index keys in the same transaction as room progress; the room retains ordered descriptors. The public replay projection omits the seed, official result and terminal BattleState. The authenticated chunk endpoint validates index/scope and returns checksummed gzip data. Clients verify chunk count/tick range/hash, load the chunk around the current timeline with its predecessor, prefetch ahead and interpolate render state. Practice mode remains local deterministic simulation.

Local Worker integration at 60 fighters measured a 1,740-tick match with 581 frames across 16 chunks: 242,960 compressed bytes and 323,952 base64 bytes in storage. Playback frames can still reveal the winner before their displayed timeline ends; no current gameplay action can use that information during playback. Production quota/CPU limits remain unmeasured.
