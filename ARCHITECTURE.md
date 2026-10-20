# Kiến trúc

## Phân lớp

- `packages/shared/src/balance.ts`: sáu lớp, 20 vật phẩm catalog cùng legacy modifiers, economy prices/capacities và reward pure function.
- `packages/shared/src/protocol.ts`: Zod strict schemas; protocol version, UUID request ID và round number.
- `packages/battle-engine`: không DOM/React/Node/Cloudflare API; RNG, vật lý, combat, replay/serialization.
- `packages/shared/src/room.ts`: state machine thuần, clone trước mutation; thao tác thất bại không trừ tiền hoặc làm mất đồ trên bản gốc.
- `apps/worker`: xác thực và persistence; mỗi mã phòng là một SQLite Durable Object.
- `apps/web`: networking, UI và Pixi renderer. Renderer không quyết định kết quả chính thức.

## Determinism

**Cập nhật v9 (lịch sử):** 20 CharacterId, 13 `FRIEND_GROUPS`, các team synergies tự mở; TeamChoice giữ tương thích dữ liệu/API. Engine v9 và protocol 3 là phiên bản trước gameplay v10. Weapon atlas chỉ phục vụ UI/Pixi Texture frame, không tham gia RNG/hash/hitbox.

**Gameplay v10:** `Player.loadouts` chứa quân trên sân, `Player.bench` chứa quân dự bị và `Player.unitLimit` giới hạn đội hình hiện trường. Người mới nhận đúng một `Loadout` level 1. `MOVE_UNIT` chỉ được dùng khi PREPARATION chưa ready; server xử lý swap, deploy, đưa vào bench và hợp nhất hai bản sao cùng CharacterId/level. Bench có 5 ô, túi vật phẩm 8. `BUY` mua cả quân hoặc đồ theo mặt hàng trong shop 5 ô; `UPGRADE_CAPACITY` nâng số quân 1→2→3 với giá 5G/10G ngoài lượt reroll. `prepare` và `settle` tiếp tục điều khiển vòng đấu, thưởng Gold theo thứ hạng hiện có; `lock` chỉ snapshot quân đang ra sân. Mặt hàng và nâng cấp được kiểm tra trong `applyAction` server-side.

Catalog v10 có 20 món. `item_20` Bàn cờ tướng tăng khiên; hook Super/affinity của Hoàng Tử Ngậm Hoa chạy trong `character-combat.ts`. Frontend vẽ 20 icon bằng SVG trong `GameCatalog.tsx`; `Arena.tsx` phát các sprite hiệu ứng cho hit, kill, heal, shield, skill và Super. Các sprite, animation, camera shake chỉ tác động hình ảnh, không thay đổi RNG, replay frames hoặc kết quả engine.

**Cập nhật v5:** `catalog-data.json` dùng chung UI/server cho 19 nhân vật, 19 món và 20 liên kết. `catalog.ts` kiểm tra điều kiện/slot đại diện. `character-combat.ts` chạy skill, item hooks và liên kết; buff, khiên theo lớp, pending cast và bộ đếm được serialize. Protocol 2 thêm chọn nhân vật/liên kết, nâng vũ khí và tháo đồ. Canonical hash bỏ key undefined như JSON để giữ hash khi checkpoint có field tùy chọn. Replay v4 trở về trước bị từ chối; cần trận mới. Luật bo vuông và tăng nhịp của v4 bên dưới được giữ, riêng nhân vật mới tính lại buff từ baseline mỗi tick để không nhân chồng.

Luật nền từ `chaos-integer-v4` được giữ trong v5: trận không có giới hạn thời gian, chỉ dừng khi còn tối đa một đội sống. `shrinkSeconds` là mốc tường ngừng thu, không phải thời lượng trận. `safeBounds` trả bốn cạnh: thu cạnh dài về vuông nội tiếp trước, rồi thu vuông tới 40% cạnh ngắn ban đầu và giữ nguyên. Server, client, va chạm thân/đạn và renderer dùng chung hàm này. `pacing.ts` tăng chỉ số chiến đấu mỗi 300 tick từ `baseStats` riêng của từng Fighter, có trần; baseline được serialize và tăng nhịp reset khi tạo battle mới, không sửa loadout phòng. Snapshot/replay v1/v2/v3 bị từ chối để tránh phát sai luật; cần trận mới sau khi cập nhật engine.

30 tick/s; world unit = 100 số nguyên. Vector chuẩn hóa dùng scale 1024, căn nguyên bằng thuật toán Newton và `Math.floor`, chia truncate về zero. Bảng 32 hướng là hằng số nguyên, không dùng sin/cos/random/deltaTime/wall clock trong engine. Quy mô world tối đa 160000 × 100000, speed ≤900, weapon reach ≤7000; các tích trung gian trong cấu hình hợp lệ nằm dưới `Number.MAX_SAFE_INTEGER`. `isqrt` từ chối input không safe integer. Collision broad phase theo grid 15000, cặp được sort theo ID; ba solver pass, positional correction theo khối lượng. Max displacement mỗi tick nhỏ hơn đường kính bóng; đạn dùng swept segment.

RNG xorshift32 có state uint32; seed zero được chuyển thành state nonzero. Spawn và combat có seed tách biệt. Loot có RNG của room riêng, không dùng state combat. Không có random mỹ thuật tác động engine. Loadout được sort bằng so sánh chuỗi theo code unit, không dùng locale. Canonical serialization sort mọi key trước hash FNV-1a32. Hash này phát hiện lệch replay, **không phải chữ ký hoặc cơ chế xác thực**.

