# Thử thách ngày, tháp viễn chinh và Cộng hưởng

Bản `2026.10.28.1` đã triển khai [production](https://riseon-ultimate-battle.pages.dev) ngày 28/10/2026. Engine `chaos-integer-v34`; kết quả kiểm tra triển khai tại `DEPLOYMENT.md`.

## Thử thách ngày

- Thay giao diện thử thách tuần bằng ba đối thủ mỗi ngày. Bỏ tab thi đấu xếp hạng; API xếp hạng cũ vẫn giữ để tương thích dữ liệu.
- Đổi ngày lúc **00:00 giờ Việt Nam (UTC+7)**, không phụ thuộc múi giờ thiết bị. Hạt giống, pool và đối thủ cố định trong ngày.
- Pool gồm 9 nhân vật, có nhiều vai trò. Nhân vật và trang bị cho mượn Lv.10; không thể gửi quân ngoài pool hoặc cấp tự nhập.
- Mỗi đối thủ có đội hình riêng, gồm quân, trang bị, Bí kỹ và mục tiêu Bí kỹ. Tự lưu khi sửa, trước trận và sau khi kết thúc cả thắng lẫn thua. Tải lại/đổi trang không làm mất cấu hình.
- Thắng lần đầu từng đối thủ tăng tiến độ; đánh lại và xem replay không phát trùng phần thưởng. Các mốc tự cộng khi đạt.
- Thưởng ngày: mốc 1 là 5 pack, mốc 2 là 8 pack + 1 Pack Boss, mốc 3 là 12 pack + 1 Pack Boss.

## Viễn chinh roguelike

- Run gồm 12 tầng với các nhánh giao tranh, tinh anh, sự kiện, cửa hàng, chiêu mộ và trại nghỉ. Boss bắt buộc ở tầng 6 và 12.
- Chọn một trong ba nhân vật khởi đầu Lv.3, mang 90 vàng và vật phẩm hợp cạ Lv.1. Vàng, cấp quân, túi đồ và trang bị tách khỏi bộ sưu tập.
- HP còn lại được giữ giữa các trận. Quân bị hạ bị loại khỏi đội sau chiến thắng; đồ của quân đó vẫn nằm trong túi run.
- Thắng phòng thường/tinh anh/boss nhận 45/70/100 vàng và chọn một trong ba chiến lợi phẩm. Nhận trùng nâng cấp món đó, tối đa Lv.10; có thể bỏ qua.
- Cửa hàng: giá vật phẩm 35 + 10 × bậc rarity gốc; nâng quân 40 vàng/cấp; chiêu mộ 60 vàng; hồi 35% HP cả đội giá 25 vàng, một lần mỗi cửa hàng.
- Trại nghỉ: chọn hồi 35% HP cả đội hoặc nâng một quân thêm một cấp, rồi đi tiếp. Sự kiện: hồi 15% HP hoặc đổi 15% HP mỗi quân lấy 55 vàng.
- Có thể đổi đồ và bỏ quân ngoài trận; giữ ít nhất một quân. Chiêu mộ cần chỗ trống, tối đa ba quân. Đồ gắn chuyển chủ, không nhân bản.
- Trận đang dở lưu trạng thái khóa trước khi bắt đầu; tải lại sẽ tiếp tục cùng đội, HP, phòng và seed. Không được đổi đội hay thử seed khác để giữ run.
- **Thua một trận hoặc chủ động bỏ run sẽ xóa toàn bộ run**. Kết quả cuối cùng vẫn được ghi; bộ sưu tập và thưởng mốc đã nhận giữ nguyên.
- Phòng đầu là 1v1, không có trang bị địch hoặc boss chiến dịch ẩn. Pool, cấp, số quân và trang bị địch tăng theo tầng; HP mở đầu của địch được hiển thị.

### Thưởng vượt tầng

Mỗi mốc nhận một lần/ngày, dựa trên tầng cao nhất thực sự vượt trong ngày. Thao tác đổi đồ, tiếp tục trận hoặc thua một trận không tự nhận thành tích cũ khi qua ngày.

| Mốc | Pack thường | Pack Boss | Rương chọn Sử thi |
| --- | ---: | ---: | ---: |
| Vượt tầng 4 | 20 | 1 | 0 |
| Vượt tầng 8 | 40 | 4 | 0 |
| Hạ boss tầng 12 | 90 | 10 | 1 |
| Tổng | **150** | **15** | **1** |

Mức cũ 10/15/20 pack và 0/1/3 Pack Boss có receipt riêng: bản mới bù đúng chênh lệch một lần nếu người chơi đã nhận, thay vì phát lại toàn bộ. Receipt gốc và receipt điều chỉnh được lưu cùng lần cộng thưởng.

Pack thường cộng phần vừa queue trước; phần dư thành thư nhận từng phần. Hòm thư đạt giới hạn 200 thư thì phần còn lại vẫn được giữ trong khoản thưởng chờ trên chính trang Hòm thư. Không làm mất phần thưởng.

## Hành trình toàn roster

- Cả 33 nhân vật đều có điều kiện và ba mốc 3/8/15 trận, tổng cộng 99 Bí kỹ.
- Giữ 18 Bí kỹ chuyên biệt đã có của sáu nhân vật. Các nhân vật còn lại có ba lựa chọn tác động thật lên chỉ số: sát thương đổi HP, HP đổi tốc độ, hoặc nhịp đánh/nạp Super đổi sát thương mỗi đòn.
- Điều kiện hỗ trợ kiểm tra số liệu thực: khiên đồng đội đã tạo, HP đồng đội hồi thực, buff hoặc liên kết. Các hành trình còn lại yêu cầu thắng với nhân vật trong đội.
- Trận Đi ải, thử thách ngày, viễn chinh và bài tập hoàn tất mới tính. Replay không cộng tiến độ.
- Khi vượt mốc, lưu thông báo mở Bí kỹ vào hồ sơ và hiện thông báo toàn ứng dụng. Đóng thông báo được lưu; mốc cũ không báo lại. Trang hành trình có tìm kiếm và lọc sở hữu/đã mở.

## Liên kết có hiệu ứng đặc trưng

Liên kết đôi/bộ ba và các hội có điều kiện chủ chốt có thêm Cộng hưởng, bên cạnh hiệu ứng gốc:

| Cộng hưởng | Hiệu ứng |
| --- | --- |
| Cứu viện | Đồng đội khác yếu nhất trong liên kết nhận khiên 12% HP gốc trong 4 giây; xóa Frozen/Paralyzed. Bộ ba tăng lên 18%. Vẫn chịu trần khiên chung. |
| Liên kích | Đòn thường kế tiếp của đồng đội khác có thêm 60% ATK, phải dùng trong 3 giây; bộ ba tăng lên 90%. |
| Phá nhịp | Địch gần nhất bị choáng 0,5 giây, chậm 25% trong 3 giây; bộ ba kéo dài chậm thành 4 giây. |
| Tiếp nhịp Super | Đồng đội khác nhận 20 năng lượng; bộ ba nhận 30. |

- Dùng chung hồi 8 giây mỗi đội, tối đa bốn lần/trận. Trong một sự kiện, ưu tiên bộ ba, đôi, rồi hội; không chồng nhiều Cộng hưởng cùng lúc.
- Cần các thành viên sống; không bắt buộc đứng gần trong hệ thống di chuyển tự động. Các điều kiện nhân vật chủ chốt vẫn giữ.
- Nhóm tuổi G01 và nhóm nghề G10 giữ hiệu ứng bị động, không được phát Cộng hưởng mạnh chỉ vì dễ ghép.
- Hiển thị tên Cộng hưởng trong trận và hiệu ứng ở cả nguồn/đích. Kho đồ và phần chuẩn bị trận cho xem liên kết đang bật, hiệu ứng và người còn thiếu để ghép.

## Kiểm chứng

- `npm test`: toàn bộ kiểm thử deterministic engine/server, gồm trường hợp cộng dồn, giới hạn, checkpoint, pool theo ngày, kinh tế run và idempotency thưởng.
- `npm run test:adventure-v2`: Chrome chơi một trận ngày thật, lưu đội theo đối thủ/reload, thông báo Bí kỹ, replay không phát trùng, nhận thư, 33 hành trình, mua đồ/chiêu mộ/bỏ quân, khôi phục trận, thua mất run và tổng thưởng mới.
- `npm run test:inventory` và `npm run test:experience`: regression Kho đồ, preset, khóa thẻ và điều khiển trận.
- Báo cáo trình duyệt: `reports/adventure-v2-browser.json`; ảnh desktop/mobile trong `reports/daily-challenge-*`, `reports/roguelike-*`.
- Mô phỏng mẫu: `tests/performance/adventure-v2-audit.ts`, lưu `reports/adventure-v2-audit.json`. Đây là chính sách chọn đồ/quân đơn giản, không đại diện tỷ lệ thắng của người chơi. Mẫu hiện tại vượt trung bình 5,42 tầng và chưa vượt đủ tháp; cần tiếp tục playtest độ khó theo các lối xây đội.
