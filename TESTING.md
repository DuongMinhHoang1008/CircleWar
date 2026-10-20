# Kiểm thử

## Gameplay v10 — 2026-10-19

- TypeScript `npm run typecheck`: pass.
- `npm run build`: pass (Vite bundle chính vẫn vượt 500 KiB; Wrangler chỉ chạy `--dry-run`).
- Test suite không chạy cho thay đổi gameplay v10 trong lượt triển khai này. Các kết quả v9 bên dưới là lịch sử, không xác nhận shop/bench/merge mới.
- Kiểm tra thủ công: mỗi người vào có 1 starter; mua quân lên bench; thử giới hạn 5 quân dự bị và 8 vật phẩm; reroll shop 5 ô; nâng sân 1→2 với 5G, 2→3 với 10G; deploy quân và hợp nhất bản sao level 1; kiểm tra tiền thưởng vòng và item_20 với Hoàng Tử; hoàn thành trận/replay.

## Multiplayer replay format 1 — 2026-10-19

- `npm test`: 59/59 Vitest pass.
- `npm run build`: TypeScript, Vite production build và Wrangler Worker dry-run pass. Vite vẫn cảnh báo bundle chính vượt 500 KiB.
- `npm run test:integration`: pass với 20 người chơi/60 fighter, replay nén thành 16 chunks, 581 frames, 1,740 ticks; kiểm tra từng chunk count/hash, session/auth, 46 actions và WebSocket reconnect. Mẫu local đo 242,960 compressed bytes và 323,952 base64 storage bytes.
- `npm run test:recovery`: pass, gồm 100 Node/workerd seed và SQLite Durable Object restart; kiểm tra lại các replay chunk sau khi mô phỏng tiếp tục.
- `npm run test:browser`: pass, gồm 100 seed Chromium/Node parity, responsive UI, session restore và trận multiplayer thực phát recorded chunks trong Arena; không có page errors.

Đây là kiểm thử local, không phải Cloudflare production benchmark. Chưa đo CPU/quota production, soak test dài, lỗi giữa storage commit, hoặc kiểm thử mạng bị ngắt giữa playback trên thiết bị di động thật.

## Kết quả cập nhật ngày 19/10/2026

### Pool v9 và hội bạn

- **59/59 test pass**, gồm toàn bộ 20 Super/skill, 13 cặp/9 bộ ba, đúng tên/thành viên mười ba hội, cộng dồn tự động, mốc 2/3, giới hạn proc, khoảng cách, member chết, không hồi sinh và hash group state qua checkpoint và 20 khung vũ khí không chồng lấn.
- `npx tsx tests/integration/expansion-browser.ts` kiểm tra nhân vật hoa, tên/mô tả Courage, tải atlas, tự mở mọi hội/liên kết theo đội hình, Full Combo/Ghép đôi theo thành phần, loại trừ hội Sếp, nhãn hạt nhân, popup đầy đủ và mobile. Ảnh `reports/rose-character-*.png`, `reports/weapon-arena-desktop.png`.
- `catalog-browser.ts` hiện kiểm tra 39 popup (20 nhân vật, 19 món). Recovery tạo phòng với Hộp Quà/Họa Sĩ/Hoàng Tử, Full Combo mốc ghép đôi và đặc tính Kiểm soát trước khi restart để kiểm chứng cả state mới; 100 mẫu Node/workerd có đủ 6 hội mới.

### Catalog v5

- **42/42 test pass**: 19 Super/chiêu tự động, baseline/affinity, bậc vũ khí, bảo hộ thấp máu, khiên hết hạn, mốc chấm công/sữa, chậm/kháng chậm, đủ 12 cặp/8 bộ ba kích hoạt đúng sự kiện, source chết, bản sao, hash checkpoint và nhiều seed full roster. Backend kiểm tra protocol 2, điều kiện liên kết, unique phụ kiện, nâng/tháo/trang bị và snapshot khóa.
- `npx tsx tests/integration/catalog-browser.ts`: mở đủ 38 hồ sơ, Escape, chọn đội/bộ ba, trang bị hợp cạ, xem chỉ số trong trận và không overflow mobile. Ảnh popup trong `reports/character-popup-*.png`, `reports/item-popup-mobile.png`.
- Parity browser/recovery hiện trộn roster mới và sáu lớp cũ; recovery còn kiểm tra phòng mới qua restart SQLite. Không chỉ xác minh catalog ở UI.

### Cập nhật engine v4 — tăng nhịp round & bo vuông

- 28/28 Vitest pass: thêm tăng chỉ số từ baseline, điều chỉnh vận tốc/cooldown, reset round, trần tăng nhịp, khôi phục qua mốc 10 giây và bo vuông trên sân ngang/dọc/vuông với nhiều lịch thu.
- Typecheck, production frontend và Worker dry-run pass. 100 seed Node/Chromium và 100 seed Node/workerd khớp; recovery SQLite/session/simulation pass. Browser desktop/mobile và restore phiên pass.
- Benchmark 60 nhân vật, seed 12345: 2105 tick (70,17 giây), 422,41ms wall, 453ms process CPU; snapshot 56276 byte. Khác biệt thời lượng so với v3 là kết quả của cả bo vuông và tăng nhịp, chưa phải thống kê cân bằng nhiều seed.
- Lệnh bổ sung `npx tsx tests/integration/pacing-browser.ts` kiểm tra HUD sau giây 60, reset nhịp khi bắt đầu round mới, mobile overflow và chụp bo cuối vào `reports/pacing-square-desktop.png` / `reports/pacing-square-mobile.png`.