## State machine và persistence

LOBBY → PREPARATION → LOCKING → SIMULATING → REPLAY_READY → SETTLEMENT → PREPARATION / FINISHED. LOCKING và SETTLEMENT là các bước đồng bộ trong transaction lưu trạng thái kế tiếp. Lobby config chỉ sửa bởi host. Snapshot loadout được clone trước simulation. Simulation mỗi Alarm chạy tối đa 120 tick; checkpoint gồm RNG, cooldown, projectile, zone và tất cả combat state. Alarm tiếp theo đọc đúng checkpoint đã commit. Không dùng background setTimeout trên server.

Một record `data` được lưu qua KV API của **SQLite-backed** DO: room, session hash, action receipts, one-time tickets, simulation, replay/results. State/alarm được commit cùng storage transaction trước response hoặc broadcast. `blockConcurrencyWhile` tuần tự hóa handler qua cả các await. Retry Alarm kiểm tra phase, deadline, replay.round và settledRound. Trận dài tiếp tục qua nhiều Alarm cho tới khi có kết quả, không kết toán khi hết mốc thu tường. Chỉ giữ tối đa 256 checksum gần nhất để metadata không tăng vô hạn; final hash vẫn kiểm tra toàn bộ kết quả. Replay hiện chỉ giữ vòng mới nhất, deadline replay tính theo tick kết thúc thực tế. Phòng không có active deadline được xóa sau 24 giờ không có thay đổi gameplay. Session hết hạn sau bảy ngày.

## Identity và network

Guest token ngẫu nhiên gồm hai UUID, chỉ gửi về client tham gia; storage giữ SHA-256 hash. Mọi action xác thực bằng Bearer token, player ID client gửi không có quyền. Ticket WebSocket ngẫu nhiên, dùng một lần, TTL 30 giây. `acceptWebSocket` và attachment/tag hỗ trợ Hibernation. Action qua HTTP dùng Zod; WebSocket chỉ nhận ping, không nhận lệnh gameplay. Client reconnect với backoff tối đa 10 giây; một identity có một socket hoạt động. Mất socket giữ membership, host và đội hình để có thể reconnect. LEAVE mới chuyển host cho người tham gia sớm nhất.

Origin allowlist tại Worker, body tối đa 8 KiB sau đọc, rate limit 60 authenticated HTTP requests/10 giây/session. Tối đa 40 member bao gồm khán giả, 20 người chơi. UUID receipt giữ trong vòng, round number chặn replay action từ vòng cũ; tối đa 1024 action IDs mỗi vòng/session. Đây không thay thế chống abuse tại edge: endpoint tạo/join phòng vẫn cần rate limit edge trước khi mở công khai lớn.

WebSocket broadcast chỉ gửi invalidation `{type, protocol, seq, serverTime}`. Client tải snapshot riêng sau đó; inventory/shop/reward của người khác bị ẩn. Không stream vị trí mỗi tick. Cách này đơn giản nhưng vẫn tốn snapshot read khi nhiều người thao tác; event patch theo field là hạng mục tối ưu còn lại.

## Replay format 1 — server frames

Server chụp `ReplayFrame` tại tick 0, sau đó mỗi 3 tick (10 mẫu/giây), và luôn chụp tick kết thúc. Snapshot render gọn gồm fighter/projectile positions, HP, shield, energy, góc vũ khí, cooldown/status, zones, pending casts và event hình ảnh. Combat engine vẫn chạy và kết toán trên server; client multiplayer không gọi `stepBattle`.

Mỗi Durable Object Alarm nén batch frame gzip, ghi chunk theo key game/round/index cùng transaction với state phòng và descriptor có tick range/count/hash/byte size. `GET /api/rooms/:code/replay` chỉ trả metadata; `GET /api/rooms/:code/replay/chunk?index=N` trả chunk được xác thực bằng session. Client kiểm tra hash, chọn chunk gần server timeline cho người vào muộn, tải chunk trước/sau để nội suy và giữ frame gần nhất khi đang thử tải lại sau mất mạng. Practice offline vẫn dùng deterministic engine.

Seed, kết quả và BattleState cuối không còn nằm trong replay public metadata. Các chunk vẫn cho phép người tải xem trước kết quả; hiện không có hành động gameplay giữa trận phụ thuộc vào bí mật kết quả. Đừng bật cược/bình chọn ảnh hưởng trận khi chưa thiết kế lại thời điểm cấp replay.

## Replay và clock

Replay metadata gồm config bất biến/hash, seed, engine version, start time server, tick/hash mỗi 120 tick, final hash và official result. Client ước lượng clock offset bằng midpoint HTTP RTT, bắt kịp tối đa 180 tick/frame. Simulation giữ 30Hz khi giảm FPS. Nếu lệch hash, renderer phục hồi final snapshot chính thức và báo lỗi. Đây là phục hồi về kết quả cuối; chưa có khôi phục mượt từ checkpoint trung gian.

Không chấp nhận kết quả do client gửi. Engine version không tương thích sẽ bị từ chối. Khi cập nhật engine cần hoàn tất phòng cũ hoặc giữ bản engine cũ cho replay.
