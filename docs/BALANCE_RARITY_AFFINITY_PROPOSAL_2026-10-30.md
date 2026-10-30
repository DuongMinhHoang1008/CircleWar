# Đề xuất cân bằng rarity gốc và hợp cạ — 30/10/2026

**Trạng thái: đã được duyệt và triển khai vào engine v39. Chưa chạy mô phỏng đàn kiến sau thay đổi; người dùng tự kiểm chứng. Chi tiết: BALANCE_V39_IMPLEMENTATION.md.**

Nguồn: colony-1904857412-1793352627767.json; seed 1904857412, engine v38, thuật toán colony-v2. Hoàn tất 34.816 trận trong 2.072,754 giây: 30.720 trận học và 4.096 trận đánh giá cuối. Lv10, 128 người × 60 thế hệ × 4 lượt. Thống kê dưới đây dùng các trận học để tránh thiên lệch chỉ nhìn ứng viên cuối. Đã thử 33 nhân vật, 33 trang bị + không đồ, đủ 1.122 cặp nhân vật/đồ và 132 lựa chọn nhân vật/Bí kỹ (gồm không lắp). Đủ tổ hợp không đồng nghĩa đủ mẫu cho từng tổ hợp.

## 1. Chẩn đoán

| Rarity gốc | Tỷ lệ thắng có trọng số lượt xuất hiện | Trung bình đều theo nhân vật |
|---|---:|---:|
| RÁC | 55,61% | 53,92% |
| T1 | 51,25% | 51,17% |
| T2 | 48,30% | 47,95% |
| T3 | 50,56% | 50,27% |
| T4 | 50,31% | 49,79% |

Không có thứ tự sức mạnh theo rarity gốc mong muốn. Ở Lv10, T1–T4 đều lên GOD và cardRarityMultiplier cho cùng khoảng 1,18 vào HP/ATK; ngân sách rarity gốc bị xóa ở cấp tối đa. RÁC Lv10 lên T4 nhưng bộ kit mạnh vẫn lấn át khoảng cách chỉ số nhỏ.

Chó Bóng Bay có 4.417/6.632 lượt thắng (66,60%); Đoàn Bóng Hộ Tống 1.718/2.240 (76,70%); xuất hiện 13/16 đội cuối. Đội đầu Chó Bóng Bay + Cờ + Wacom đạt 222/256 = 86,72%, với đồ đều không hợp cạ. Không cộng tỷ lệ các thành phần để suy ra công lao riêng.

Đồ hợp cạ: 2.817/5.536 = 50,89%; đồ không hợp cạ (loại không đồ): 86.699/173.144 = 50,07%; chênh +0,82 điểm phần trăm. Trung bình chênh đều theo 33 nhân vật là +0,68 điểm; 11/33 cặp hợp cạ đang thấp hơn trung bình đồ khác trên chính nhân vật đó. Mẫu hợp cạ chỉ 64–312 lượt/nhân vật, không đủ kết luận nhân quả từ từng chênh lệch.

## 2. Mục tiêu nghiệm thu

- Cùng cấp, cùng phân phối đồ/Bí kỹ/đồng đội/vị trí/đối thủ: trung bình nhóm phải có thứ tự RÁC < T1 < T2 < T3 < T4. Kiểm tra cả trung bình đều theo nhân vật và theo lượt xuất hiện. Không dùng tỷ lệ thắng đã bị quần thể tự chọn làm tiêu chuẩn duy nhất.
- Dải khởi điểm trên bộ kiểm tra chuẩn: RÁC 42–46%; T1 46–49%; T2 49–51%; T3 52–54%; T4 55–58%. Đây là mục tiêu có điều kiện trên một phân phối đối thủ xác định, không phải tăng cứng xác suất hoặc lời hứa mọi T4 thắng mọi T2.
- Hợp cạ trên cùng nhân vật: hơn 2–4 điểm phần trăm so với trung bình nhóm đồ không hợp cạ có rarity và ngân sách tương đương; không ép thắng mọi món khắc chế đặc biệt. Tốt hơn mà không biến hợp cạ thành lựa chọn duy nhất.
- Bí kỹ vẫn là nâng cấp so với không lắp. Khi hạ nhánh quá mạnh, giữ nguyên chức năng, không thu phí bằng làm mất đòn gốc/proc/hồi/số đệ ngoài điểm được duyệt.

## 3. Ngân sách rarity gốc của nhân vật

Giữ tiến hóa/mốc cấp/UI hiện có. Thêm một hệ số riêng, **chỉ cho HP và ATK nền của nhân vật**; không sửa chung cardRarityMultiplier vì nó còn dùng cho vật phẩm.

