# Triển khai

Production dùng Cloudflare Pages và Cloudflare SQLite Durable Objects; không cần VPS hoặc máy cá nhân chạy liên tục.

## Production hiện tại

- Website: https://riseon-ultimate-battle.pages.dev
- API: https://circle-chaos.circle-chaos.workers.dev
- Engine: `chaos-integer-v31`, giao diện v`2026.10.27.2`, triển khai ngày 27/10/2026 từ commit `489e537` trên `main`.
- Worker version: `4fe83438-3e66-4aef-b36e-199c68b387b8`.
- Pages deployment: https://6b3165ac.riseon-ultimate-battle.pages.dev.
- Bản này cân bằng roster, tăng hiệu quả đệ và hỗ trợ, giảm các bộ chiêu vượt trội; thêm thống kê hồi máu/khiên/buff/debuff/khống chế/sống tới cuối. Cài đặt tự lưu, số damage mặc định tắt, màu riêng theo nguồn damage và số HP/khiên/máu ảo. Bo chỉ tăng nhịp, không tự trừ HP; giữ thông tin entry ải.
- Trước deploy: 267/267 tests, typecheck, production frontend build và Worker dry-run pass. Audit 15.312 trận mô phỏng gồm seed kiểm chứng riêng, 0 trận quá 180 giây; 512 mẫu ải có counter. Multiplayer 20 người local, replay nén/checksum và WebSocket reconnect pass. Chi tiết tại `TESTING.md` và `reports/roster-balance-v31.md`.
- Browser smoke production pass: release, API/CORS, hồ sơ và nhận thư lưu qua reload, phòng/WebSocket, sân vuông/20 giây và bốn atlas tải thành công; không page error. Báo cáo `reports/production-browser-v31.json`. Phòng thử được rời sau kiểm tra.
- Cài đặt production có năm công tắc, damage mặc định tắt và thay đổi lưu qua reload; báo cáo cân bằng đủ 33 nhân vật, năm so sánh trước/sau, mặc định đấu đội Lv.10 và không tràn ngang mobile. Báo cáo `reports/production-settings-v31.json`; metadata triển khai `reports/deployment-2026-10-27-v31.json`.
- Vòng đang mô phỏng bằng engine cũ được kết thúc không trao thưởng; giữ hồ sơ/bộ sưu tập, chủ phòng mở trận mới qua REMATCH. Replay format 1 đã hoàn thành vẫn được đọc từ frame lưu sẵn. Báo cáo v29 trong `reports/` được giữ làm lịch sử.

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

Sau khi thay engine version, không ghi đè engine của phòng đang mô phỏng. `advance` kết thúc vòng không tương thích mà không trao thưởng; chủ phòng có thể mở trận mới, không cần chạy engine mới trên state cũ. Theo dõi lỗi quota, các lần Alarm retry và divergence trước khi mở rộng.

## Replay format 1 rollout

Replay frames are stored as gzip-compressed, base64 values under per-room keys scoped to game, round and chunk index. Room state and chunk writes commit in one Durable Object storage transaction. The replay metadata endpoint omits seed, official result and terminal simulation state; authenticated clients request chunks individually. The current application has no live battle action that can use information from later replay chunks, but the frames reveal the winner before playback ends.

Completed old-format replays use a deterministic compatibility path, which is not guaranteed across engine versions. Persisted simulations with a different engine version are cancelled without settlement; same-engine simulations that predate recording begin capture at their first available state. Compatibility with every historical Durable Object record has not been measured by the deployment smoke test. Deploy Worker and frontend together. Confirm staging CPU, storage, alarms and quota behavior before increasing load.
