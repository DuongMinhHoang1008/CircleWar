# Bí kỹ biến thể · engine v36

Bí kỹ mới thay đường tấn công và hành vi vật thể trong trận. Thay 81 nhánh proc trạng thái của v35 bằng cấu hình hình học/đường đạn/Super/phản công; giữ ID `pressure`, `resolve`, `tempo` và các mốc 3/8/15 để hồ sơ cũ tiếp tục dùng được. Không cộng các nhánh vào nhau.

## Các lựa chọn có thể quan sát

| Nhân vật            | Ví dụ biến thể                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------- |
| Anh Tím Mọng        | Quả vỡ thành hạt; quả đi/về; Super rải mìn                                                  |
| Kính Cận Bắt Bài    | Đạn khoan xuyên; drone theo chủ; pháo ba nòng                                               |
| Kiếm Khách Mượn Vai | Hai đường kiếm chữ thập; nhát chém trễ ở vị trí cũ; Super phi kiếm nảy                      |
| Hiệp Sĩ Gâu Gâu     | Ném khiên rồi mất chặn đạn trong lúc chờ; phản mảnh khiên; gọi hộ vệ                        |
| Hộp Quà             | Một hộ vệ đứng chắn trước chủ; đệ chữa trị đi tìm đồng đội; đệ khổng lồ bám người được chọn |
| Công Tử             | Xu bay sát quanh chủ; đòn búng xu thẳng dài; quỹ có HP bắn xu                               |
| Ủn Đại Ca           | Rocket tách đầu; rocket tự đuổi; trận địa ba ụ pháo thay tên lửa toàn bản đồ                |
| Chó Bóng Bay        | Bóng nổ tách mảnh; bóng phóng rồi neo; năm bóng quỹ đạo rồi phóng ra                        |

`packages/shared/src/mastery-forms.ts` là bộ định nghĩa của 27 nhân vật. Các nhân vật khác giữ Bí kỹ riêng; ba Bí kỹ Hộp Quà được bổ sung AI di chuyển/hỗ trợ thực trong `mastery-data.json`.

## Hành vi và giới hạn

- Đạn tỏa có các làn riêng. Chỉ viên chính có proc đòn thường. Mảnh tách chỉ sinh một thế hệ và bắt đầu di chuyển ở tick tiếp theo.
- Đạn hồi lưu chạm tối đa hai mục tiêu mỗi chiều, nhớ người đã trúng rồi xóa danh sách khi quay về. Mỗi chủ chỉ có một đòn hồi lưu thường đang bay. Khiên Hồi Lưu tạm mất chặn đạn và được trả lại khi bắt khiên hoặc hết thời hạn.
- Đạn tự đuổi uốn đường theo mục tiêu; đạn chuyền phải thực sự bay sang người tiếp theo, không gây sát thương tức thời cho toàn chuỗi.
- Mìn thường bay một đoạn rồi neo, lên ngòi sau 18 tick. Mìn phản công và Super đặt tại vị trí riêng; mọi loại đều có thời hạn và bán kính nổ hữu hạn.
- Đạn quỹ đạo chạm theo đường bay thật. Khi đang xoay cần chủ còn sống; quỹ đạo được chặn trong biên để không mất ngay lúc gọi sát tường. Vệ tinh Super rời quỹ đạo sau một giây rồi bay theo địch.
- Đòn quét, chữ thập và chém trễ xét hình học, tối đa ba mục tiêu mỗi nhịp. Đòn quét không tiêu nhịp nếu chưa có mục tiêu trong hình đánh. Chém trễ có vệt báo trước, giữ nguyên vị trí/hướng cũ và không có proc đòn thường.
- Nhánh Super thay hoạt động gốc, không nhận kèm các buff riêng của Super cũ. Tăng sát thương Super chỉ tính một lần.
- Đệ/trụ có HP và va chạm; drone, đệ săn, đệ chữa trị, hộ vệ, lốp húc và các pháo có AI/hình bắn khác nhau. Đệ vẫn không tính là người sống để giữ round.
- Giữ trần chung 240 đạn, 64 đệ/trụ, 120 vùng. Không khởi tạo chuỗi tách vô hạn. Nhánh phản công có hồi 6 giây và nhịp đánh thường chậm hơn 25%.

Đánh đổi chủ yếu nằm ở tổng sát thương, nhịp đánh, vùng phủ, điều kiện trúng và phần công dụng bị thay. Không dùng lại bộ ba tăng ATK/HP/haste hoặc cộng thêm status theo cùng mẫu.

## Sân thử

Hành trình có nút **So sánh cách đánh**; Catalog → Bí kỹ có **Xem cách đánh**. Có thể chọn bộ gốc hoặc bất kỳ nhánh nào trước khi mở khóa. Mỗi lựa chọn dùng cùng seed, đội hình, vị trí, Super đầy và một đồng đội còn 70% HP. Xem bằng frame ghi từ combat engine, có tạm dừng, đổi tốc độ và chạy lại. Không kết nối luồng quyết toán thưởng hoặc tiến độ.

Vệt chém, đường đạn biến thể và các vai trò đệ có hình trong Arena; thông tin được giữ qua checkpoint và replay. Chi tiết nhân vật có phần Bí kỹ đang lắp và nhịp đánh thực của biến thể.

## Kiểm chứng

- Kiểm thử tất cả 81 nhánh tạo đúng đòn/đạn/vùng/đệ; bộ kiểm thử 99 Bí kỹ qua checkpoint vẫn được giữ.
- Kiểm thử riêng hình quạt, tách một thế hệ, hồi lưu, mìn lên ngòi/neo, sóng/uốn hướng, ba quỹ đạo riêng, giữ vật thể trong biên, chém trễ có thể tránh, drone bám chủ, đệ chữa trị, pháo ba nòng và phản công chỉ do mất HP từ địch.
- Sân thử được kiểm tra từ cả Hành trình và Catalog, gồm nhánh chưa mở, tạm dừng, tốc độ, chạy lại, Escape, không cộng tiến độ và desktop/mobile 360/390px. Báo cáo/ảnh: `reports/mastery-forms/`.
- Mẫu cân bằng 1.296 trận cùng đội hình và đổi bên theo seed nằm ở `balance.json`, được ghi trước đợt sửa vệ tinh sát tường và điều chỉnh Song Nha cuối. Hai trường hợp này có mẫu mở rộng 192 trận/nhân vật sau chỉnh tại `wolf-focus.json` và `balloon-focus.json`. Đây là mẫu hồi quy của đội Lv.10 không trang bị, chưa đại diện mọi đội hình/cấp/trang bị. Mẫu trước đợt điều chỉnh đầu ở `balance-initial.json`.

Metadata cũ v35 và báo cáo production vẫn lưu riêng. Bản v36 cùng VFX 33 nhân vật đã deploy trong giao diện v2026.10.29.3 ngày 29/10/2026; xem `DEPLOYMENT.md` và `docs/MASTERY_VFX.md`.