| Rarity gốc | Hệ số bổ sung đề xuất |
|---|---:|
| RÁC | 0,94 |
| T1 | 0,98 |
| T2 | 1,00 |
| T3 | 1,04 |
| T4 | 1,08 |

Áp dụng: làm tròn HP/ATK nền × hệ số tiến hóa hiện tại × hệ số rarity gốc một lần, trước cộng đồ. Không nhân lần nữa vào summon/DoT/hồi theo baseStats; chúng đã nhận nền mới. Không tăng HP/ATK đồ, giáp, khống chế, tốc độ hay hồi năng lượng bằng hệ số này. Giữ rarity gốc khi biến hình; dạng biến hình nhận các lợi ích riêng đã định, không tự coi rarity gốc là T4. Hệ số này là ngân sách thử đầu tiên, không ánh xạ trực tiếp sang tỷ lệ thắng.

## 4. Chỉnh kit/nền theo từng nhân vật

Các số nền dưới đây là CHARACTER_BALANCE trước hệ số rarity và đồ. Mỗi dòng đều nhận hệ số mục 3; phần điều chỉnh riêng chỉ ghi khi cần. Đây là gói thử ban đầu, các thay đổi có thể tương tác và phải kiểm tra toàn gói.

| Nhân vật | Rarity | Thắng trong trận học | Số lượt | Đề xuất riêng |
|---|---|---:|---:|---|
| Hổ Hướng Nội | T1 | 52.43% | 5512 | Chỉ áp ngân sách rarity mới; giữ kit/Bí kỹ hiện tại trong lượt đầu. |
| Bé Ôm Bão | T1 | 50.46% | 5864 | Chỉ áp ngân sách rarity mới; giữ kit/Bí kỹ hiện tại trong lượt đầu. |
| Anh Tím Mọng | T2 | 47.50% | 5240 | Chỉ áp ngân sách rarity mới; giữ kit/Bí kỹ hiện tại trong lượt đầu. |
| Đùi Gió Lốc | T1 | 54.55% | 5752 | Chỉ áp ngân sách rarity mới; giữ kit/Bí kỹ hiện tại trong lượt đầu. |
| Kính Cận Bắt Bài | T2 | 42.38% | 5576 | HP nền 185 → 200; ATK 15 → 16. Giữ proc Cận Thị và nhịp bắn. |
| Đội Trưởng Sắc Màu | T2 | 42.26% | 4768 | HP nền 205 → 215; ATK 12 → 13. Giữ buff hỗ trợ. |
| Courage Nhút Nhát | T2 | 45.45% | 5584 | Chỉ áp ngân sách rarity mới; giữ kit/Bí kỹ hiện tại trong lượt đầu. |
| Sói Suy Tư | T2 | 45.14% | 5416 | Chỉ áp ngân sách rarity mới; giữ kit/Bí kỹ hiện tại trong lượt đầu. |
| Sếp Chốt Đơn | T3 | 47.93% | 5976 | HP nền 210 → 220; ATK 15 → 16. Không tăng khống chế hoặc friendly fire. |
| Lốp Lăn Ăn Vặt | T1 | 47.26% | 5248 | Chỉ áp ngân sách rarity mới; giữ kit/Bí kỹ hiện tại trong lượt đầu. |
| Cờ Con Cổ Vũ | T2 | 60.64% | 6664 | HP nền 235 → 225; ATK 15 → 14. Giữ hồi, bán kính cờ và mọi công dụng Bí kỹ; chưa giảm riêng Dồn Sức. |
| Kiếm Khách Mượn Vai | T2 | 43.60% | 6160 | Chỉ áp ngân sách rarity mới; giữ kit/Bí kỹ hiện tại trong lượt đầu. |
| Mâm Quả Chủ Tịch | T2 | 39.29% | 4912 | HP nền 230 → 240; ATK 13 → 14. Giữ tỷ lệ hồi/quả, không tự nhân hồi nhiều vùng. |
| Hộp Quà Nghiêm Túc | T3 | 57.45% | 6872 | Chỉ áp ngân sách rarity mới; giữ kit/Bí kỹ hiện tại trong lượt đầu. |
| Hiệp Sĩ Gâu Gâu | T2 | 61.10% | 5224 | HP nền 275 → 265; giữ hitbox khiên/chặn, sát thương và toàn bộ công dụng Bí kỹ. |
| Họa Sĩ Chạy Deadline | T3 | 44.19% | 5920 | HP nền 200 → 215; ATK 15 → 16. Kết hợp ngân sách T3 mới. |
| Anh Tết Ship Nhanh | T2 | 60.55% | 6576 | ATK nền 20 → 19; cooldown 20 → 21 tick. Giữ Super né/tăng tốc và đệ tiếp tế. |
| Ông Hoàng Nồi Lẩu | T2 | 48.05% | 5016 | Chỉ áp ngân sách rarity mới; giữ kit/Bí kỹ hiện tại trong lượt đầu. |
| Cô Nàng Khui Tết | T2 | 47.20% | 4680 | Chỉ áp ngân sách rarity mới; giữ kit/Bí kỹ hiện tại trong lượt đầu. |
| Hoàng Tử Ngậm Hoa | T2 | 43.39% | 5896 | HP nền 235 → 245. Giữ Frozen, số hoa và nhịp hỗ trợ. |
| Độ Duy Môn | T3 | 51.52% | 6320 | Chỉ áp ngân sách rarity mới; giữ kit/Bí kỹ hiện tại trong lượt đầu. |
| Đẳng Cấp Aura | T4 | 52.24% | 5176 | Chỉ áp ngân sách rarity mới; giữ kit/Bí kỹ hiện tại trong lượt đầu. |
| King Of RiseOn | T4 | 42.85% | 4808 | HP nền 245 → 260; ATK 18 → 19. Giữ tầm/vũ khí; kết hợp ngân sách T4 mới. |
| Thi Thánh Họ Mai | T2 | 43.52% | 5712 | Chỉ áp ngân sách rarity mới; giữ kit/Bí kỹ hiện tại trong lượt đầu. |
| Công Tử Phú Thọ | T2 | 48.80% | 5152 | Chỉ áp ngân sách rarity mới; giữ kit/Bí kỹ hiện tại trong lượt đầu. |
| Anh Fam De Phonk | T2 | 52.16% | 6352 | Chỉ áp ngân sách rarity mới; giữ kit/Bí kỹ hiện tại trong lượt đầu. |
| Robot Da Đỏ | T2 | 44.10% | 5184 | Chỉ áp ngân sách rarity mới; giữ kit/Bí kỹ hiện tại trong lượt đầu. |
| Người Máy Sịp Đỏ Phế Thải | RAC | 47.12% | 5176 | Chỉ áp ngân sách rarity mới; giữ kit/Bí kỹ hiện tại trong lượt đầu. |
| Wacom Hỏng Hóc | RAC | 48.04% | 3832 | Ống Kính Quét dạng thường: tia giữa 340 → 310%, trần 360 → 330%. Dạng hợp cạ: tia giữa 236 → 320%, trần 256 → 340%; giữ không tự/đồng đội hại. Nhánh khác chưa giảm. |
| Chó Bóng Bay | RAC | 66.60% | 6632 | ATK nền 17 → 16; Đoàn Bóng Hộ Tống dạng thường 90 → 65% ATK/quả, trần/người 270 → 195%; dạng Skyrocket 60 → 70%, trần 180 → 210%. Giữ 8 quả, 1 hit/quả, không friendly fire của phần phụ. |
| Ủn Đại Ca | T4 | 54.07% | 6248 | Chỉ áp ngân sách rarity mới; giữ kit/Bí kỹ hiện tại trong lượt đầu. |
| Bang Chủ Cái Bang | T4 | 43.71% | 4880 | HP nền 225 → 240; ATK 13 → 14. Giữ số vùng và chống cộng tick; kết hợp ngân sách T4 mới. |
| Sóc Jake | T4 | 56.09% | 5992 | Chỉ áp ngân sách rarity mới; giữ kit/Bí kỹ hiện tại trong lượt đầu. |

