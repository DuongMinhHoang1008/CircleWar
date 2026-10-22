# Triển khai

Production dùng Cloudflare Pages và Cloudflare SQLite Durable Objects; không cần VPS hoặc máy cá nhân chạy liên tục.

## Production hiện tại

- Website: https://riseon-ultimate-battle.pages.dev
- API: https://circle-chaos.circle-chaos.workers.dev
- Engine: `chaos-integer-v24`, giao diện v`2026.10.21.4`, triển khai ngày 21/10/2026.
- Worker version: `9d0ed1c9-007e-48d0-a019-2e8aff398bcb`.
- Pages deployment: https://04fcc027.riseon-ultimate-battle.pages.dev.
- Bản này gồm 33 nội tại riêng, bộ chiêu của 5 Huyền thoại, ảnh Ủn mới, vũ khí #31–33 cầm dọc, Pack Boss/tỉ lệ, hợp cạ và ải không scale chỉ số ẩn. Popup cập nhật và thưởng đi ải/multiplayer dùng cùng modal căn giữa viewport.
- Trước deploy: 168/168 test pass; typecheck, frontend build và Worker dry-run pass. Audit offline 6.864 trận cân bằng và 4.720 trận campaign đều qua giới hạn/counter; 52 trường hợp ải thường đều có counter cùng cấp. Đây không phải win rate người chơi thật.
- UI local: `reward-popups-browser.ts` kiểm tra popup cập nhật/thưởng trên desktop, mobile, landscape; ải thường, boss 1/3 pack, kho đầy, focus/Escape và không cộng thưởng trùng. Callback Arena và trạng thái FINISHED là fixture; profile được lưu bằng Worker local thật.
- Production smoke sau deploy: `profile-sync-smoke.ts` pass health/CORS, SAVE kết quả 100 pack trên hồ sơ thử riêng, retry idempotent, INIT cũ không ghi đè thưởng, release .4 và atlas 256 frame. Báo cáo `reports/deployment-2026-10-21.json`.
- `deployment-smoke.ts` pass trên origin production: popup căn giữa desktop/mobile, khôi phục hồ sơ, SVG vũ khí đúng trục, mô phỏng sân vuông/20 giây, màu đội và phòng/WebSocket thực; không page error. Phòng thử được rời sau kiểm tra. Báo cáo `reports/production-browser-v24.json`; không chạy load test production.

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

Smoke test tạo hồ sơ/phòng thử riêng, kiểm tra CORS, kết nối lại hồ sơ, WebSocket, đấu trường vuông, thời gian thu 20 giây và atlas VFX 64 frame. Phòng thử được rời sau kiểm tra. `npm run build` chỉ dry-run Worker; cần chạy `deploy:worker` riêng như trên.

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

Wrangler tạo bindings `ROOMS`, `PROFILES`, `TRADES` với các migration SQLite `v1`, `v2`, `v3`. Không đổi migration đã deploy; thêm migration mới nếu thay class. Không dùng KV-backed DO cũ vì không phù hợp Free. Worker URL dạng `https://circle-chaos.<account>.workers.dev`.

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

Sau khi thay engine version, không ghi đè engine của phòng đang mô phỏng. Cần kết thúc phòng cũ trước hoặc triển khai cơ chế giữ engine cũ. Theo dõi lỗi quota, các lần Alarm retry và divergence trước khi mở rộng.

## Replay format 1 rollout

Replay frames are stored as gzip-compressed, base64 values under per-room keys scoped to game, round and chunk index. Room state and chunk writes commit in one Durable Object storage transaction. The replay metadata endpoint omits seed, official result and terminal simulation state; authenticated clients request chunks individually. The current application has no live battle action that can use information from later replay chunks, but the frames reveal the winner before playback ends.

Completed old-format replays use a deterministic compatibility path; old active simulations begin recording from their first state after upgrade. Compatibility with preserved historical Durable Object records has not been measured by the deployment smoke test. Deploy Worker and frontend together. Confirm staging CPU, storage, alarms and quota behavior before increasing load.
