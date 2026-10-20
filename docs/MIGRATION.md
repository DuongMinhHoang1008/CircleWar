# Multiplayer architecture migration

## Current state

The server locks loadouts in `packages/shared/src/room.ts::lock`, runs the existing battle engine from `advance`, persists checkpointed simulation state through the SQLite Durable Object, and stores the official terminal result. The browser currently reconstructs the battle using the shared seed and engine, then verifies server hashes. Existing gameplay and room actions remain unchanged.

## Migration decisions

- Keep current gameplay and the existing battle engine as the source of truth.
- Retain the current SQLite Durable Object, HTTP actions, WebSocket invalidations and Alarm-based resumability.
- Adopt recorded snapshots plus interpolation only after frame-size, rendering-parity and reconnect checks. The deterministic player remains the fallback until then.
- Do not introduce another database or storage provider without measured need.
- No database migration is needed for the documentation/audit step. Any later replay schema must read legacy room records safely and version replay data independently of engine state.

## Rollback

Keep the current `Replay` schema and deterministic `Arena` playback available while recorded replay is tested. A recorded-playback feature switch must default to the current path until acceptance tests pass. If frame generation or decoding fails, continue using the current playback path for compatible engine versions; never accept a client-submitted result.

## Work still required

1. Implement compact recorded visual frames/events and measure replay bytes at actual 60-fighter maximum.
2. Implement chunked authenticated retrieval if record size requires it.
3. Implement client interpolation, late-join/resume and terminal-state recovery.
4. Prevent premature publication of settlement fields where possible and document that seed-bearing replay itself reveals the outcome.
5. Run parity, network recovery, storage and production-staging measurements before enabling the new path.

No deployment or production migration was performed.

## Implemented on 2026-10-19

- Added compact authoritative render frames to the existing battle simulation without modifying combat calculations or room actions.
- Persisted gzip-compressed frame chunks under game/round/index keys in the same DO storage transaction as room progress. Old-scope keys are cleaned when writing a new scope.
- Added authenticated replay metadata and chunk endpoints; public metadata omits seed, final state and official result.
- Changed multiplayer Arena to validate/decompress chunks, select a chunk near the server timeline for late join, prefetch upcoming chunks and interpolate render-only fields. Practice mode remains on the deterministic engine.
- Adapted recovery, local integration and browser integration tests to validate chunk hashes and actual playback.

The new room fields default when absent. An already-running simulation from an older Worker starts recording from its first post-upgrade state; playback clock begins at that recorded tick so it does not show a fabricated opening. A completed legacy replay falls back to deterministic playback using its saved engine version, seed and checkpoints, without publishing result/final state. This cutover has not been tested against a production account.

Still to verify before production: measure long-duration matches, worker CPU/memory and account quotas in staging; test an actual mid-playback network interruption on multiple clients; and exercise the old-active-room path against a preserved legacy Durable Object record. No production deploy was made.

## Gameplay v10 migration — 2026-10-19

- Added protocol 4 actions for unit movement/merging and active-unit capacity upgrades. Clients must reload together; protocol 3 clients cannot use the new shop/bench behavior.
- Bumped engine version to `chaos-integer-v10` because character level baselines and the new item-20 hook affect battle results. Existing v9 replays cannot be interpreted under v10 rules.
- Durable Object storage remains JSON; no table/schema migration is needed. `viewRoom` supplies an empty bench for old player records and infers a missing `unitLimit` from that player's existing deployed count (clamped to 1–3), preserving their current team. New joins always receive one level-1 starter and a limit of one.
- New shop purchases use stable CharacterId/item IDs. Existing item IDs and equipment are not renumbered. The catalog appends `item_20`; old inventories are not truncated. New purchases stop when the item bag reaches 8, and the 5-slot bench is enforced server-side.
- Rollback requires deploying a matching protocol-3/engine-v9 client and server together. v10 room actions and battle replays rely on new fields/actions; do not roll back only one side.
- No production deployment or live Durable Object migration has been performed.
