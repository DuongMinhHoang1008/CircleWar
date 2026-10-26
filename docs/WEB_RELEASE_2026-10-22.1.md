# Thay đổi bản web 2026.10.22.1 so với source hiện tại

Ngày đối chiếu: **26/10/2026**, múi giờ Asia/Bangkok.

Tài liệu ghi nhận các thay đổi xác minh được từ patch notes và bundle JavaScript công khai của bản web. Đây là bản ghi phục vụ đối chiếu source, không phải kết quả khôi phục source gốc hay diff đầy đủ của backend.

## 1. Mốc phiên bản và nguồn đối chiếu

| Thành phần | Trạng thái tại thời điểm kiểm tra |
| --- | --- |
| Website production | https://riseon-ultimate-battle.pages.dev |
| Release manifest production | `2026.10.22.1` |
| Ngày phát hành ghi trong patch notes | 22/10/2026 |
| Tên bản cập nhật | Đi ải đa dạng, theo dõi đội hình |
| Source local | `2026.10.21.4` |
| Commit local và GitHub `main` | `ec338d096178e1f96fc9a35e1136a9483fa6fdd9` — `+ new char, new balance` |
| Trạng thái local trước khi ghi tài liệu | Không có thay đổi chưa commit |
| API production | `/health` trả HTTP 200, `{"ok":true,"protocol":4}` |

Nguồn web đã đọc:

- [Release manifest](https://riseon-ultimate-battle.pages.dev/release.json).
- [Bundle frontend tại thời điểm đối chiếu](https://riseon-ultimate-battle.pages.dev/assets/index-B-SEuYim.js).
- Patch notes `2026.10.22.1` và các phần xử lý đi ải, thống kê, mở Pack Boss trong bundle.

Nguồn local đã đối chiếu:

- `apps/web/public/release.json`.
- `apps/web/src/PatchNotes.tsx`.
- `apps/web/src/main.tsx`.
- `packages/shared/src/campaign.ts`.
- `packages/shared/src/packs.ts`.
- `apps/worker/src/index.ts`.

## 2. Đi ải

### Đội hình địch

- Bản cũ dùng danh sách 12 đội hình định sẵn và lặp lại theo tiến độ ải.
- Bản mới công bố **729 tổ hợp có liên kết**, thay cho vòng lặp 12 đội.
- Từ **ải 31**, ưu tiên đội có nhiều liên kết hoặc hội đủ ba người.
- Trang bị địch thay đổi trong giới hạn thông thường.

### Boss

- Source cũ tạo một boss thay thế toàn bộ đội địch; chỉ số boss được cường hóa để đối đầu đội người chơi.
- Patch notes mới mô tả đội boss gồm **một chỉ huy được cường hóa và hai quân hỗ trợ dùng chỉ số thường**.
- Chưa xác minh đầy đủ công thức chỉ số, danh sách chỉ huy và cách chọn hai quân hỗ trợ của bản mới.

### Màn hình trước trận

- Gọn lại còn đội địch và một câu mô tả.
- Bỏ gợi ý chọn đội/khắc chế mà source cũ hiển thị qua `strategy` và `counter`.
- Patch notes nêu không có luật phụ hoặc sổ tay trên màn hình này. Không có bằng chứng các mục đó từng tồn tại trong source local `.21.4`.

## 3. Trang Phân tích số liệu

### Điều hướng và lưu trữ

- Thêm mục **Phân tích số liệu** trong nhóm **Tra cứu** của menu.
- Tự lưu tối đa **200 trận hoàn tất gần nhất** trên trình duyệt hiện tại.
- Ghi nhận riêng ba chế độ: **Đi ải**, **Mô phỏng**, **Multiplayer**; multiplayer lưu theo từng vòng.
- Không ghi trận bị thoát giữa chừng; dữ liệu bắt đầu từ khi dùng bản cập nhật này.
- Dùng localStorage với khóa `circlewar-battle-analytics-v1`.
- Bản ghi mới đặt lên đầu danh sách; vượt 200 bản ghi thì bỏ bản cũ nhất.
- Không thêm trùng bản ghi có cùng ID.
- Nếu không lưu được, frontend báo người chơi giải phóng bộ nhớ trình duyệt.
- Không thấy cơ chế đồng bộ lịch sử phân tích lên server trong phần triển khai đã đối chiếu.

### Dữ liệu của mỗi trận

- ID bản ghi, chế độ và thời điểm lưu.
- Phiên bản engine, seed khi có, số tick và đội thắng.
- Số ải đối với bản ghi đi ải.
- Danh sách đơn vị: ID, đội, tên đội, nhân vật, level, trang bị và level từng trang bị.
- Các sự kiện hạ gục: tick, đơn vị gây đòn kết liễu và đơn vị bị hạ.
- Số lần liên kết và hội kích hoạt khi bản ghi có dữ liệu này.

### Thu thập sự kiện

- Sự kiện hạ gục lấy từ event `kill` của engine.
- Khử trùng theo bộ `tick/source/target`, sau đó sắp xếp theo tick.
- Đếm kích hoạt liên kết qua event có tiền tố `bond:` và hội qua `group:`.
- Khử trùng sự kiện liên kết/hội theo `tick/type/source/target`.
- Bộ đếm liên kết/hội hỗ trợ lọc theo đội nguồn phát sự kiện.

### Bộ lọc và chỉ số tổng quan

- Lọc theo chế độ hoặc tất cả chế độ.
- Lọc theo nhân vật hoặc tất cả nhân vật.
- Khi chọn nhân vật, lịch sử giữ những trận có nhân vật đó tham gia.
- Hiển thị tổng số trận đã lưu, lượt hạ gục và số loại nhân vật tham gia trong tập dữ liệu đang lọc.
- Có khu vực xem level và trang bị đang sử dụng của đội hình hiện tại.

### Hiệu quả từng nhân vật

- Các cột: nhân vật, lượt ra sân, lượt thắng, tỉ lệ thắng, hạ gục, bị hạ.
- **Tỉ lệ thắng = số lượt nhân vật thuộc đội thắng / tổng lượt ra sân**.
- Nhân vật trùng trong cùng trận được tính theo từng lượt ra sân.
- Đây là kết quả theo đội, không phải tỉ lệ thắng đấu tay đôi.
- Danh sách ưu tiên tỉ lệ thắng cao, sau đó số lượt ra sân cao; dùng ID để phân định khi vẫn bằng nhau.

### Nhân vật nào hạ gục nhân vật nào

- Tổng hợp cặp nhân vật gây đòn kết liễu và nhân vật bị hạ, kèm số lần.
- Chỉ tính khi xác định được cả nguồn lẫn mục tiêu và hai đơn vị thuộc đội khác nhau.
- Tự sát, môi trường và hạ đồng đội không tính thành hạ gục đối thủ trong bảng này.
- Sắp xếp theo số lần hạ gục giảm dần.

### Lịch sử và xuất dữ liệu

- Mỗi trận có mục mở rộng xem chế độ, số ải nếu có, thời điểm lưu, thời lượng và đội thắng.
- Hiển thị engine và seed; nếu thiếu seed thì ghi rõ seed bị server ẩn.
- Hiển thị số lần liên kết/hội khi có, toàn bộ đội hình và trang bị tại trận đó.
- Có nhật ký hạ gục theo thời gian; thời gian hiển thị quy đổi từ tick theo 30 tick/giây.
- Nút **Xuất JSON** xuất tập bản ghi sau khi lọc.
- File xuất tên `circlewar-phan-tich.json`, gồm `exportedAt` và `records`.
- Không có dữ liệu phù hợp thì hiện trạng thái trống; nút xuất bị vô hiệu hóa.

## 4. Bảo hiểm Pack Boss

### Quy tắc mới

- Bản cũ không có bảo hiểm riêng cho Pack Boss.
- Sau **49 Pack Boss liên tiếp chưa ra Huyền thoại**, **Pack Boss thứ 50 bảo đảm Huyền thoại**.
- Chỉ Huyền thoại đặt lại bộ đếm; Sử thi không đặt lại.
- Bộ đếm Pack Boss độc lập với các bộ đếm bảo hiểm pack thường.

### Dữ liệu và giao diện

- Frontend thêm trường hồ sơ `bossPacksSinceHighRarity`, mặc định bằng 0.
- Khi khôi phục hồ sơ, giá trị được đưa về số nguyên trong khoảng 0–49.
- Lưu bộ đếm cùng kết quả mở pack và các dữ liệu hồ sơ liên quan.
- Thêm khu vực **BẢO HIỂM PACK BOSS · HUYỀN THOẠI**, thanh tiến độ với mốc 50 và số pack còn lại đến bảo hiểm.
- Giao diện giải thích chỉ Huyền thoại mới đặt lại bộ đếm.
- Có nhánh xử lý khi toàn bộ thẻ Huyền thoại đã Lv.10: báo giữ lại Pack Boss bảo hiểm thay vì trả về thẻ bậc thấp hơn tại lượt bảo hiểm.
- Source Worker local hiện tại chưa khai báo trường bộ đếm này. Không thể kết luận cách Worker production chuẩn hóa hoặc kiểm tra trường đó chỉ từ bundle frontend.

## 5. Phiên bản và trạng thái Git/deploy

- Release manifest và patch notes production đã chuyển sang `2026.10.22.1`; hai file tương ứng trong source local vẫn là `2026.10.21.4`.
- Commit mới nhất trên GitHub trùng local; không có commit local đang chờ push tại thời điểm đối chiếu.
- Vì vậy, chỉ push checkout hiện tại sẽ không bổ sung source của các thay đổi `.22.1` nêu trên.
- Chưa xác định vị trí checkout hoặc máy đã dùng để deploy bản `.22.1`.
- Không thấy tham chiếu `sourceMappingURL` trong bundle đã kiểm tra; điều này chưa chứng minh server không có source map ở đường dẫn khác.

Lỗi deploy GitHub Pages là vấn đề riêng đã quan sát được, không phải thay đổi tính năng của `.22.1`:

- [Workflow gần nhất](https://github.com/DuongMinhHoang1008/CircleWar/actions/runs/39710408393) chạy trên commit `ec338d0`, ngày 22/10/2026.
- Lỗi `TS7022` tại `tests/integration/deployment-smoke.ts:81`: biến `asset` bị suy luận thành `any`.
- Bước typecheck thất bại; bước build frontend và deploy Pages bị bỏ qua.
- Không có bằng chứng từ workflow này về kết quả deploy Cloudflare; website Cloudflare được kiểm tra độc lập qua HTTP.

## 6. Giới hạn của bản ghi

Đã ghi đầy đủ các mục trong patch notes `.22.1` và chi tiết triển khai frontend xác minh được ở các nhóm tương ứng. Không thể xác nhận toàn bộ thay đổi nội bộ, công thức cân bằng, asset, test hoặc backend nếu không có source/build trước và sau để diff. Không suy diễn những phần chưa xác minh thành tính năng đã triển khai.

Thao tác trong lần ghi nhận này chỉ tạo tài liệu Markdown; không sửa gameplay, thêm script, khôi phục source, commit, push hay deploy.
