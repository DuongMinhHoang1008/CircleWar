# Đề xuất — Bí kỹ và Truyền thừa nhân vật

Cập nhật 2026.10.27.5: 18 Bí kỹ đã có runtime và ô lắp trong game; mở bằng tiến trình 3/8/15 trận hiện hành. Phần ba chương/boss cố định dưới đây vẫn là thiết kế dài hạn, chưa triển khai. Xem `RELEASE_2026-10-27.5.md` để biết phạm vi và kiểm tra; cần tiếp tục cân bằng matchup nhiều seed.

## Phần thưởng cốt lõi

Hành trình nhân vật là nguồn duy nhất mở **quyền sở hữu Bí kỹ** cho chính nhân vật đó. Không pack, cửa hàng, crafting, trao đổi hoặc loại tiền chung nào mở được. Nhân vật có một ô Bí kỹ riêng bên cạnh một ô vật phẩm hiện tại. Mỗi trận chọn đúng một trong ba phần thưởng: hai Bí kỹ cá nhân và một Truyền thừa hỗ trợ đội. Đổi lựa chọn miễn phí ngoài trận.

Tối đa một nhân vật trong đội được mang Truyền thừa. Các nhân vật còn lại có thể dùng Bí kỹ cá nhân của mình. Không cộng cả ba lựa chọn, không tăng trần level, không dùng đường nâng cấp cộng ATK/HP vô hạn. Mỗi lựa chọn có cơ chế mới và đánh đổi cụ thể, nên sở hữu nhiều phần thưởng mở nhiều cách chơi thay vì mặc nhiên thắng mọi build cũ.

## Ba chương, phần thưởng dùng được từ sớm

| Chương | Thử thách | Phần thưởng chắc chắn |
| --- | --- | --- |
| Khởi hành | Ba bài chiến thuật giới thiệu đúng cơ chế nhân vật | Bí kỹ cá nhân thứ nhất |
| Làm chủ | Ba trận yêu cầu đổi phối hợp trước các counter khác nhau | Bí kỹ cá nhân thứ hai |
| Truyền thừa | Một boss, ba seed cố định, thắng ít nhất hai trận | Truyền thừa nhân vật |

Các bài cuối dùng cấp chuẩn hóa và đội hình cho mượn đã quy định. Cho xem trước đối thủ, điều kiện thắng và phần thưởng. Có thể cho mượn Bí kỹ trong bài học nhằm giải thích cơ chế, nhưng không cấp quyền dùng trong bộ sưu tập nếu chưa hoàn thành hành trình. Thua không mất tài nguyên; làm lại miễn phí. Không dùng yêu cầu thắng hàng trăm trận hoặc farm lượng hồi dư.

Boss của mỗi người kiểm tra quyết định riêng: Hổ xử lý đội giảm hồi phục và bảo vệ đồng đội; Cờ chống burst; Mâm Quả giải khống chế và giữ hồi phục thực; Hộp Quà dùng vị trí sinh đệ chống xạ thủ; Hoàng Tử ứng biến trước đẩy kéo và đạn; Aura xử lý đội hình bị chia cắt.

## Sáu nhân vật thí điểm

