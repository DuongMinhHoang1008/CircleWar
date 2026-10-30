# Triển khai

Production dùng Cloudflare Pages và Cloudflare SQLite Durable Objects; không cần VPS hoặc máy cá nhân chạy liên tục.

## Production hiện tại — 30/10/2026

- Website: https://riseon-ultimate-battle.pages.dev
- API: https://circle-chaos.circle-chaos.workers.dev
- Engine chaos-integer-v39; release 2026.10.30.2. Build từ workspace chưa commit trên nền af93e74528ed912884bd56a83fbaf641b7eb0386.
- Worker version: 4456f145-d1af-42c3-89cc-636d0b0074d6.
- Pages deployment: https://8478f7a9.riseon-ultimate-battle.pages.dev.
- Đã triển khai gói rarity gốc/hợp cạ v39, 99 Bí kỹ và sprite/VFX mới, bảng thống kê trận thu gọn.
- Mô phỏng đàn kiến ẩn mặc định, module tải lazy. Cài đặt → Mã truy cập → 1824 → Mở công cụ; reload khóa lại. Đây là chốt hiển thị client, không phải xác thực server.
- Kiểm tra trước deploy: 534 tests đạt trước thay đổi ẩn menu, TypeScript/build và Worker dry-run đạt; access-code smoke local đạt. Không chạy mô phỏng đàn kiến sau cân bằng.
- Production API/CORS, hồ sơ/hòm thư thử, phòng/WebSocket, sân/atlas và giao diện smoke đạt. Index, bundle và bốn atlas khớp SHA-256 bản build. Báo cáo reports/production-2026-10-30-v39/.

## Lịch sử production — 29/10/2026

- Website: https://riseon-ultimate-battle.pages.dev
- API: https://circle-chaos.circle-chaos.workers.dev
- Engine: `chaos-integer-v36`, giao diện v`2026.10.29.3`, triển khai ngày 29/10/2026 từ bản làm việc trên nền commit `af93e74528ed912884bd56a83fbaf641b7eb0386` của `main` (gồm các thay đổi chưa commit).
- Worker version: `9bd19d99-dd5a-4f7e-97d7-857db9b2b2c4`.
- Pages deployment: https://40df5a62.riseon-ultimate-battle.pages.dev.
- Bí kỹ: 81 nhánh thay đường đạn, hình đánh, phản công hoặc Super; Hộp Quà có ba AI đệ riêng. Có sân thử đủ 33 nhân vật/99 nhánh từ Hành trình và Catalog, cùng seed/đội hình, tạm dừng/xem chậm/chạy lại, không cộng thưởng. Chi tiết và giới hạn cân bằng tại `docs/MASTERY_FORMS_V36.md`; thiết kế v35 được giữ trong `docs/MASTERY_REDESIGN.md` để tra lịch sử.
- VFX đủ 33 nhân vật/99 Bí kỹ: 792 khung hoạt ảnh, hình đạn/vệt bay, chém, mìn, hồi lưu, triệu hồi và hỗ trợ theo chủ đề nhân vật. Có cache atlas, pool 40/12 hiệu ứng, chế độ giảm/tắt VFX. Chi tiết tại `docs/MASTERY_VFX.md`.
- Catalog có sáu mục, gồm 15 trạng thái, 12 cơ chế combat, 99 Bí kỹ và 61 mục liên kết/hội/tộc/vai trò; tìm kiếm không dấu, bộ lọc và chi tiết nhân vật liên quan.
- Đi ải, thử thách ngày và bài tập đổi seed mỗi lần bắt đầu/đấu lại; mô phỏng sinh seed ngẫu nhiên khi vào chế độ và chạy ván mới. Multiplayer tiến RNG mỗi vòng/trận; replay và trận viễn chinh đang dở giữ seed đã lưu. Đội thử thách ngày dùng chung cả ba đối thủ, gồm trang bị và Bí kỹ, giữ qua reload.
- Giữ Kho đồ tinh gọn, viễn chinh roguelike 12 tầng, hành trình đủ 33 nhân vật và hiệu ứng Cộng hưởng. Tổng thưởng vượt 12 tầng là 150 Pack thường, 15 Pack Boss và một Rương chọn Sử thi; phần dư chuyển Hòm thư. Chi tiết và giới hạn cân bằng tại `docs/ADVENTURE_V2_2026-10-28.md`.
- Trước deploy: 521/521 tests trong 36 file, typecheck, production frontend build và Worker dry-run pass. Manifest `release.json` đồng bộ v`2026.10.29.3`.
- Browser smoke production pass: release, API/CORS, hồ sơ và nhận thư lưu qua reload, phòng/WebSocket, sân vuông/20 giây và bốn atlas gốc tải thành công; không page error. Báo cáo `reports/production-2026-10-29-vfx/smoke/production-browser-v36.json`. Phòng thử được rời sau kiểm tra.
- Index, bundle JavaScript production và bốn atlas Bí kỹ có SHA-256 khớp hoàn toàn bản build. Báo cáo `reports/production-2026-10-29-vfx/assets/assets.json`. Kiểm tra 99 sân thử desktop/mobile ở `reports/production-2026-10-29-vfx/mastery/`; fixture dùng hồ sơ riêng. Metadata tại `reports/deployment-2026-10-29-vfx.json`. Báo cáo Catalog/Hành trình của bản v35 vẫn giữ tại `reports/production-2026-10-29/`.
- Vòng đang mô phỏng bằng engine cũ được kết thúc không trao thưởng; giữ hồ sơ/bộ sưu tập, chủ phòng mở trận mới qua REMATCH. Replay format 1 đã hoàn thành vẫn được đọc từ frame lưu sẵn. Báo cáo các phiên bản trước trong `reports/` được giữ làm lịch sử.