## 5. Hợp cạ: sửa nền chung và các ngoại lệ

1. Hệ số hiệu lực phần có lợi của đồ hợp cạ: 1,08 → 1,12. Không tăng mặt phạt như giảm tốc; riêng cooldown âm là lợi ích và cần xử lý đúng chiều. Không nhân hồi riêng/thời hạn/maxUses vô tội vạ.
2. Người dùng đúng đồ hợp cạ được +2% HP nền và +2% ATK nền (tính sau ngân sách rarity và trước đồ), một lần/nhân vật. Đồ/stat/hiệu ứng hiện tại vẫn hoạt động; không cộng lặp vào summon/DoT. Đây là lợi thế nhỏ ổn định để các đồ thiên về speed/cleanse vẫn có công dụng ngoài trận có khống chế.
3. Dạng biến hình phải được đo với cả ba Bí kỹ và không Bí kỹ. Giữ ID/hình biến hình và các rủi ro được giảm; không cho biến hình âm thầm hạ nền Bí kỹ.

| Cặp cần ưu tiên | Hợp cạ / đồ khác hiện tại | Chỉnh riêng đề xuất |
|---|---|---|
| Chó Bóng Bay × Chuỗi Tên Lửa Giấy | 48,75% / 66,84% | Cùng gói hạ dạng thường, nâng hệ số Đoàn Bóng Hộ Tống dạng Skyrocket 60 → 70%, trần 210%; không tăng lại dạng thường lên 90. |
| Wacom × Eli The Best | 54,41% / 47,87% | Hiện nhánh scan dạng biến hình chỉ 236% tia giữa so với 340% dạng thường. Sau cân bằng đặt 320%/trần 340 cho biến hình, so với 310%/330 dạng thường; giữ không friendly fire. Đo lại vì tổng tỷ lệ hiện tại đã có lợi. |
| Bang Chủ × Dép Tổ Ong | 33,93% / 44,53% | Ngoài nền T4/HP/ATK mới, đúng chủ tăng damage vùng dép 8%, không tăng số vùng, nhịp tick hoặc thời gian Frozen. |
| Hộp Quà × Kiếm kim cương Minecraft | 49,22% / 57,90% | Thêm đúng chủ +6% HP nền chủ vào HP đệ khổng lồ lúc gọi, tối đa 25 HP; một lần mỗi lần gọi. Giữ thời hạn/số đệ/damage; không buff mọi người cầm kiếm. |
| Phonk × Tiết Khí Sư Cuối Cùng | 46,48% / 52,67% | Đúng chủ tăng 8% damage lốc chính; không tăng lực hút/nhịp tick, không áp thêm hệ số lên mắt bão phụ. |

