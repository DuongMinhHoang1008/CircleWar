# Kiểm thử

## v31 — 27/10/2026: thống kê hỗ trợ và cân bằng toàn roster

- Release local `2026.10.27.2`, engine `chaos-integer-v31`. Thêm số damage theo nguồn, hồi HP/khiên/máu ảo, cài đặt lưu trên trình duyệt (damage mặc định tắt), số liệu hỗ trợ và sống tới cuối trong lịch sử/replay/JSON.
- **267/267 tests pass** trên 28 file; TypeScript, Vite production build và Worker dry-run pass. Frontend vẫn có cảnh báo bundle lớn đã có từ trước.
- Audit sau cân bằng: **15.312 trận**, 0 trận chưa kết thúc trong giới hạn 180 giây. 12.408 trận gốc gồm solo Lv1/Lv10 có/không đồ, 3v3 với đồng đội đối chứng và FFA luân phiên đủ sáu vị trí; 2.904 trận Lv10 với seed offset 7919 kiểm chứng riêng. Các lượt seed kiểm chứng không dùng để chọn thông số trong vòng hiệu chỉnh. Chi tiết trước/sau và support: [báo cáo](reports/roster-balance-v31.md), [CSV](reports/roster-balance-v31.csv), [JSON đầy đủ](reports/roster-balance-v31.json).
- Chạy `npx tsx tests/performance/roster-audit.ts` để tái tạo cả mẫu gốc/kiểm chứng và báo cáo. `--aggregate-only` tổng hợp các phase đã có trong `test-results`; không chạy mô phỏng mới. `roster-report.ts` chỉ tổng hợp lại báo cáo. Baseline trước cân bằng lưu riêng trong `roster-balance-v31-before.json`.
- 450 mẫu hộ vệ đối đầu: trung vị 32,87 giây, P95 40,63 giây, tối đa 53,9 giây, không kẹt. Bỏ sát thương môi trường; tăng nhịp bo và chỉnh góc rất nhỏ sau 15 giây không giao tranh để tránh quỹ đạo song song. Đây là mẫu offline, không phải win rate hay thời lượng người chơi thật.
- Kiểm tra trình duyệt `settings-browser.ts` và `support-browser.ts`: công tắc độc lập, damage mặc định tắt, phân màu nguồn, số hồi/khiên, lịch sử hỗ trợ/hiệu ứng, xuất JSON, báo cáo đủ 33 nhân vật, desktop/mobile. `campaign-browser.ts`: 30 cấu hình và sáu trận hoàn tất trùng hash Node/Chrome. `campaign-tactics.ts`: 512 mẫu đội hình cùng cấp, mọi đối thủ được lấy mẫu có counter.
- `tests/integration/local.ts`: 20 người chơi trên Worker local pass, gồm xác thực, quyền host, draw idempotency, replay nén/checksum và WebSocket reconnect; 217 frame trong 7 chunk, 81.130 byte nén. Kết quả trong `reports/integration.json`.
- Không thay đổi cách hiển thị thông tin entry ải hoặc tăng chỉ số ẩn cho ải thường. Local web `http://127.0.0.1:5173`, Worker `http://127.0.0.1:8787`.

## v29 — 27/10/2026: hòm thư, vật lý đệ/trụ và đội hình ải

- Release `2026.10.27.1`, engine `chaos-integer-v29`. TypeScript, frontend production build và Worker dry-run pass; 251/251 unit tests pass.
- Kiểm tra hòm thư và lưu lịch sử nhận quà, rarity gốc khi mở pack, va chạm/đạn với đệ và trụ cố định, đổi chiều clash tức thì và nhịp quyết đấu cuối trận.
- `campaign-tactics.ts`: 512 trận offline, tám lối đánh ở cùng Lv.10, bốn seed và đổi hai phía xuất phát. Mỗi đội địch được lấy mẫu có counter thắng ít nhất 4/8; hiệu quả khác nhau theo build. Đây là mẫu kiểm tra, không phải tỉ lệ thắng người chơi thật. Kết quả ghi vào `test-results/campaign-tactics.json`.
- `campaign-browser.ts`: 30 cấu hình ải (đội 1/2/3 người, gồm boss và ải vượt trần cấp) trùng giữa Node/Chromium; sáu trận hoàn tất có hash giống nhau, không lỗi trình duyệt.
- `constructs-browser.ts`: parity qua toàn bộ trận cho năm cấu hình, kiểm tra mặt nạ tròn và trụ bất động trong replay.
- `deployment-smoke.ts` kiểm tra thêm nhận thư tân thủ, lưu lịch sử và tải lại. Đặt `TEST_REPORT_DIR` để chuyển báo cáo local vào thư mục riêng.

## v26 — 26/10/2026: 33 nhân vật và ba dạng biến hình