Lệnh triển khai PowerShell từ thư mục gốc, sau `npx wrangler login`:

```powershell
npm test
npm run build
npm run deploy:worker
$env:VITE_API_URL = 'https://circle-chaos.circle-chaos.workers.dev'
$env:BASE_PATH = '/'
npx vite build --config apps/web/vite.config.ts
npx wrangler pages deploy dist/web --project-name riseon-ultimate-battle --branch main
$env:TEST_WEB = 'https://riseon-ultimate-battle.pages.dev'
$env:TEST_API = $env:VITE_API_URL
npx tsx tests/integration/deployment-smoke.ts
```

Smoke test tạo hồ sơ/phòng thử riêng, kiểm tra CORS, kết nối lại hồ sơ, WebSocket, đấu trường vuông, thời gian thu 20 giây, atlas VFX cũ và bốn atlas v26. Phòng thử được rời sau kiểm tra. `npm run build` chỉ dry-run Worker; cần chạy `deploy:worker` riêng như trên.

## Cloudflare Workers

1. Tạo tài khoản Cloudflare, bật Workers Free và workers.dev subdomain.
2. Trong `apps/worker/wrangler.jsonc`, thay `ALLOWED_ORIGINS` bằng origin website chính xác, ví dụ `https://yourname.github.io`. Origin không gồm `/repository/`. Có thể giữ localhost để phát triển, ngăn cách bằng dấu phẩy. Không dùng wildcard.
3. Đăng nhập và deploy:

```sh
npm ci
npx wrangler login
npm run build
npm run deploy:worker
```

Wrangler tạo bindings `ROOMS`, `PROFILES`, `TRADES`, `LEAGUES` với các migration SQLite `v1`, `v2`, `v3`, `v4`. Không đổi migration đã deploy; thêm migration mới nếu thay class. Không dùng KV-backed DO cũ vì không phù hợp Free. Worker URL dạng `https://circle-chaos.<account>.workers.dev`.

`GET /health` trả trạng thái. Source không yêu cầu shared secret frontend hoặc API key của người dùng. Khi CI deploy Worker, dùng Cloudflare API token scope tối thiểu qua secret server-side; không đặt vào biến `VITE_*`.

## GitHub Pages (phương án thay thế)

1. Push repository lên GitHub, nhánh `main`.
2. Settings → Pages → Source = GitHub Actions.
3. Settings → Secrets and variables → Actions → **Variables**: đặt `VITE_API_URL` bằng Worker HTTPS URL (không dấu `/` cuối).
4. Chạy workflow `.github/workflows/deploy-pages.yml`, hoặc push `main`.
5. Workflow typecheck/test, build với base `/<repository>/` (tự dùng `/` cho repo `username.github.io`), upload artifact rồi deploy Pages. Cấu hình mặc định `./` cũng dùng asset tương đối. Không dùng client-side route cần SPA fallback.

