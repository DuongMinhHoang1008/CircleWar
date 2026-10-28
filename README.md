# RiseOn Ultimate TCG

## Phiên bản 2026.10.28.2 — 2026-10-28

Thử thách ngày dùng pool 9 nhân vật, tự lưu một đội dùng chung cho cả ba đối thủ; mục xếp hạng đã được bỏ khỏi giao diện. Đi ải, thử thách ngày, bài tập và mô phỏng đổi seed mỗi trận mới; replay và trận viễn chinh đang dở giữ seed đã lưu. Viễn chinh roguelike có 12 tầng, shop, nâng cấp, chiêu mộ, HP giữ giữa trận và thua là mất run. Vượt đủ tháp nhận tổng 150 pack + 15 Pack Boss + 1 Rương chọn Sử thi mỗi ngày; pack dư vào Hòm thư. Cả 33 nhân vật có hành trình và thông báo mở Bí kỹ; liên kết có Cộng hưởng đặc trưng. Xem [thiết kế, thưởng và kiểm chứng](docs/ADVENTURE_V2_2026-10-28.md).

Web auto-battler sưu tập thẻ với 33 nhân vật và 33 vật phẩm, đội tối đa ba quân. Trang **Hành trình** dẫn đến đi ải, thử thách ngày Lv.10 cho mượn, tháp viễn chinh roguelike và hành trình nhân vật. Kho đồ có năm preset, tìm/lọc, khóa thẻ và so sánh trang bị. Thưởng vượt hàng chờ được giữ để nhận sau; trận cục bộ có pause/tăng tốc và replay.

API xếp hạng cũ được giữ để tương thích dữ liệu; giao diện mới dùng thử thách ngày. Backend vẫn giữ binding `LEAGUES` và migration `v4` trong Wrangler. Engine hiện hành: `chaos-integer-v34`.

Xem [chi tiết tính năng, tương thích và kiểm chứng](docs/RELEASE_2026-10-27.3.md) cùng [roadmap](docs/DEVELOPMENT_ROADMAP.md). Thay đổi này đã được triển khai trong source; thông tin auto-chess v10 phía dưới được giữ làm lịch sử, không mô tả luồng hiện hành.

## Lịch sử nền auto-chess

Game web auto-battler multiplayer: nhân vật hình tròn nảy theo vật lý bi-a, tự dùng vũ khí và Super; người chơi xây đội hình qua shop, bench, hợp nhất quân và nâng giới hạn ra sân giữa các vòng.

Engine v10 có **20 nhân vật dùng avatar thật, 20 vật phẩm có sprite SVG riêng, 20 mẫu vũ khí, 13 liên kết đôi, 9 bộ ba và 13 hội bạn tự cộng dồn**. Mỗi người khởi đầu với một nhân vật. Shop có 5 mặt hàng nhân vật/vật phẩm và reroll; quân mua được chờ trên bench 5 ô, vật phẩm có túi 8 ô. Hợp nhất hai bản sao cùng loại/cùng cấp để lên level; nâng giới hạn quân ra sân từ 1 lên 2 rồi 3 bằng Gold. Bàn cờ tướng hợp cạ Hoàng Tử Ngậm Hoa. Trận có hiệu ứng slash, khiên, hồi máu, Super dạng tranh vector, hiệu ứng vỡ quân và rung sân. Multiplayer vẫn kiểm tra giao dịch ở server. Sau cập nhật, client cần tải lại và replay cũ không dùng chung luật mới. Chi tiết tại [GAME_DESIGN.md](GAME_DESIGN.md).

## Chạy local

Yêu cầu Node.js **22.12+** (đã kiểm thử 22.23.3), npm và Chrome cho bài test trình duyệt.

```sh
npm ci
npm run dev
```

Mở http://127.0.0.1:5173. Web chạy ở 5173; Wrangler/SQLite Durable Objects ở 8787. Không cần tài khoản Cloudflare để chơi local. Backend URL mặc định là `http://127.0.0.1:8787`; có thể nhập lại trên màn hình Multiplayer, hoặc đặt `VITE_API_URL` trong `apps/web/.env.local`.

- **Đấu trường tập:** chọn 2–60 nhân vật và seed; trận chạy bằng engine thật trên máy.
- **Multiplayer:** tạo phòng, copy mã tám ký tự, dùng trình duyệt/profile khác để vào. Mỗi profile lưu một guest token. Tab cùng profile dùng chung danh tính; muốn thử nhiều người, dùng context/profile khác.
- Mỗi người chọn một nhân vật khởi đầu. Phòng có 2–20 người; host vẫn đặt giờ chuẩn bị, bo, cứu trợ và khán giả. Bấm Sẵn sàng; host bắt đầu.
- Mỗi vòng, thứ hạng trao Gold. Shop 5 ô bán quân và đồ; reroll giá 2G. Quân mua vào kho 5 ô, vật phẩm vào túi 8 ô. Kéo quân trùng lên nhau để hợp nhất; mua nâng giới hạn ra sân 1→2→3 bằng 5G/10G. Nút nâng quân luôn hiện cạnh shop. Bấm Sẵn sàng khóa giao dịch; cả phòng sẵn sàng hoặc hết giờ sẽ chạy trận.
- Server tính trước kết quả theo từng batch, persist checkpoint; mọi máy tự phát replay cùng seed. Khi replay kết thúc server kết toán, mở vòng mới. Mất kết nối không hủy phòng.

## Lệnh

| Lệnh                                     | Chức năng                                                           |
| ---------------------------------------- | ------------------------------------------------------------------- |
| `npm run dev`                            | Web + backend local                                                 |
| `npm run dev:web` / `npm run dev:worker` | Chạy riêng từng ứng dụng                                            |
| `npm run typecheck`                      | Kiểm tra TypeScript                                                 |
| `npm test`                               | Test engine, vật lý, giao dịch/phòng                                |
| `npm run test:integration`               | Test 20 người trên Worker đang chạy local                           |
| `npm run test:browser`                   | Chrome: checksum 100 seed, UI desktop/mobile; cần cả hai dev server |
| `npm run test:recovery`                  | workerd: 100 seed và restart SQLite; tự tạo runtime riêng           |
| `npm run benchmark`                      | Đo 2/10/20/40/60 nhân vật, ghi `reports/benchmark.json`             |
| `npm run build`                          | Typecheck + frontend production + Worker dry-run                    |
| `npm run deploy:worker`                  | Deploy Cloudflare; yêu cầu đăng nhập                                |

Source: `apps/web` (React/Pixi), `apps/worker` (Durable Objects), `packages/battle-engine` (engine độc lập), `packages/shared` (balance, protocol, phòng và giao dịch).

Xem [ARCHITECTURE.md](ARCHITECTURE.md), [GAME_DESIGN.md](GAME_DESIGN.md), [TESTING.md](TESTING.md), [DEPLOYMENT.md](DEPLOYMENT.md) và [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md). Chưa deploy GitHub Pages/Cloudflare production. Các tính năng chưa hoàn tất/kiểm chứng được ghi rõ trong trạng thái triển khai.