| Nhân vật | Bí kỹ Khởi hành | Bí kỹ Làm chủ | Truyền thừa |
| --- | --- | --- | --- |
| Hổ Hướng Nội | **Nén Bão:** tích một phần HP thực mất trong Hướng Nội để cường hóa đòn kế tiếp; tự hồi giảm một nửa | **Bình Tâm:** xóa Frozen/Paralyzed khi vào Hướng Nội, CD 10s; thời gian Hướng Nội giảm 2s → 1,4s | **Chỗ Dựa:** Super cấp khiên 6% HP gốc Hổ cho đồng đội yếu nhất, CD 6s; damage Super giảm 25% |
| Cờ Con Cổ Vũ | **Trạm Tiếp Sức:** cờ cấp khiên 4% HP gốc, CD 8s/mục tiêu; mất hồi HP từ cờ | **Hiệu Lệnh:** đổi Frozen thành Paralyzed; vùng cờ nhỏ hơn 15% | **Dồn Sức:** khiên Super 10% HP gốc tập trung một đồng đội yếu nhất; bỏ khiên cho bản thân và các đồng đội còn lại |
| Mâm Quả Chủ Tịch | **Suất Dành Riêng:** 15% hồi dư thành khiên có trần và CD; hồi trực tiếp giảm 20% | **Khay Thanh Mát:** quả xóa một Frozen/Paralyzed, CD 10s/người; xuyên ba → hai mục tiêu | **Hậu Cần:** bốn quả Super hồi mạnh hơn 25%; tám → bốn quả, damage của chúng giảm 50% |
| Hộp Quà Nghiêm Túc | **Gói Gia Cố:** một đệ nhỏ có 220% HP/150% damage/thân +15%; bỏ khả năng giữ hai đệ | **Quà Tiếp Tế:** đệ bị đối thủ phá cấp khiên cho đồng đội gần, CD 6s; HP đệ giảm 20% | **Hộ Tống:** gọi đệ lớn cạnh đồng đội được chọn trước trận; damage giảm 30%, lifetime 10s → 8s, vẫn chỉ chuyển động bi-a |
| Hoàng Tử Ngậm Hoa | **Hồng Leo:** nối hoa thường gần nhau, đồng đội đi qua nhận khiên có CD; giới hạn hoa thường bốn → ba | **Lưu Hương:** hoa thường bám đồng đội tạo vùng hỗ trợ di động; tối đa hai hoa bám, không cắm đất hoặc gây Frozen | **Vườn Che Chở:** mỗi hoa Super chặn một đạn địch rồi tan, tối đa sáu; mất Frozen từ hoa Super, không chặn tia/va chạm/AoE |
| Đẳng Cấp Aura | **Tâm Hào Quang:** dời tâm aura sang đồng đội chọn trước trận; bán kính giảm 25% | **Dư Âm:** aura còn 1,5s sau khi rời vùng, CD 6s; hiệu lực buff damage giảm 20% | **Dẫn Nhịp:** Super cấp 12 năng lượng cho đồng đội khác, có CD, không tự nạp; bỏ Rage/Blessing của Super |

Các con số trên là điểm xuất phát cho prototype. Quy tắc chi tiết/cap của từng phần thưởng nằm trong bản xem thử tương tác cùng cuộc trò chuyện; cần chuyển thành spec engine có version khi được duyệt.

## Bảo toàn bản sắc và công bằng

- Hướng Nội vẫn chỉ thuộc Hổ; thêm khiên cho đồng đội không có nghĩa truyền Hướng Nội.
- Đệ Hộp Quà vẫn nảy theo vật lý, không biến thành AI truy đuổi/hộ tống theo đường đi.
- Hồi dư không được ghi thành hồi HP thực; các lá chắn cùng nguồn phải có giới hạn và không tạo vòng lặp tự kích hoạt.
- Năng lượng chịu trần tick hiện có; Dẫn Nhịp cần CD cho từng người nhận, không tự hoàn lại năng lượng cho nguồn.
- Mở đầu bằng PvE/bộ sưu tập. Với thi đấu chuẩn hóa, cho mượn mọi lựa chọn hợp lệ như nhau hoặc tắt toàn bộ Bí kỹ; không lấy tiến trình sưu tập làm lợi thế xếp hạng. Cho mượn không cấp quyền sở hữu bên ngoài mode.
- Giữ danh hiệu và tiến độ cũ. Có thể công nhận mốc ba trận cũ để miễn phần Khởi hành; các chương counter/boss mới cần hoàn thành thực sự. Không xóa quà đã kiếm được.
- Khi triển khai, quyền sở hữu và phần thưởng cuối cần server xác minh, lưu một lần theo nhân vật/chương. Bản xem thử không mở khóa hay trang bị gì vào hồ sơ thật.

## Kiểm chứng trước khi triển khai rộng

Thử sáu nhân vật trước, rồi mở sang toàn bộ roster. Với mỗi lựa chọn cần có matchup cải thiện và matchup nên giữ kit gốc hoặc lựa chọn khác; đo cả độ hữu ích của hỗ trợ, số lần hiệu ứng thực sự cứu đội và tỷ lệ sử dụng. So cùng cấp/đồ trên bộ seed luyện và kiểm chứng. Audit cặp/triple Truyền thừa, death/lifetime, hồi/khiên/năng lượng để loại vòng lặp. Các bài mở khóa phải có nhiều build khả thi và không buộc người chơi sở hữu thẻ hiếm chưa có.