### Kết quả v3 trước thay đổi nhịp (lịch sử)

- TypeScript typecheck và production build frontend/Worker dry-run: pass.
- Vitest 5.0.5: **24/24 test pass**, gồm bo dạng tường, tiếp tục trận sau mốc thu tường, giới hạn checksum trận dài và chuyển timer lobby cũ sang lịch thu tường.
- Đối chiếu **100 seed trên Node, Chromium 155 và workerd**: pass; có cấu hình 60 nhân vật.
- Test tích hợp 20 guest session/46 action và WebSocket reconnect: pass.
- Dừng/khởi động lại runtime với cùng SQLite, khôi phục session và tiếp tục simulation: pass.
- Kiểm thử canvas, tạo phòng, reload phiên và mobile 390px: pass, không có page error.
- npm audit sau cập nhật dependencies: **0 vulnerabilities**.
- Benchmark engine v3, 60 nhân vật/seed 12345: 4653 tick (155.1 giây trong game), 440.73ms wall, 437ms process CPU, batch 120 tick lớn nhất 121.58ms, final snapshot 42954 byte. Trận kết thúc do chỉ còn một đội, vượt mốc thu tường 60 giây. Thông số theo máy và tải tại thời điểm chạy, không đại diện production.

Báo cáo có thể tái tạo trong `reports/benchmark.json`, `reports/integration.json`, `reports/browser.json`, `reports/recovery.json`.

## Tự động

`npm test`: test thuần trên Node; 100 seed, có trận 60 nhân vật, đối chiếu hash/kết quả, checkpoint restore với batch 37 tick, sáu lớp gây damage và kích hoạt Super; kiểm tra toàn bộ count 2–60 spawn không chồng lấn. Physics: tường/góc/tốc độ cực lớn, cùng/khác khối lượng, trùng tâm và ba bóng, hình học capsule, căn nguyên. Room: exact team size, host/settings, 20 slots, chuyển host, mua/equip atomic, khóa giao dịch, settlement idempotency, comeback, elimination và leave giữa preparation.

`npm run test:integration`: chạy với Wrangler đang mở, tạo 20 phiên thật qua HTTP, kiểm tra session giả, quyền host, khán giả, mua đồng thời cùng UUID, WebSocket reconnect và hash replay server so với Node. Kết quả `reports/integration.json`. Các phiên chỉ lưu ở local Wrangler, không commit token.

`npm run test:browser`: cần Chrome và web/worker local. Playwright mở canvas WebGL, khởi động lại offline, chạy cùng 100 input trong Node và Chromium, tạo phòng từ UI, reload khôi phục phiên, kiểm tra không overflow ở 390px. Chụp `reports/desktop.png` và `reports/mobile.png`; ghi `reports/browser.json`.

`npm run test:recovery`: dùng Miniflare/workerd riêng để chạy 100 input so với Node. Bundle Worker, tạo phòng hai người, bắt đầu simulation, dừng runtime, tạo instance mới với cùng SQLite persist path, xác minh session, membership và kết quả replay phục hồi. Ghi `reports/recovery.json`. Thư mục SQLite `reports/recovery-*` được gitignore vì chứa session hash. Pin Miniflare đúng phiên bản Wrangler dùng, kể cả suffix beta của công cụ dev, để tránh khác runtime hoặc tag latest cũ.

`npm run benchmark`: warmup rồi chạy một seed, mỗi mức 2/10/20/40/60 nhân vật. Đo wall time, process CPU (bao gồm JIT/GC thread), tick throughput, batch max 120 tick, heap process và snapshot byte size. Broad phase báo số cặp grid so với n(n−1)/2. Đây là benchmark trên máy phát triển, **không phải proof CPU Free production**. Chưa có benchmark thống kê nhiều lượt hoặc so thời gian grid/naive cho từng density.

## Giới hạn của bằng chứng

- 100 seed deterministic dùng mốc dừng thu tường 10 giây để kiểm tra trên cả ba runtime; từng trận vẫn chạy đến khi chỉ còn một đội. Test riêng chứng minh còn hai đội sau mốc thu tường vẫn tiếp tục, tường giữ nguyên cả ở tick 100000; có test giới hạn metadata trận dài. Không phải fuzz toàn bộ trạng thái có thể có.
- Test 20 người dùng client HTTP/WebSocket tự động trên một máy; chưa là 20 trình duyệt thật qua Internet.
- Test recovery dừng workerd/persist rồi khởi động lại. Chưa fault inject crash chính giữa storage commit, quota failure hoặc downtime Cloudflare thật.
- Chưa chứng minh không overlap sau mọi cấu hình đa vật thể; solver ba pass có thể còn penetration nhỏ trong đám đông dày.
- Chưa soak test nhiều phòng, security penetration test, thống kê balance dài hạn hoặc kiểm thử trên iOS/Android GPU thực.
- Build có thể cảnh báo bundle chính >500KiB trước gzip; chunk splitting sâu hơn là việc tối ưu còn lại.

## Kiểm tra thủ công trước public rollout

Hai profile tạo/vào phòng; xác nhận mỗi người có một starter, mua quân/vật phẩm, reroll, nâng giới hạn sân, kéo quân giữa bench/sân và hợp nhất bản sao; xác nhận túi/bench từ chối khi đầy, ready khóa giao dịch, round payout rồi rematch. Tắt backend/mạng rồi bật lại, reconnect giữa replay. Thử Chrome/Firefox/Safari, âm thanh sau tương tác người dùng, giảm hiệu ứng và viewport điện thoại. Deploy staging và đo CPU/duration/SQL requests thật trước khi tuyên bố quy mô Free.