Những cặp âm còn lại (Bé/Cơm, Tím/Claude, Sói/Nem, Kiếm Khách/Xôi, Nồi Lẩu/Vịt, Khui Tết/Kem, Aura/Cánh) trước mắt chỉ nhận nền hợp cạ mới, chưa bù theo phần trăm thua quan sát. Nếu vẫn âm trên đối chứng cùng đội/cùng seed/cùng Bí kỹ mới chỉnh riêng. Không nhân buff theo chênh tỷ lệ hiện tại.

## 6. Kiểm chứng trước khi áp dụng rộng

- Đối chứng thay một lựa chọn: giữ hai đồng đội, đối thủ, cấp, vị trí, Bí kỹ và seed; chỉ đổi nhân vật hoặc món đồ. Trong bài kiểm tra A/B, dùng lại seed có chủ đích để giảm nhiễu; khác với chế độ tìm kiếm seed trận riêng của UI.
- So đồ cùng rarity/ngân sách, chuẩn hóa mỗi nhân vật có số mẫu bằng nhau; ghi riêng dạng biến hình và từng Bí kỹ. So hợp cạ cũng cần kiểm tra bỏ bonus hợp cạ trên cùng món để tách lợi ích của bonus khỏi bản thân vật phẩm.
- Ít nhất 5 seed phiên tìm kiếm và hai bộ phân phối đối thủ (đều ngẫu nhiên / đội mạnh), đánh giá tách train; mở rộng mẫu đến khi chênh nhóm ổn định. Vài trăm trận/cặp thường chưa phân biệt được lợi thế nhỏ 2–4 điểm; cần hàng nghìn đến chục nghìn lượt tùy độ biến động, phân tích theo cụm đội/seed thay vì coi mọi lượt độc lập.
- Kiểm tra Lv1/3/7/10, đủ 33 nhân vật, 33 cặp hợp cạ, cả ba Bí kỹ/không lắp. Các ngưỡng rarity phải kiểm tra theo từng cấp, không chỉ Lv10.
- Theo dõi riêng Chó, Cờ, Hiệp, Anh Tết, King, Bang Chủ; ghi damage hữu dụng, hồi/khiên thực hấp thụ và năng lượng/Super. Kiểm tra không mất proc/số đệ/vùng nền, trần sát thương và tính tất định qua checkpoint.
- Triển khai từng lớp để quy nguồn: (A) sửa nhánh quá mạnh/biến hình; (B) rarity và nền yếu/mạnh; (C) hợp cạ. Sau đó mới kiểm tra toàn gói. Tất cả con số đề xuất cần được điều chỉnh bằng kết quả sau thay đổi, không tuyên bố đã đạt dải mục tiêu.

Dữ liệu phân tích chi tiết: reports/balance-review/colony-1904857412-analysis.json. Không sửa dữ liệu báo cáo người dùng cung cấp.