Build thủ công PowerShell:

```powershell
$env:VITE_API_URL = 'https://circle-chaos.YOUR-ACCOUNT.workers.dev'
$env:BASE_PATH = '/YOUR-REPOSITORY/'
npx vite build --config apps/web/vite.config.ts
```

Nội dung deploy nằm trong `dist/web`. Kiểm tra backend Origin allowlist trùng với origin Pages. Mở hai trình duyệt khác profile, tạo/vào phòng, chơi một vòng và thử reconnect trước khi công bố.

## Free-tier đã đối chiếu ngày 18/10/2026

Nguồn chính thức:

- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/durable-objects/platform/limits/
- https://developers.cloudflare.com/durable-objects/best-practices/websockets/

SQLite DO có trên Free. Theo bảng pricing: 100.000 DO request/ngày, 13.000 GB-s duration/ngày, 5 triệu rows read/ngày, 100.000 rows write/ngày, tổng storage 5GB; vượt quota làm thao tác bị từ chối. HTTP request, WebSocket message và Alarm đều có thể đóng góp usage. Hibernation tránh giữ duration khi nhàn rỗi, nhưng active simulation/persistence vẫn tốn tài nguyên. Mỗi setAlarm là một row write. Không có cam kết miễn phí vĩnh viễn hoặc uptime tuyệt đối.

Trang limits ghi DO CPU mặc định 30 giây/invocation; **đó không phải ngân sách CPU của entry Worker thường**, cần kiểm tra thêm Workers limits trong dashboard cho plan. Source chia 120 tick/Alarm và persist toàn trạng thái, không đặt `limits.cpu_ms` yêu cầu Paid. Trang limits hiện có thông tin không nhất quán về storage mỗi object (bảng ghi 10GB, phần lỗi ghi 1GB cho Free); thiết kế này giữ một record nhỏ hơn 2MB, dùng mức bảo thủ và kiểm tra dashboard khi deploy.

Benchmark Node local 60 nhân vật được lưu trong `reports/benchmark.json`; không thể quy đổi thành CPU production. Cần deploy staging và đo Workers metrics/CPU/row usage cho nhiều phòng trước khi xác nhận mức tải Free. Chưa có số đo production. Public rollout cần thêm chống spam create/join tại edge và load test nhiều phòng; xem IMPLEMENTATION_STATUS.

## Lưu trữ và vận hành

Wrangler local persist trong `.wrangler` dưới project Worker; không commit. Phòng lobby/finished không thay đổi gameplay trong 24h được cleanup bằng Alarm. Replay chỉ giữ vòng gần nhất để giới hạn storage. Session hết hạn sau bảy ngày. `GET /api/rooms/CODE/export` với Bearer token xuất public room snapshot và replay hiện tại; không chứa token hash hoặc session người khác. Đây là export dữ liệu chơi, chưa phải full provider migration tool.

Sau khi thay engine version, không ghi đè engine của phòng đang mô phỏng. `advance` kết thúc vòng không tương thích mà không trao thưởng; chủ phòng có thể mở trận mới, không cần chạy engine mới trên state cũ. Theo dõi lỗi quota, các lần Alarm retry và divergence trước khi mở rộng.

## Replay format 1 rollout

Replay frames are stored as gzip-compressed, base64 values under per-room keys scoped to game, round and chunk index. Room state and chunk writes commit in one Durable Object storage transaction. The replay metadata endpoint omits seed, official result and terminal simulation state; authenticated clients request chunks individually. The current application has no live battle action that can use information from later replay chunks, but the frames reveal the winner before playback ends.

Completed old-format replays use a deterministic compatibility path, which is not guaranteed across engine versions. Persisted simulations with a different engine version are cancelled without settlement; same-engine simulations that predate recording begin capture at their first available state. Compatibility with every historical Durable Object record has not been measured by the deployment smoke test. Deploy Worker and frontend together. Confirm staging CPU, storage, alarms and quota behavior before increasing load.

Xác nhận thêm ngày 30/10/2026: kiểm thử mã truy cập trên production đạt (ẩn mặc định, mã sai bị từ chối, 1824 mở công cụ, reload khóa lại). Không chạy mô phỏng trong kiểm thử này.
