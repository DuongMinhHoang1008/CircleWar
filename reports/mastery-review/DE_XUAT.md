# Đề xuất điều chỉnh Bí kỹ — chờ duyệt

> Bản tổng thể mới thay thế nội dung đề xuất bên dưới: [Đề xuất đủ 99 Bí kỹ — 30/10/2026](../../docs/MASTERY_99_PROPOSAL_2026-10-30.md). Các con số của gói chín nhánh cũ được giữ để tham khảo, không phải bản đang chờ duyệt.

## Mục tiêu

Theo yêu cầu bổ sung: cả 99 Bí kỹ phải nâng sức mạnh so với nhân vật chưa lắp. Ba lựa chọn là ba hướng nâng cấp ngang hàng, mỗi hướng có lợi ích riêng. Gói chín nhánh phía dưới là ứng viên điều chỉnh ban đầu, chưa đủ đáp ứng mục tiêu này; không dùng các con số đó như bản cân bằng đã chốt. Chưa triển khai thay đổi gameplay.

## Tiêu chuẩn mới để duyệt thiết kế

- Mỗi nhánh phải nêu rõ lợi ích tăng thêm, điều kiện phát huy và cách đo. Ưu tiên giữ phần sức mạnh gốc rồi nâng cấp một hành vi; nếu thay hẳn hành vi thì phải chứng minh lợi ích ròng. Không tự động cộng toàn bộ Super cũ và mới.
- Nhánh sát thương: đặt mục tiêu ban đầu tăng khoảng 10–20% sát thương thực lên địch trong bộ tình huống đại diện, với mức tăng đo riêng theo nhân vật và vũ khí. Đây là mục tiêu thiết kế cần kiểm chứng, không phải kết quả hiện có.
- Nhánh hỗ trợ/phòng thủ: đặt mục tiêu ban đầu tăng khoảng 15–25% chỉ số đúng vai trò, như hồi HP hữu dụng, khiên thực hấp thụ hoặc mức bảo vệ đồng đội; đồng thời kiểm tra kết quả cả đội. Không cộng cơ học HP, giây khống chế và sát thương thành một chỉ số chung.
- Nhánh tình huống như giải chậm: khi không có trạng thái phù hợp, tránh giảm sức mạnh gốc vô điều kiện. Khi có đối thủ phù hợp, lợi ích phải xuất hiện đủ thường xuyên và đo được. Không yêu cầu nhánh hỗ trợ phải mạnh hơn ở 1v1 nếu không có đồng đội.
- Một nhánh không bị coi là đạt chỉ vì hiệu ứng đã chạy hoặc một chỉ số tăng. Phải kiểm tra đồng thời phần công dụng bị mất, sát thương đồng đội, tăng trưởng theo thời gian, trang bị, khả năng trúng và thời gian sống.
- Điều kiện đạt áp dụng cho từng Bí kỹ. Bình quân cả 99 tăng không bù cho một số nhánh làm nhân vật yếu đi. Mốc 3/8/15 mở thêm lựa chọn, không bắt buộc mốc 15 mạnh nhất.
- Lắp Bí kỹ không bảo đảm thắng mọi trận hoặc mọi kèo; cam kết kiểm chứng là lợi ích ròng trong vai trò và các tình huống đã xác định.

## Hướng chỉnh cơ chế

1. Bỏ các mức phạt nhịp đánh/HP/hồi phục vô điều kiện trên nhánh chưa tạo đủ giá trị. Thay bằng giới hạn ngay trên phần tăng thêm, như số mục tiêu, số đạn phụ hoặc hồi riêng.
2. Nhánh tỏa/tách đạn ưu tiên giữ đòn chính đủ mạnh và thêm phần phủ; chỉ đạn chính có proc, đạn phụ không tạo chuỗi vô hạn. Phải cân lại tổng sát thương ở cự ly gần trước khi quyết định hệ số.
3. Nhánh hồi lưu/quỹ đạo phải giải quyết thời gian chờ và khả năng tiếp cận, không chỉ tăng sát thương ghi trên mô tả. Chứng minh phần đánh mới bù được đòn chạm/hiệu ứng gốc bị thay.
4. Nhánh Super hỗ trợ phải có mục tiêu và đủ thời gian thực hiện nhiệm vụ. Khi thay Super cơ động/phòng thủ, cần giữ một phần chức năng sống sót hoặc bù hiệu quả bảo vệ có thể đo.
5. Các nhánh giải trạng thái và hồi dư cần loại bỏ mức phạt làm chúng yếu hơn bộ gốc khi điều kiện không xuất hiện; phần lợi ích mới có hồi và trần riêng.

## Cơ sở

- Chạy 4.224 trận engine v36: 99 Bí kỹ và bộ gốc, Lv.10 không trang bị, 3v3 đội hai bên giống nhau, hai bộ đồng đội, tám seed và đổi bên. Mỗi Bí kỹ được thử 32 trận; bộ gốc có 32 trận ghép tương ứng. Điểm = (thắng + 0,5 × hòa) / số trận; kết quả hòa được giữ riêng trong dữ liệu.
- 60/99 nhánh có điểm dưới 50% trong mẫu này. Đây là chỉ báo sàng lọc, không phải tỷ lệ thắng thực tế; seed theo cặp và đội hình cố định khiến số liệu không đại diện mọi trận. Không coi mỗi nhánh dưới 50% đều phải tăng.
- Một số nhánh đồng thời giảm sát thương, kéo dài nhịp đánh và mất hiệu ứng gốc. Kết quả chịu ảnh hưởng lớn bởi khả năng trúng, khoảng cách, trạng thái và đội hình.
- Tiệc Nướng Trên Không mô tả ba đùi gà nhưng bộ phát hiện giới hạn hai đạn chicken đang tồn tại cho mỗi chủ. Đạn gà thường đã có sẵn có thể chiếm chỗ. Cần sửa giới hạn cho chính Super này và kiểm thử số lượng thực tạo.
- Chỉ số hồi/khiên trong dữ liệu là đóng góp của cả nhân vật, không tách riêng hoàn toàn phần do Bí kỹ; sự kiện mastery cũng không đo đầy đủ các nhánh cũ.

