# Replay format

## Current format

The persisted `Replay` interface in `packages/shared/src/room.ts` is a server-produced record containing:

- `version`: battle engine version (`chaos-integer-v9`).
- `config` and `configHash`: locked battle inputs and canonical hash.
- `seed`: authoritative simulation seed.
- `round` and `start`: room round and server-clock playback start time.
- `checkpoints`: rolling state hashes recorded every 120 simulation ticks (at most 256 retained).
- `finalHash`, `result` and `final`: official terminal hash, team results and final battle state.

The authenticated `/api/rooms/:code/replay` endpoint currently returns this complete record. Ordinary `/state` responses omit `final`, but still expose replay result metadata. Clients reconstruct the timeline by running `stepBattle` locally and compare checkpoint/final hashes. Hashes detect accidental divergence; they are not signatures or security proofs.

## Target recorded-frame format (not yet implemented)

Recorded playback needs a separate versioned format. The intended logical record is:

```ts
interface RecordedReplayV1 {
  format: 1;
  engineVersion: string;
  round: number;
  configHash: string;
  tickRate: 30;
  start: number;
  totalTicks: number;
  frames: ReplayFrame[];
  events: ReplayEvent[];
  terminalHash: string;
  result?: TeamResult[]; // published only when room lifecycle permits
}
```

Frame sampling cadence, fields, integer encoding, compression and chunk size remain undecided pending renderer parity and storage measurements. A frame must include enough visual state to render fighters, weapons, projectiles, zones, pending casts, temporary statuses and character effects. Event ordering must be stable by tick and engine insertion order. Interpolation must affect render-only positions/angles; it must not recalculate damage, collision or official outcomes.

## Chunking, seeking and recovery target

If one replay exceeds the measured Durable Object record budget, expose authenticated chunks keyed by round and monotonically increasing chunk/tick range. Clients validate format, round, order and continuity, discard duplicate chunks, and resume from their last rendered tick after refresh or reconnect. Full state at a chunk boundary enables recovery. Chunk storage and endpoint behavior are not implemented yet.

## Security and lifecycle

The public replay response omits the seed and official result. Clients who retrieve the recorded frame chunks can still infer the result before displayed playback ends. This is compatible only with current gameplay, where no action during playback can alter a battle or settlement. Any future betting, voting or other hidden-outcome interaction requires a different delivery/settlement strategy before that feature is enabled.

## Implemented format 1

The persisted `Replay` includes private server settlement data. The client receives a `ReplayInfo` projection with format number, engine version, game generation, round, locked config/hash, server playback start, total ticks, terminal hash and ordered chunk descriptors. It omits the seed, result and terminal `BattleState`.

`ReplayFrame` is compact render data: tick; fighter tuples `(x,y,hp,shield,energy,angle,skillReady,superUntil,slowUntil,burnUntil,deadAt,weaponReach,maxHp,swordHits)`; projectile id/owner/position tuples; zones; pending casts; recent visual events and kill history. The server captures tick zero, then every 3 engine ticks (10 frames/s), and always captures the terminal tick.

Each Durable Object Alarm batch becomes one gzip-compressed, base64 storage value at `replay:<game>:<round>:<index>`. The chunk key, updated descriptor and cleared pending frames commit in the same storage transaction as room state. Descriptors provide index, first/last tick, count, canonical hash and compressed byte count. Authenticated endpoint: `/api/rooms/:code/replay/chunk?index=N`.

The browser verifies count, endpoints and hash after decompression. For late joins it loads the chunk nearest the shared server timeline and its predecessor, then prefetches ahead. When a request fails, playback holds the last available frame and retries after a short backoff. New game/round persistence removes previous replay keys; only the latest round remains.

This format supports late-join resume but has no seek UI. Frames are outcome-bearing: clients can infer the winner by downloading later chunks ahead of playback. That is compatible with current autonomous battles only; a future result-sensitive action requires a different delivery strategy. No production rollout or provider capacity claim has been made.

## Combat readability update (v20)

`chaos-integer-v20` limits roster melee skills and Supers to physical weapon reach
plus the target's body radius. Roster ranger/frost attacks use colliding projectiles:
240 units for normal targeting, 260 for skills, and 300 for Supers. Missed shots
expire after their bounded flight; damage is no longer applied at cast time.
Roster melee reach gains 20 units, subject to the existing 70-unit cap. Weapon
rendering, clashes and normal hits share the same weapon count and reach.

Projectile samples now contain `(id, owner, x, y, vx?, vy?, normal?, kind?)`, where
`kind` is `skill` or `super`. Optional fields retain the direction and VFX type even
when a projectile has only one recorded sample. The renderer tolerates old
four-field tuples, but the existing engine-version gate requires a new battle for
v20 playback; v19 snapshots must not be simulated with the changed rules.

## Balance update (v21)

`chaos-integer-v21` uses distinct role profiles, current-rarity budgets,
percentage armor reduction, leveled item procs and additive synergy sources.
Fighters persist `equipmentLevels`; controller projectiles persist their slow
power in simulation checkpoints. Render tuples retain the v20 visual fields.
Team configuration can include a display `name` for the color legend.
See [BALANCE.md](BALANCE.md) for the rules and reproducible validation commands.

## Square arena update (v22)

New room, practice, campaign and simulation presets use 72000 × 72000 fixed-point
units (720 × 720 world units). The default wall schedule starts shrinking at 10s
and stops at 20s. Square arenas skip the rectangular trimming stage; explicitly
configured rectangles retain that stage. The renderer sizes its coordinate space
from recorded dimensions, keeping circles, pointer selection, projectiles and
walls aligned for either aspect ratio.

The 64-frame vector atlas in `apps/web/public/effects/combat-fx.svg` adds visual-only
impact, cast, status, recovery and projectile animation. It does not enlarge damage
areas. Regenerate it with `npm run build:fx`. Sprite frames are shared and effect
instances/data are pooled. Existing replay fields suffice for these effects.


## Individual abilities update (v24)

`chaos-integer-v24` replaces every roster passive and specializes five legendary kits. Checkpoints persist proc counters, cooldowns and reach/radiation buffs in fighter memory/buffs. Projectiles retain radiation stacks and splash settings until contact. Zone records include `auraAttack`, `auraHaste` and `territory`; existing recorded zone samples carry these fields without changing replay format 1. New radiation events drive status and impact VFX. Older engine checkpoints remain rejected by the version gate.