- Release 2026.10.26.2, engine chaos-integer-v26. Chi tiết tại [CHARACTER_KITS_V26.md](docs/CHARACTER_KITS_V26.md).
- Đã deploy production 26/10: browser/API/CORS, hồ sơ và WebSocket pass; bốn atlas v26 tải 200, không page error. Một trận Worker hai người hoàn tất 3.551 tick, 31 chunk gzip có checksum đúng. Báo cáo production-browser-v26.json, production-engine-v26.json và deployment-2026-10-26.json; không phải load test production.
- 211/211 tests pass; typecheck, Vite build và Worker dry-run pass. Có kiểm tra từng Super/checkpoint của 36 kit, hai trục tăng trưởng, proc riêng, thân/đạn, friendly fire, bẫy, đệ, boomerang, cổ phiếu, stun và Paralyzed trong chuỗi Super. Phòng đang mô phỏng bằng engine cũ được kết thúc không trao thưởng, giữ bộ sưu tập và có thể mở trận mới; không chạy v26 trên state v24.
- Worker local: 20 người chơi, replay ghi sẵn/nén và WebSocket reconnect pass (reports/integration.json). Đây là kiểm tra local.
- Art được tạo bằng built-in image_gen, bốn atlas WebP đã kiểm tra alpha/tải 200; chi tiết và prompt tại [ART_V26.md](docs/ART_V26.md). Replay giây 6 với chủ trụ/đệ đã chết vẫn có các construct hoạt động, không lỗi JS/WebGL trên desktop/mobile: reports/combat-v26-lifetime-browser.json và ảnh lifetime.
- reports/combat-v26-browser.json: 36 ca hash Node/Chrome khớp, không lỗi JS/render; replay fixture gồm 12 nhân vật, hai construct, vùng và đạn riêng. Không tràn ngang ở 390px; ảnh combat-v26-arena-desktop/mobile.png đã được xem kiểm tra. Fixture dùng Super đầy và HP cao để kiểm tra hình ảnh, không dùng đo cân bằng.
- reports/combat-v26-benchmark.json: 2–60 nhân vật đều kết thúc; mẫu 60 nhân vật 763 tick, khoảng 488 ms wall time trong Node khi đang chạy audit, cao nhất 27 đạn/4 construct/54 vùng. Không phải số đo GPU mobile hoặc CPU Cloudflare.
- Các báo cáo balance-initial/second/third/fourth/fifth/sixth và lifetime-initial là các lượt hiệu chỉnh lịch sử. Dùng báo cáo combat-v26-balance-audit cho kết quả sau cùng; không suy ra win-rate người chơi thật từ seed cố định. Có thể đặt biến môi trường BALANCE_REPORT khi chạy audit để giữ báo cáo theo phiên bản.

- Audit cuối: 6.864 trận, không kẹt; mọi card và build hợp cạ đều có counter trong mẫu. Bare duel tối đa 75%, đội tối đa 73%; build hợp cạ tối đa 77%. Đây là seed cố định, không bảo đảm mọi đội hình có sức mạnh ngang nhau. Hỗ trợ vẫn yếu hơn trong đấu đơn và phụ thuộc đội hình.

## v25 — 26/10/2026: trạng thái, hướng bắn và đồng bộ ngoài combat

- `npm test`: **184/184 pass**. `npm run build`: TypeScript, Vite production và Worker dry-run pass; vẫn có cảnh báo bundle lớn như bản trước.
- Hợp đồng và giới hạn cân bằng tại [COMBAT_V25.md](docs/COMBAT_V25.md). Các kết quả v24 bên dưới là lịch sử, không dùng làm số đo cân bằng cho engine mới.
- Kiểm thử mới kiểm tra Poison 5 tầng, Burn không stack, DoT sau khi nguồn chết, Blessing/giảm hồi phục, Paralyzed/cooldown/phần dư xoay, Frozen/di chuyển, checkpoint và replay; hướng bắn quét qua mục tiêu và chống bắn liên tục.
- Thống kê có kiểm thử khử trùng event/frame, bảo toàn kill/liên kết khi VFX burst, giới hạn 200 bản ghi, lỗi quota và dữ liệu hỏng. Pack Boss kiểm tra bảo hiểm thứ 50, Sử thi không reset và không trừ pack khi hết T4 khả dụng.
- `reports/combat-v25-balance-sample.json`: 132 trận đổi phía, không có trận kẹt, tối đa 1.882 tick trong mẫu. Chỉ là kiểm tra vận hành với hai kit tham chiếu, chưa là audit cân bằng toàn roster.
- `reports/combat-v25-browser.json`: Chrome desktop/mobile không page error; Huyền thoại bảo hiểm thật, bộ đếm round-trip Worker, lịch sử trận đi ải hoàn tất, reload, xuất JSON, không ghi trận thoát giữa chừng. Ảnh giao diện và JSON xuất có tiền tố `reports/combat-v25-analytics-`.
- `npm run test:integration`: 20 người trên Worker local, request mở pack trùng chỉ xử lý một lần, chunk replay/hash, field trạng thái/chỉ số mới và WebSocket reconnect. Fixture đã sửa đúng luồng `START` khóa round đầu trực tiếp.
- Chỉ kiểm tra local; không push/deploy trong lần cập nhật này.
- `reports/combat-v25-benchmark.json`: 2/10/20/40/60 nhân vật đều kết thúc; mẫu 60 nhân vật mất khoảng 590 ms wall time cho 1.213 tick trên Node khi máy đang chạy các kiểm tra khác. Không quy đổi số đo này thành hiệu năng GPU mobile hoặc CPU Cloudflare.

