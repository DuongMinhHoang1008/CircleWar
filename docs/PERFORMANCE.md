# Performance and capacity

## Existing measured evidence

`reports/benchmark.json` and `TESTING.md` document local development-machine engine benchmarks. The latest recorded benchmark is one 60-fighter seed with 2,105 ticks, 422.41 ms wall time, 453 ms process CPU and a 56,276-byte final snapshot. This measures local engine execution, not Cloudflare Worker CPU, Durable Object storage throughput, or concurrent room capacity.

## Current limits in source

- Room rules allow at most 20 active players and three characters each (60 fighters); the room can also contain spectators up to 40 members.
- The Worker advances a simulation in batches of at most 120 ticks per Alarm and persists the room after each batch.
- The room keeps up to 256 periodic checksums and one current round replay.
- WebSockets send compact room invalidations; clients fetch state separately. Battle physics is not continuously streamed.

## Recorded replay measurements

No production replay frame data is available. The local final-snapshot figure must not be treated as a replay-size estimate.

### Local measurement — 2026-10-19

`npm run test:integration` exercised a 20-player room at three characters each (60 fighters) through the local Worker and SQLite Durable Object. It completed at 1,740 ticks (58 seconds of game time), recorded 581 frames (10 samples/s), and produced 16 chunks. Gzip payload total was 242,960 bytes; base64 values stored in the Durable Object totaled 323,952 bytes. The integration test downloaded and validated every chunk's frame count and canonical hash. This is one local sample, not a production benchmark or Cloudflare quota guarantee. Per-invocation CPU, memory, concurrent-room capacity and long-duration growth remain unmeasured.

Client decode/interpolation latency and visual interpolation error have not been profiled. Benchmark longer matches with mixed character effects at 60 fighters, per-batch CPU/storage time, reads per client and renderer frame time. Verify provider limits in staging. Do not claim free-tier capacity or production concurrency from local results.