## Chín ứng viên ban đầu — cần chỉnh lại theo tiêu chuẩn mới

| Bí kỹ | Hiện tại → đề xuất | Lý do |
| --- | --- | --- |
| Đồng Xu Xoay | Hai xu 55% ATK, nhịp 200% → 80% ATK, nhịp 150%; giữ giới hạn hai xu và điều kiện trúng. | Điểm mẫu 12,5%; hai xu sát người khó bù nhịp gọi gấp đôi. |
| Chùm Nho Tách Hạt | Quả mẹ 55% → 75% ATK; nhịp 120% → 110%; giữ ba hạt bằng 30% sát thương mẹ, không proc/tách tiếp. | Điểm 18,75%; phần lớn sát thương trông chờ vào hạt con khó trúng. |
| Mực Loang | Đạn mẹ 60% → 80% ATK; nhịp 125% → 110%; giữ quy tắc mảnh con. | Điểm 18,75% trong cả hai đội hình; tăng phần chắc chắn của đòn. |
| Pháo Tản | Năm viên 25% → 32% ATK mỗi viên; nhịp 135% → 120%; giữ chỉ viên chính kích hoạt proc. | Điểm 21,875%; vẫn cần đứng gần để gom đạn. |
| Đôi Dép So Le | Mỗi dép 45% → 55% ATK; nhịp 150% → 125%; thu góc từ hai nấc mỗi phía xuống một nấc mỗi phía. Giữ giới hạn vùng hiện tại. | Điểm 21,875%; hai đường hiện có thể cùng trượt mục tiêu ở giữa. |
| Trạm Giao Nhanh | HP mỗi đệ 18% → 25% HP gốc chủ; hồi 1% mỗi 2 giây → 2% mỗi 1,5 giây, trần 20 HP/lần; giữ hai đệ, thời gian 6 giây và yêu cầu đến gần. | Điểm 26,56%; nhân vật phải đổi Super cơ động lấy hỗ trợ nhưng đệ mỏng và hồi chậm. |
| Quà Tiếp Tế | Đệ giữ 100% HP thay vì 80%; nhịp hồi 2 → 1,5 giây, lượng 1% HP gốc chủ → 2%, trần 20 HP/lần; giữ điều kiện tiếp cận và khiên khi bị phá. | Điểm 28,125%; bù cho việc đệ ngừng tấn công. |
| Hậu Cần | Bốn vùng quả → sáu vùng, phân bố đều; giữ hồi +25% mỗi nhịp, giảm 50% sát thương và giới hạn Truyền thừa. | Tăng vùng tiếp cận hỗ trợ; điểm 48,44% chưa đủ để kết luận nhánh yếu, thay đổi dựa vào thiết kế và cần thử lại. |
| Tiệc Nướng Trên Không | Sửa để có thể phát đủ ba đùi Super ngay cả khi đạn gà thường đang tồn tại; mỗi đùi 45% → 55% ATK, giữ hồi tối đa 20 HP mỗi đùi và giới hạn đạn toàn trận. | Điểm 18,75%; khắc phục sai lệch số đạn trước, sau đó đo lại hiệu quả. |

Phạm vi duyệt mở rộng thành rà soát đủ 99 nhánh. Chỉ giữ nguyên nhánh đã chứng minh đạt tiêu chuẩn mới. Mẫu hiện có ghi nhận 60 nhánh dưới điểm 50%, trong đó 35 nhánh dưới 50% ở cả hai đội hình; cần ưu tiên kiểm tra nhưng chưa đủ để định lượng mức tăng cho từng nhánh. Hai nhánh Mưa Phi Kiếm và Lò Nung Vệ Tinh đạt điểm 75% trong mẫu; theo dõi bằng mẫu rộng hơn trước khi cân nhắc giảm.

## Kiểm chứng sau khi được duyệt

Chạy lại cùng bộ seed và hai đội hình để đối chiếu; mở rộng thêm seed độc lập, đội hình khác, cấp và trang bị, gồm 1v1 cho nhánh phù hợp, 3v3 và chế độ có liên quan. Đo sát thương, hồi thực, khiên hấp thụ, khống chế, số lần trúng và thời gian sống bên cạnh thắng/hòa. Có tình huống kiểm soát để đo riêng đóng góp tăng thêm của Bí kỹ và tình huống không đủ điều kiện để phát hiện mức phạt ẩn. Xác định số mẫu theo độ biến động; báo cáo độ bất định theo cặp seed, không coi hai lần đổi bên là hai seed độc lập. Thêm kiểm thử cho đạn Super đủ ba chiếc khi đạn thường đang tồn tại, giới hạn đạn, nhịp và trần hồi, mô tả, lưu/replay; kiểm tra sân thử hiển thị đúng. Nếu hiệu quả quá mạnh hoặc không cải thiện, điều chỉnh lại trước khi phát hành. Khi thay luật engine, tăng phiên bản và xử lý tương thích replay theo quy ước dự án.

Chi tiết: `baseline.json`; công cụ tạo lại: `audit.ts`.