## v24 — 21/10/2026: 33 nội tại riêng và 5 bộ chiêu Huyền thoại

- `npm test`: 168/168 pass, gồm 33 nội tại thực, cooldown/giới hạn lượt/checkpoint, aura theo vị trí, tăng tầm vật lý, phóng xạ, vùng chiêu báo trước và đồ ăn hồi phục.
- TypeScript + Vite production build + Worker dry-run pass. Vite vẫn có cảnh báo bundle >500 KiB; log Wrangler đặt trong `.wrangler/logs` của workspace.
- `balance-audit.ts`: 6.864 trận kết thúc, cả 33 card trần và build hợp cạ Lv1/Lv10 đều có counter. Cao nhất: card trần 73%, nhóm thử đấu đội 67%, build hợp cạ 75%. Aura là hỗ trợ chuyên đội: 59% ở mẫu đấu đội, thấp hơn rõ trong solo. Đây là mẫu offline, không phải tỉ lệ thắng người chơi thật.
- `campaign-audit.ts`: 4.720 trận, đủ 52 trường hợp ải thường/solo/đội ba người, kể cả 999 và 10001, đều có counter thắng ít nhất 3/4 ở cùng cấp. Sửa cách kiểm tra đổi phía: engine sắp spawn theo team id, nên phải hoán đổi id thay vì chỉ đổi thứ tự mảng. Không thay đổi chỉ số ải.
- `boss-packs-browser.ts`: mô tả nội tại của cả 33 card trong popup (mở Chi tiết), vai trò Huyền thoại, pack/rate/pity/save, đủ ảnh mới, desktop/mobile và replay ải đều pass, không page error.
- `legendary-browser.ts`: render replay thực của 5 bộ chiêu, xác nhận aura/territory/radiation/hồi phục, ảnh Ủn trùng hash attachment. Ảnh `reports/legendary-desktop.png`, `legendary-mobile.png`, `vertical-weapons-desktop.png` xác nhận vũ khí #31–33 cầm dọc cùng trục va chạm.
- `reward-popups-browser.ts`: popup cập nhật, thưởng ải 1/5/10 và multiplayer căn giữa tại 1440×1000, 390×844 và 844×390. Kiểm tra Tab/Escape, kho 148→150, 1/3 Pack Boss, callback kết thúc lặp, reload không cộng thưởng trùng và không page error. Dùng fixture callback Arena và trạng thái FINISHED qua Connection; lưu hồ sơ bằng Worker local thật.
- Production smoke sau deploy pass: health/CORS, hồ sơ SAVE/retry/restore, release .4, asset, popup căn giữa, phòng/WebSocket và mô phỏng; không page error. `reports/production-browser-v24.json`, `reports/deployment-2026-10-21.json`.
- Release `2026.10.21.4`, engine `chaos-integer-v24`. Web local `http://127.0.0.1:5173`, Worker `http://127.0.0.1:8787`; kết quả production trong `DEPLOYMENT.md`.


## v23 — 21/10/2026: đội hình chiến thuật, hợp cạ và Pack Boss

- `npm test`: 126/126 pass, gồm 33 proc hợp cạ, giới hạn lượt/hồi, checkpoint, tỉ lệ pack và hai hạt nhân của Tất cả quỳ xuống.
- `npm run build`: TypeScript, Vite và Worker dry-run pass. Bundle vẫn có cảnh báo kích thước sẵn có.
- `balance-audit.ts`: 6.864 trận, không có trận chưa kết thúc. Mọi card trần và build hợp cạ cấp 1/10 có counter trong mẫu; tỉ lệ cao nhất 75% ở đấu đơn có trang bị, 72% ở card trần, 59% trong nhóm thử đấu đội. Đây là mẫu offline, không phải win rate người chơi thật.
- `campaign-audit.ts`: 4.720 trận trên bản đồ mặc định, 52 trường hợp ải/đội solo hoặc 3 người, gồm ải 999 và 10001. Mỗi trường hợp đều tìm được counter thắng ít nhất 3/4 lượt ở cùng cấp hiển thị. Chỉ số ải thường bằng chính xác `computeStats`.
- `boss-packs-browser.ts`: desktop/mobile, bảng tỉ lệ hai pack, asset mới, mở 3 Pack Boss, reload giữa animation, bảo toàn pack thường và pity, lưu hồ sơ 33+33 card vào Worker; không có page error. Ảnh trong `reports/boss-pack-*.png` và `reports/new-card-arena-desktop.png`.
- Local web: `http://127.0.0.1:5173`; Worker: `http://127.0.0.1:8787`. Không deploy production trong lần cập nhật này.

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
