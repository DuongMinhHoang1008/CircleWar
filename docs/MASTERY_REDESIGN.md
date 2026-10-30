# Hành trình nhân vật · engine v35

> Tài liệu của bản v35 đã phát hành. Bản thay đổi đường đạn, đòn đánh, AI đệ và sân thử kế tiếp được mô tả tại [MASTERY_FORMS_V36.md](MASTERY_FORMS_V36.md).

Thay 81 Bí kỹ dùng ba mẫu chỉ số bằng các lựa chọn combat riêng cho 27 nhân vật. Giữ 18 Bí kỹ đã có bản sắc của Hổ, Cờ, Mâm Quả, Hộp Quà, Hoàng Tử và Aura. Toàn bộ 33 nhân vật tiếp tục có ba lựa chọn ở mốc 3/8/15; chỉ lắp một lựa chọn mỗi nhân vật.

## Lối chơi và ngân sách sức mạnh

- Chuỗi đòn có hồi riêng 4 giây và hết chuỗi sau 4 giây không trúng. Một số chuỗi cần trạng thái đặc trưng: Ôm Siết cần Tiểu Đường, Ngắm Khe Hở cần Cận Thị, Nhiệt Nứt Giáp cần Burn. Chuỗi không đạt điều kiện bị tiêu nhưng không tốn hồi.
- Phản công chỉ tính HP thực mất do địch đánh trực tiếp; sát thương vào khiên và friendly fire không kích hoạt. Cứu nguy tự thân có hồi 12 giây. Giữ Lời Thề phản ứng khi một đồng đội trong tầm còn dưới 40% HP, hồi 10 giây, không yêu cầu Hiệp Sĩ phải thấp HP.
- Nhánh Super có hồi riêng 8 giây. Hỗ trợ chọn một đồng đội khác có tỷ lệ HP thấp nhất trong tầm 180; hiệu ứng diện rộng chỉ chọn tối đa ba địch trong tầm 180 quanh người dùng.
- Hồi/khiên tính từ HP gốc của người dùng, trần lần lượt 40/60 HP mỗi lần. Hồi phục vẫn chịu giảm hồi, luật hồi phục của chế độ và nhịp kết thúc round. Không hồi sinh, không tạo đòn phụ và không tự kích hoạt chuỗi proc.
- Đánh đổi ba nhánh mới lần lượt là -6% HP, -8% sát thương nền và -10% chỉ số nạp Super. Các mốc mở lựa chọn ngang hàng; mốc 15 không thay hoặc cộng thêm vào hai mốc trước.

| Trạng thái | Hiệu lực                                                          | Giới hạn                      |
| ---------- | ----------------------------------------------------------------- | ----------------------------- |
| Rạn giáp   | Giảm giáp theo điểm phần trăm trước khi tính sát thương trực tiếp | Tối đa 15 điểm, giáp không âm |
| Hộ thể     | Giảm sát thương trực tiếp sau giáp                                | Tối đa 20%, không giảm DoT    |

Hai trạng thái có thời hạn, lấy hiệu lực mạnh nhất và không cộng tầng. Đã nối vào số liệu hỗ trợ, nhãn trong trận, chi tiết nhân vật và checkpoint/replay.

## Hành trình theo vai trò

- Chặng 0–3: thắng hoặc có đóng góp đặc trưng.
- Chặng 3–8: luyện bản sắc nhân vật như Tiểu Đường, Bleeding, khiên, hồi đồng đội hoặc khống chế.
- Chặng 8–15: duy trì vai trò hoặc đạt loại đóng góp khác. Ví dụ Aura cần thời gian buff thực lên đồng đội; Hổ cần sống qua 15 giây và chịu sát thương HP.
- Mỗi trận hoàn tất chỉ tăng một bước mỗi nhân vật, kể cả khi thua nhưng đạt mục tiêu. Điều kiện mới của chặng tiếp theo áp dụng từ trận tiếp theo. Luồng xem lại không quyết toán tiến độ.

Trang Hành trình hiển thị mục tiêu hiện tại, ba nhánh và vai trò, trạng thái đã mở/đang lắp, đánh đổi và điều kiện từng chặng. Tìm được theo tên nhân vật/Bí kỹ/vai trò; có lọc đang luyện và hoàn tất.

## Tương thích

Giữ ID `pressure/resolve/tempo`, tiến độ, mốc đã mở và cấu hình đang lắp. Các nhánh thay thế không trở thành Truyền thừa nên đội cũ không vi phạm giới hạn mới. Giới hạn một Truyền thừa/đội của sáu nhân vật ban đầu vẫn áp dụng. Engine đổi sang v35 để trận và replay cũ không chạy với luật combat khác.

## Kiểm chứng

- `tests/deterministic/mastery-redesign.test.ts`: từng nhánh mới, các điểm nối combat thực, hồi chiêu, điều kiện, hết chuỗi, giới hạn hồi/khiên, chọn mục tiêu, cleanse và điều kiện hành trình.
- `tests/deterministic/inventory-mastery.test.ts`: toàn bộ 99 Bí kỹ qua checkpoint và replay xác định.
- `tests/performance/mastery-audit.ts`: trận 3v3 cùng nhân vật/cấp, không trang bị, cùng seed thử Bí kỹ ở cả hai bên. Báo cáo `reports/mastery-redesign/balance.json`; trường hợp Hiệp Sĩ có mẫu mở rộng ở `knight-focus.json`.
- `tests/performance/mastery-journey-audit.ts`: 528 trận kiểm tra mục tiêu cả ba chặng của 33 nhân vật bằng đội chưa lắp Bí kỹ. Mọi mục tiêu có trận đạt trong mẫu. Báo cáo `journey-goals.json`.
- `tests/integration/mastery-redesign-browser.ts`: 33 thẻ/99 nhánh, tìm kiếm, bộ lọc, trạng thái lắp, mục tiêu, trạng thái rỗng và layout 1440/360/390px; ảnh ở cùng thư mục báo cáo.

Các mẫu cân bằng chỉ phát hiện hồi quy và nhánh bất thường trong cấu hình kiểm tra; chưa đại diện cho mọi trang bị, đối thủ, cấp độ và đội hình.
