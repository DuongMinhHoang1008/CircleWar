# Đề xuất tổng thể 99 Bí kỹ — bản duyệt ngày 30/10/2026

**Trạng thái: chỉ đề xuất, chưa sửa gameplay, chưa đo hiệu quả sau thay đổi.** Bản này thay thế gói chín nhánh trước. Mọi con số “đề xuất” là điểm bắt đầu để thử cân bằng, không phải kết quả đã đạt. Phạm vi gồm 33 nhân vật × 3 Bí kỹ; giữ tên, ID, mốc mở 3/8/15 và tiến độ. Mỗi nhân vật lắp một Bí kỹ; giữ giới hạn một Truyền thừa mỗi đội.

## Quyết định thiết kế để duyệt

1. **Mỗi Bí kỹ là một nâng cấp so với chưa lắp.** Giữ sức mạnh và công dụng nền; thêm lợi ích có giới hạn hoặc thay một thành phần bằng phiên bản tốt hơn. Không thu phí bằng giảm HP/hồi/nhịp đánh vô điều kiện chỉ vì đã mở khóa Bí kỹ.
2. **Giữ 99 lựa chọn có bản sắc.** Đòn tỏa, hồi lưu, mìn, drone, kiếm trễ, hộ vệ, giải trạng thái vẫn có đường đánh/hành vi riêng. Nhiều nhánh biến thể đòn thường chuyển thành đòn phụ theo chu kỳ để không mất đòn gốc. Không cộng nguyên Super biến thể hiện tại vào toàn bộ Super gốc; các phần phụ trong bản này đã được thu nhỏ riêng.
3. **Ngang hàng giữa ba mốc.** Mốc 15 mở hướng khác, không mặc định mạnh nhất. Nhánh tình huống mạnh khi đúng vai trò; không phải mọi nhánh đều cần tăng DPS hoặc mạnh hơn ở 1v1.
4. **Mức đích ban đầu:** khoảng +10–20% sát thương hữu dụng cho nhánh tấn công; +15–25% đóng góp đúng vai trò cho nhánh hỗ trợ/phòng thủ. Những mức này là mục tiêu trên bộ tình huống đại diện, không phải tăng cứng mọi chỉ số. Nhánh giải khống chế, mở rộng vùng hoặc giảm tự hại cần tiêu chí vai trò riêng; không ép về một điểm tổng hợp.
5. **Được phép hạ hệ số của nhánh hiện đang quá mạnh** khi chuyển sang thiết kế mới, miễn bản cuối đạt lợi ích ròng so với bộ gốc. Không mặc định cả 99 phải mạnh hơn cả phiên bản đang lắp hiện tại.

## Cách đọc và quy tắc chung bắt buộc

- “Giữ gốc” nghĩa là giữ engine hiện hành ở cùng nhân vật/cấp/trang bị/chế độ: nhịp đánh, sát thương đòn nền, số mặt vũ khí, proc, tăng trưởng theo thời gian và công dụng Super; chỉ thay phần được ghi rõ trong từng đề xuất. Mô tả gốc trích từ source có thể có sai lệch với runtime; phải đối chiếu trước khi triển khai, không lấy mô tả để âm thầm đổi nền.
- ATK là chỉ số tấn công hiện tại sau buff/tăng trưởng; “ATK gốc/HP gốc chủ” là baseline sau cấp/trang bị, không nhân lặp bởi buff tạm. Phần thuộc Super chịu hệ số Super đúng một lần. Thông số tầm/bán kính dùng đơn vị hiển thị hiện hành; thời gian dùng giây.
- “Đòn trúng thứ N” là N lần đòn gốc thành công trên địch trong vòng 4 giây giữa hai lần trúng. Một nhịp vũ khí chỉ cộng một lượt, dù chạm nhiều địch/hai mặt vũ khí. Đòn phụ/DoT/phản công/đệ không cộng bộ đếm. Đánh trượt không cộng. Chỉ tiêu lượt khi tạo được đòn phụ; đầy giới hạn thì giữ tối đa một lượt chờ, không tích để xả dồn.
- “Phát thứ N” là N lần bắn thường thành công, kể cả phát trượt. Với nhân vật hỗ trợ, phát tiếp sức hợp lệ vẫn tính. Nhánh tự đuổi chọn địch trong hành lang ngắm/tầm gốc, không tự bắn ngoài tầm. Đòn phụ theo nhịp riêng không trì hoãn đòn gốc.
- Mọi đòn phụ mặc định không chí mạng, không proc trang bị/trạng thái đòn thường, không nạp năng lượng, không kích liên kết hoặc tự sinh thêm thế hệ. Chỉ tương tác được ghi rõ ở từng nhánh mới được phép. Đòn gốc giữ toàn bộ các luật này.
- Đòn phụ cần chủ còn sống lúc tạo. Vật thể đã bay tiếp tục theo lifetime gốc; vật thể còn xoay cần chủ sống. Đệ/trụ tiếp tục theo luật gốc, không tính là người sống. Sự kiện kết thúc Super không tạo đòn sau khi chủ đã chết.
- Hồi HP là hồi thực sau giảm hồi, luật chế độ và trần HP; khiên một nguồn không cộng tầng. Khiên thêm tối đa 60 HP/lần, hồi thêm tối đa 20 HP/lần, trừ phần nền vốn có. Không hồi sinh, không miễn sát thương mới ngoài hiệu ứng né đã có sẵn.
- Giữ trần 240 đạn, 64 đệ/trụ và 120 vùng. Chỗ của đòn phụ không được làm mất lượt/đạn/vùng gốc: ưu tiên phần nền; đầy thì bỏ phụ. Những cơ chế cần nhiều vật thể cùng lúc phải có ngân sách riêng trong trần chung, không âm thầm phát thiếu như ba đùi gà.
- Giữ trần lực đẩy/hút, chống nối Choáng và luật trạng thái hiện hành. Các vùng cùng nguồn trùng nhau lấy hiệu lực mạnh nhất và chung nhịp theo mô tả; không cộng damage nhiều lần do thêm vùng phụ.
- Friendly fire của phần gốc theo bản gốc, trừ mức giảm ghi rõ. Phần phụ mặc định không gây hại đồng đội/chủ. Cần thử riêng item_28, item_29, item_30 vì đổi dạng chiến đấu.

## Cơ sở thực tế và giới hạn kết luận

Đã có **4.224 trận trên engine v36 trước thay đổi**: Lv.10, không trang bị, 3v3 đội hai bên cùng nhân vật, hai bộ đồng đội, tám seed và đổi bên. Mỗi nhánh có 32 trận, kèm bộ gốc cùng seed/bên. Điểm = (thắng + 0,5 × hòa)/số trận. Có 60/99 nhánh dưới 50%, 35 nhánh thấp ở cả hai đội hình. Đây là sàng lọc, không phải ước lượng tỷ lệ thắng thực tế hoặc chứng minh cơ chế mới cân bằng. Hai lượt đổi bên chung seed không độc lập. Không chạy lại mô phỏng khi chưa có luật mới.

Mỗi mục bên dưới có mô tả/đánh đổi hiện tại, điểm mẫu cũ, luật đề xuất hoàn chỉnh, giới hạn và phép kiểm chứng riêng. Không suy từ điểm thấp ra một hệ số tăng cố định; bảng cũng bao gồm các nhánh vốn đang tốt.

## Mục lục duyệt theo nhân vật

| Nhân vật | Số Bí kỹ | Ba lựa chọn |
| --- | --- | --- |
| [1. Hổ Hướng Nội](#char_01) | 01–03 | Nén Bão · Bình Tâm · Chỗ Dựa |
| [2. Bé Ôm Bão](#char_02) | 04–06 | Vòng Ôm Xoắn · Kéo Về Đây · Bão Gấu Bông |
| [3. Anh Tím Mọng](#char_03) | 07–09 | Chùm Nho Tách Hạt · Quả Cầu Hồi Lưu · Mưa Hạt Chín |
| [4. Đùi Gió Lốc](#char_04) | 10–12 | Lưỡi Gió · Bước Đệm Gió · Lốc Cuốn Theo Người |
| [5. Kính Cận Bắt Bài](#char_05) | 13–15 | Đạn Khoan · Trạm Săn Đuổi · Pháo Ba Nòng |
| [6. Đội Trưởng Sắc Màu](#char_06) | 16–18 | Lăng Kính Tách Tia · Cầu Vồng Quay Lại · Giao Điểm Sắc Màu |
| [7. Courage Nhút Nhát](#char_07) | 19–21 | Gào Bật Âm · Bẫy Can Đảm · Tiếng Hú Dội Tường |
| [8. Sói Suy Tư](#char_08) | 22–24 | Song Nha · Liềm Trăng · Bầy Sói Ảo |
| [9. Sếp Chốt Đơn](#char_09) | 25–27 | Deadline Gập · Ghim Việc · Dây Chuyền Công Việc |
| [10. Lốp Lăn Ăn Vặt](#char_10) | 28–30 | Vành Cưa · Lốp Hồi Lưu · Hai Làn Lăn |
| [11. Cờ Con Cổ Vũ](#char_11) | 31–33 | Trạm Tiếp Sức · Hiệu Lệnh · Dồn Sức |
| [12. Kiếm Khách Mượn Vai](#char_12) | 34–36 | Trảm Chữ Thập · Kiếm Vọng · Mưa Phi Kiếm |
| [13. Mâm Quả Chủ Tịch](#char_13) | 37–39 | Suất Dành Riêng · Khay Thanh Mát · Hậu Cần |
| [14. Hộp Quà Nghiêm Túc](#char_14) | 40–42 | Gói Gia Cố · Quà Tiếp Tế · Hộ Tống |
| [15. Hiệp Sĩ Gâu Gâu](#char_15) | 43–45 | Khiên Hồi Lưu · Phản Kích Khiên · Chiến Hữu Xương |
| [16. Họa Sĩ Chạy Deadline](#char_16) | 46–48 | Mực Loang · Bút Lượn Sóng · Ba Ô Tranh |
| [17. Anh Tết Ship Nhanh](#char_17) | 49–51 | Đơn Hàng Xuyên Tuyến · Giao Hàng Hai Chiều · Trạm Giao Nhanh |
| [18. Ông Hoàng Nồi Lẩu](#char_18) | 52–54 | Muôi Vung Rộng · Nắp Nồi Bay · Bếp Lẩu Dã Chiến |
| [19. Cô Nàng Khui Tết](#char_19) | 55–57 | Phi Phong Bao · Bao Lì Xì Hồi Đáp · Sạp Lộc Di Động |
| [20. Hoàng Tử Ngậm Hoa](#char_20) | 58–60 | Hồng Leo · Lưu Hương · Vườn Che Chở |
| [21. Độ Duy Môn](#char_21) | 61–63 | Pháo Tản · Khí Xuyên · Vệ Tinh Khí Nén |
| [22. Đẳng Cấp Aura](#char_22) | 64–66 | Tâm Hào Quang · Dư Âm · Dẫn Nhịp |
| [23. King Of RiseOn](#char_23) | 67–69 | Xung Kiếm · Kiếm Quét Hai Trục · Vương Kiếm Tách Mảnh |
| [24. Thi Thánh Họ Mai](#char_24) | 70–72 | Bút Tam Tài · Mực Đuổi Hình · Bút Trận Tứ Phương |
| [25. Công Tử Phú Thọ](#char_25) | 73–75 | Đồng Xu Xoay · Búng Tiền · Quỹ Đầu Tư Tiền Tuyến |
| [26. Anh Fam De Phonk](#char_26) | 76–78 | Lưỡi Bass · Vòng Xoáy Đổi Beat · Hai Mắt Bão |
| [27. Robot Da Đỏ](#char_27) | 79–81 | Hỏa Tiễn Tay · Dao Nhiệt Hồi Lưu · Lò Nung Vệ Tinh |
| [28. Người Máy Sịp Đỏ Phế Thải](#char_28) | 82–84 | Nắm Đấm Phóng · Đĩa Cưa Tái Chế · Laser Tách Tia |
| [29. Wacom Hỏng Hóc](#char_29) | 85–87 | Điểm Ảnh Tách · Đạn Gập Gương · Ống Kính Quét |
| [30. Chó Bóng Bay](#char_30) | 88–90 | Bóng Chùm · Bóng Neo · Đoàn Bóng Hộ Tống |
| [31. Ủn Đại Ca](#char_31) | 91–93 | Rocket Chia Đầu · Tên Lửa Truy Đuổi · Trận Địa Pháo |
| [32. Bang Chủ Cái Bang](#char_32) | 94–96 | Dép Hồi Lưu · Đôi Dép So Le · Tam Giác Dép |
| [33. Sóc Jake](#char_33) | 97–99 | Dĩa Bay Xuyên Tuyến · Đùi Gà Quét Vòng · Tiệc Nướng Trên Không |

## Danh sách duyệt đủ 99 Bí kỹ

<a id="char_01"></a>

### 1. Hổ Hướng Nội

**Bộ gốc theo mô tả:** Đòn thường có 20% vào Hướng Nội trong 2 giây: giảm 15% sát thương nhận, hồi 0,8% HP/giây, đổi lại giảm 15% di chuyển. Chỉ Hổ tự nhận hiệu ứng này.

**Super gốc theo mô tả:** Vồ về phía địch; đòn chạm đầu tiên gây 180% Damage và chắc chắn Hướng Nội. Không dịch chuyển tức thời.

#### 01. Nén Bão · mốc 3

ID: `tigerBurst`. Điểm mẫu cũ: **46,88%** (43,75% / 50% ở hai đội hình).

- **Hiện tại:** Tích 20% sát thương HP thực nhận trong lúc Hướng Nội, tối đa 6% HP gốc. Khi trạng thái kết thúc, đòn thường kế tiếp dùng toàn bộ phần tích làm sát thương bổ sung. Đánh đổi: Hồi HP từ Hướng Nội giảm từ 0,8% xuống 0,4% mỗi giây. Không tích sát thương vào khiên.
- **Đề xuất:** Giữ hồi Hướng Nội 0,8% HP/giây. Tích 25% HP thực mất do địch trong Hướng Nội, trần 6% HP gốc; cộng vào đòn thường trúng đầu tiên sau khi hết trạng thái. Không tiêu phần tích khi đánh trượt.
- **Lợi ích và giới hạn:** Thêm phản công mà không mất hồi. Phần tích không cộng dồn qua nhiều chu kỳ; phần chưa dùng hết hạn sau 6 giây.
- **Kiểm chứng riêng:** Đo sát thương trả đòn và HP hồi; khi không bị đánh, hồi phải bằng bộ gốc.

#### 02. Bình Tâm · mốc 8

ID: `tigerCalm`. Điểm mẫu cũ: **43,75%** (37,5% / 50% ở hai đội hình).

- **Hiện tại:** Khi vào Hướng Nội, tự xóa Frozen hoặc Paralyzed đang có. Hồi riêng 10 giây; không xóa choáng hay sát thương theo thời gian. Đánh đổi: Mỗi lần Hướng Nội chỉ kéo dài 1,4 giây, thay vì 2 giây.
- **Đề xuất:** Giữ Hướng Nội đủ 2 giây. Khi vào trạng thái, giải một Frozen hoặc Paralyzed và miễn tái áp đúng loại vừa giải trong 1 giây; hồi riêng 8 giây.
- **Lợi ích và giới hạn:** Giữ trọn phòng thủ nền, thêm khả năng tiếp cận. Không giải Choáng, Burn hoặc DoT; không kéo dài miễn bằng làm mới Hướng Nội.
- **Kiểm chứng riêng:** Đối chiếu thời gian bị chậm/tê, thời gian tiếp cận và sống sót; kiểm tra đối thủ không có khống chế.

#### 03. Chỗ Dựa · mốc 15 · Truyền thừa

ID: `tigerGuard`. Điểm mẫu cũ: **50%** (50% / 50% ở hai đội hình).

- **Hiện tại:** Mỗi lần dùng Super, đồng đội khác có tỷ lệ HP thấp nhất nhận khiên bằng 6% HP gốc của Hổ trong 3 giây. Hồi 6 giây; khiên cùng nguồn chỉ làm mới. Đánh đổi: Sát thương Super của Hổ giảm 25%. Hướng Nội vẫn chỉ thuộc về Hổ, không truyền trạng thái cho người khác.
- **Đề xuất:** Giữ toàn bộ Super 180% và Hướng Nội. Sau Super, cấp khiên 6% HP gốc Hổ trong 3 giây cho một đồng đội khác yếu nhất; hồi 6 giây. Khi không có đồng đội sống, Hổ nhận khiên này.
- **Lợi ích và giới hạn:** Bỏ giảm 25% sát thương Super. Khiên một nguồn chỉ làm mới, không cộng tầng; giữ loại Truyền thừa.
- **Kiểm chứng riêng:** Đo khiên thực hấp thụ, Super gây sát thương và khả năng cứu đồng đội; kiểm tra 1v1.

<a id="char_02"></a>

### 2. Bé Ôm Bão

**Bộ gốc theo mô tả:** Đòn thường có 20% gây Tiểu Đường trong 3 giây, giảm 35% hồi phục.

**Super gốc theo mô tả:** Tăng 100% tốc độ xoay trong 3 giây; mọi đòn thường trúng trong thời gian này chắc chắn gây Tiểu Đường.

#### 04. Vòng Ôm Xoắn · mốc 3

ID: `char_02:pressure`. Điểm mẫu cũ: **62,5%** (68,75% / 56,25% ở hai đội hình).

- **Hiện tại:** Thay đòn chạm vũ khí bằng một vòng quét quanh người trong bán kính 82, tối đa ba địch, mỗi địch nhận 85% ATK một lần mỗi nhịp. Đánh đổi: Nhịp đánh dài hơn 50%; chỉ địch sát người mới trúng.
- **Đề xuất:** Giữ đòn thường. Mỗi đòn trúng thứ tư thêm vòng ôm bán kính 82: 40% ATK lên mục tiêu chính và tối đa hai địch khác.
- **Lợi ích và giới hạn:** Thêm sát thương sát người; vòng phụ không xét Tiểu Đường hoặc đếm chuỗi, không làm chậm nhịp nền.
- **Kiểm chứng riêng:** So sát thương 1v1/ba địch gần; một chu kỳ chỉ tạo một vòng và giữ tần suất Tiểu Đường gốc.

#### 05. Kéo Về Đây · mốc 8

ID: `char_02:resolve`. Điểm mẫu cũ: **35,94%** (18,75% / 53,13% ở hai đội hình).

- **Hiện tại:** Thay đòn thường bằng tay ôm phóng thẳng tầm 160, gây 75% ATK và kéo người trúng về phía Bé với lực có trần. Đánh đổi: Nhịp đánh dài hơn 45%; đường móc hẹp, có thể trượt và bị đệ chặn.
- **Đề xuất:** Giữ đòn thường. Mỗi 4 giây, khi có địch hợp lệ trong tầm 160 theo hướng đánh, phóng tay ôm 50% ATK, kéo lực 300 về phía Bé; không tiêu hồi nếu chưa phóng được.
- **Lợi ích và giới hạn:** Móc phụ giúp bắt mục tiêu, không thay đòn chạm. Chặn bởi đệ/khiên; không xuyên tường, không proc đòn thường.
- **Kiểm chứng riêng:** Đo thời gian áp sát và sát thương; kiểm tra kéo sát tường và mục tiêu bị vật thể chắn.

#### 06. Bão Gấu Bông · mốc 15

ID: `char_02:tempo`. Điểm mẫu cũ: **68,75%** (68,75% / 68,75% ở hai đội hình).

- **Hiện tại:** Thay Super xoay nhanh bằng ba quả cầu xoay quanh Bé một giây, rồi rời quỹ đạo đuổi địch. Mỗi quả gây 65% ATK. Đánh đổi: Mất phần tăng xoay và bảo đảm Tiểu Đường của Super gốc.
- **Đề xuất:** Giữ buff xoay và bảo đảm Tiểu Đường của Super gốc. Thêm ba gấu bông xoay 1 giây rồi đuổi địch, mỗi quả 15% ATK, chỉ chạm một địch một lần.
- **Lợi ích và giới hạn:** Thêm tối đa 45% ATK nếu cả ba trúng một người; gấu không gây Tiểu Đường hoặc nạp Super.
- **Kiểm chứng riêng:** Đo tổng sát thương trong 3 giây Super, số gấu thực trúng và tần suất Tiểu Đường.

<a id="char_03"></a>

### 3. Anh Tím Mọng

**Bộ gốc theo mô tả:** Ném quả theo hướng vũ khí; quả gây 90% Damage và có một lần nảy tường, tối đa 5 lần theo tăng trưởng. Sau nảy có thể trúng lại nhưng mỗi mục tiêu có hồi trúng 0,4 giây.

**Super gốc theo mô tả:** Ném rổ quả lớn: đạn nảy, nổ bán kính 90 khi trúng, gây 160% Damage cho mục tiêu chính và 60% cho địch xung quanh.

#### 07. Chùm Nho Tách Hạt · mốc 3

ID: `char_03:pressure`. Điểm mẫu cũ: **18,75%** (12,5% / 25% ở hai đội hình).

- **Hiện tại:** Quả thường gây 55% ATK; lần va chạm đầu hoặc hết tầm tách ba hạt bay theo ba hướng, mỗi hạt bằng 30% sát thương quả mẹ. Đánh đổi: Không còn nảy; nhịp ném dài hơn 20%. Hạt con không kích hoạt đòn thường hay tách tiếp.
- **Đề xuất:** Giữ quả 90% ATK, nhịp và số nảy theo tăng trưởng. Mỗi quả thứ tư tách ba hạt 15% ATK khi lần đầu trúng địch; quả mẹ tiếp tục hành vi gốc.
- **Lợi ích và giới hạn:** Hạt là sát thương thêm, không tách tiếp; không trúng lại người vừa kích tách. Nếu quả mẹ hết tầm chưa trúng, không sinh hạt.
- **Kiểm chứng riêng:** Đo sát thương quả/hạt riêng ở 0/30/60 giây; xác nhận quả mẹ vẫn nảy và tăng trưởng vẫn hữu ích.

#### 08. Quả Cầu Hồi Lưu · mốc 8

ID: `char_03:resolve`. Điểm mẫu cũ: **40,63%** (50% / 31,25% ở hai đội hình).

- **Hiện tại:** Quả thường bay ra rồi quay về chủ sau 0,6 giây. Mỗi mục tiêu chỉ trúng một lần mỗi lượt đi/về, 90% ATK mỗi lần, tối đa hai người mỗi chiều. Đánh đổi: Không nảy; nhịp ném dài hơn 15%, tối đa một quả hồi lưu đang bay.
- **Đề xuất:** Giữ quả và nảy gốc. Mỗi lần bắn thứ năm thêm một quả hồi lưu: đi 45% ATK, về 30%, quay sau 0,6 giây, tối đa hai địch mỗi chiều.
- **Lợi ích và giới hạn:** Đòn phụ không khóa ném quả thường; tối đa một quả phụ đang bay, không tích lượt chờ để bắn dồn.
- **Kiểm chứng riêng:** Đo sát thương và khoảng ngừng bắn; thử đứng sát tường, mất chủ và mục tiêu đổi hướng.

#### 09. Mưa Hạt Chín · mốc 15

ID: `char_03:tempo`. Điểm mẫu cũ: **51,56%** (56,25% / 46,88% ở hai đội hình).

- **Hiện tại:** Thay rổ quả bằng năm hạt mìn rải quanh mục tiêu. Lên ngòi sau 0,6 giây, chạm địch hoặc hết 3 giây thì nổ trong bán kính 55, 50% ATK mỗi hạt. Đánh đổi: Không còn cú rổ 160%; hạt đứng yên, có thể tránh vùng rải.
- **Đề xuất:** Giữ rổ quả Super gốc. Tại điểm nổ đặt thêm năm hạt mìn 10% ATK, lên ngòi sau 0,6 giây, bán kính 55, tồn tại 3 giây.
- **Lợi ích và giới hạn:** Mỗi địch nhận tối đa 30% ATK từ cả nhóm hạt; hạt không nảy, không proc hoặc gây hại đồng đội.
- **Kiểm chứng riêng:** Đo sát thương rổ gốc riêng và hạt riêng; kiểm tra năm mìn trùng vị trí vẫn giữ trần.

<a id="char_04"></a>

### 4. Đùi Gió Lốc

**Bộ gốc theo mô tả:** Đòn cận chiến có lực đẩy cao, tăng theo thời gian. Impulse giảm dần, bị giới hạn và chặn bởi tường.

**Super gốc theo mô tả:** Xoay nhanh trong 3 giây, tăng lực đẩy lên trần; vẫn có hồi đòn và nhận sát thương bình thường.

#### 10. Lưỡi Gió · mốc 3

ID: `char_04:pressure`. Điểm mẫu cũ: **50%** (56,25% / 43,75% ở hai đội hình).

- **Hiện tại:** Thay đòn cận chiến bằng lưỡi gió bay lượn sang hai bên theo đường tiến, gây 85% ATK và xuyên tối đa hai mục tiêu. Đánh đổi: Nhịp đánh dài hơn 35%; không còn cú đẩy mạnh của đòn thường gốc.
- **Đề xuất:** Giữ đòn chạm và lực đẩy gốc. Mỗi đòn trúng thứ tư phóng một lưỡi gió 45% ATK, tầm 200, xuyên tối đa hai địch.
- **Lợi ích và giới hạn:** Có sát thương nối tiếp sau cú đẩy; sóng không proc hoặc thêm lực đẩy, nhịp nền giữ nguyên.
- **Kiểm chứng riêng:** Đo sát thương sau đẩy, hit sóng ở nhiều khoảng cách và lực đẩy nền.

#### 11. Bước Đệm Gió · mốc 8

ID: `char_04:resolve`. Điểm mẫu cũ: **53,13%** (37,5% / 68,75% ở hai đội hình).

- **Hiện tại:** Mỗi nhịp lao ngắn theo hướng vũ khí và phóng một mặt gió rộng phía trước, gây 110% ATK khi chạm. Đánh đổi: Nhịp đánh dài hơn 60%; lao theo hướng xoay, không tự né đòn hay xuyên tường.
- **Đề xuất:** Giữ đòn gốc. Mỗi 4 giây phóng mặt gió 45% ATK tầm 140 vào địch hợp lệ, kèm lao ngắn 0,25 giây; chỉ lao khi địch ở ngoài tầm chạm.
- **Lợi ích và giới hạn:** Thêm tiếp cận, không tự lao xuyên đối thủ hoặc bỏ chạy khỏi mục tiêu đang chạm. Không có miễn sát thương.
- **Kiểm chứng riêng:** Đo thời gian ngoài tầm đánh; thử địch ở sát thân, tường và góc sân để tránh lao bất lợi.

#### 12. Lốc Cuốn Theo Người · mốc 15

ID: `char_04:tempo`. Điểm mẫu cũ: **37,5%** (37,5% / 37,5% ở hai đội hình).

- **Hiện tại:** Super tạo một lốc bán kính 120 đi theo chủ trong 3 giây, kéo địch về tâm và gây 22% ATK mỗi giây. Đánh đổi: Thay toàn bộ phần tăng xoay/lực đẩy của Super gốc.
- **Đề xuất:** Giữ tăng xoay/lực đẩy của Super. Thêm lốc đi theo chủ bán kính 100 trong 3 giây, gây 10% ATK/giây và hút lực bằng 25% lốc thường của Phonk.
- **Lợi ích và giới hạn:** Lốc hỗ trợ giữ địch, tối đa ba lần sát thương/người; lực hút chịu trần impulse hiện hành, không cộng thành khóa vị trí.
- **Kiểm chứng riêng:** Đo thời gian địch trong tầm và sát thương Super; kiểm tra hút/đẩy không tạo dao động vô hạn.

<a id="char_05"></a>

### 5. Kính Cận Bắt Bài

**Bộ gốc theo mô tả:** Bắn đạn có 20% gây Cận Thị trong 3 giây, giảm 30% tầm bắn. Không đổi tầm vũ khí cận chiến.

**Super gốc theo mô tả:** Đặt một trụ súng có HP, tồn tại 8 giây, bắn địch gần nhất trong 220. Tối đa một trụ mỗi chủ; trụ có thể bị phá.

#### 13. Đạn Khoan · mốc 3

ID: `char_05:pressure`. Điểm mẫu cũ: **23,44%** (28,13% / 18,75% ở hai đội hình).

- **Hiện tại:** Đạn thường thành mũi khoan lớn, xuyên tối đa ba mục tiêu theo một đường thẳng, 100% ATK mỗi người. Đánh đổi: Nhịp bắn dài hơn 50%; không tự bẻ hướng hoặc nảy tường.
- **Đề xuất:** Đạn chính giữ 100% ATK và nhịp gốc; nâng thành đạn khoan xuyên hai mục tiêu phụ, mỗi người phụ chịu 25% ATK.
- **Lợi ích và giới hạn:** Địch đầu tiên giữ proc Cận Thị; địch phụ không proc. Tổng ba người, cùng người chỉ trúng một lần/viên.
- **Kiểm chứng riêng:** Đo sát thương đơn mục tiêu không giảm và sát thương tuyến sau; kiểm tra đệ chắn.

#### 14. Trạm Săn Đuổi · mốc 8

ID: `char_05:resolve`. Điểm mẫu cũ: **56,25%** (53,13% / 59,38% ở hai đội hình).

- **Hiện tại:** Super gọi drone có HP đi theo chủ trong 6 giây. Drone tự bắn một viên vào địch gần trong tầm 220 mỗi giây. Đánh đổi: Thay trụ cố định 8 giây; drone chỉ có 25% HP gốc chủ và mỗi phát bằng 40% ATK gốc.
- **Đề xuất:** Thay trụ đứng bằng một drone bám chủ, tồn tại 8 giây, HP bằng trụ gốc, mỗi giây bắn 55% ATK gốc chủ trong 220.
- **Lợi ích và giới hạn:** Cùng một ô triệu hồi Super, không gọi kèm trụ cũ. Tăng nhẹ hỏa lực và duy trì tầm; drone vẫn bị phá.
- **Kiểm chứng riêng:** So số phát trúng, thời gian hoạt động, sát thương và hấp thụ đạn với trụ gốc trước đội cơ động/đứng gần.

#### 15. Pháo Ba Nòng · mốc 15

ID: `char_05:tempo`. Điểm mẫu cũ: **40,63%** (50% / 31,25% ở hai đội hình).

- **Hiện tại:** Super đặt pháo có HP, tồn tại 6 giây; mỗi 1,5 giây bắn ba viên tỏa quạt vào hướng địch, mỗi viên 25% ATK gốc. Đánh đổi: Thay trụ bắn đơn; yếu khi mục tiêu chỉ trúng một nhánh quạt.
- **Đề xuất:** Một trụ ba nòng trong 8 giây, HP bằng trụ gốc, bắn mỗi giây: viên giữa 50% ATK gốc, hai viên bên 10% mỗi viên.
- **Lợi ích và giới hạn:** Một người nhận tối đa 60% ATK mỗi loạt; cùng ô trụ Super. Giữ tầm 220, không proc hoặc nạp Super từ trụ.
- **Kiểm chứng riêng:** Đo hỏa lực khi chỉ viên giữa trúng và khi trúng cả loạt; không thấp hơn trụ gốc ở mục tiêu đứng giữa.

<a id="char_06"></a>

### 6. Đội Trưởng Sắc Màu

**Bộ gốc theo mô tả:** Bắn dải màu xuyên tối đa ba nhân vật: đồng đội nhận Rage nhẹ, địch nhận Frozen và sát thương. Dải dài dần và tạo nhanh dần.

**Super gốc theo mô tả:** Bắn tia cầu vồng rộng trong tầm 320; đồng đội trên tia nhận Rage/Blessing, kẻ địch chịu 180% Damage.

#### 16. Lăng Kính Tách Tia · mốc 3

ID: `char_06:pressure`. Điểm mẫu cũ: **25%** (31,25% / 18,75% ở hai đội hình).

- **Hiện tại:** Mỗi lần bắn tạo ba dải màu theo ba hướng; mỗi dải gây 40% ATK. Dải màu vẫn có thể tiếp sức đồng đội trên đường bay. Đánh đổi: Nhịp bắn dài hơn 45%; sát thương mỗi dải thấp hơn và không nhân chồng buff cùng loại.
- **Đề xuất:** Giữ dải màu chính, nhịp, xuyên và tương tác đồng đội gốc. Mỗi dải thứ tư thêm hai dải bên 20% ATK mỗi dải.
- **Lợi ích và giới hạn:** Dải phụ có thể tiếp sức nhưng cùng một người chỉ nhận buff một lần mỗi loạt; chỉ dải chính proc Frozen.
- **Kiểm chứng riêng:** Đo sát thương và thời gian buff cả đội; thử đồng đội chắn trước địch, không nhân buff ba lần.

#### 17. Cầu Vồng Quay Lại · mốc 8

ID: `char_06:resolve`. Điểm mẫu cũ: **43,75%** (50% / 37,5% ở hai đội hình).

- **Hiện tại:** Dải màu bay ra rồi trở về chủ, có thể chạm lại một người ở lượt về; mỗi lượt gây 60% ATK, giữ tương tác tiếp sức của dải màu. Đánh đổi: Nhịp bắn dài hơn 50%; chỉ giữ một dải hồi lưu đang bay.
- **Đề xuất:** Giữ dải thường. Mỗi dải thứ năm thêm dải hồi lưu 35% ATK mỗi chiều, xuyên tối đa hai người/chiều và vẫn tiếp sức đồng đội.
- **Lợi ích và giới hạn:** Không chặn dải gốc; mỗi người nhận tiếp sức từ dải phụ tối đa một lần mỗi 2 giây; tối đa một dải phụ.
- **Kiểm chứng riêng:** Đo số đồng đội được buff và sát thương, kiểm tra quay về không tạo buff vô hạn.

#### 18. Giao Điểm Sắc Màu · mốc 15

ID: `char_06:tempo`. Điểm mẫu cũ: **39,06%** (43,75% / 34,38% ở hai đội hình).

- **Hiện tại:** Thay tia cầu vồng đơn bằng hai tia hẹp vuông góc tại người dùng, mỗi tia dài 260 và gây 90% ATK. Đồng đội trên tia vẫn được tiếp sức. Đánh đổi: Không còn tia rộng 320; cần đứng đúng giao điểm để phủ nhiều mục tiêu.
- **Đề xuất:** Giữ tia chính 180% ATK, chiều dài 320 và bề rộng gốc. Thêm một tia vuông góc dài 260, 35% ATK và tiếp sức như gốc.
- **Lợi ích và giới hạn:** Người ở giao điểm nhận tối đa 215% ATK và một bộ buff/Super. Không có hai Super độc lập.
- **Kiểm chứng riêng:** Đo sát thương ở trục chính, trục phụ, giao điểm; kiểm tra buff đồng đội không nhân đôi.

<a id="char_07"></a>

### 7. Courage Nhút Nhát

**Bộ gốc theo mô tả:** Khi nhận đòn trực tiếp có 18% né và chạy ngược nguồn đánh trong 1,5 giây; né thành công có hồi 1,5 giây, không né DoT đã gắn.

**Super gốc theo mô tả:** Hét trong bán kính 150: Choáng 0,5 giây và Paralyzed 25% trong 2 giây. Choáng có cửa sổ chống nối liên tục.

#### 19. Gào Bật Âm · mốc 3

ID: `char_07:pressure`. Điểm mẫu cũ: **40,63%** (31,25% / 50% ở hai đội hình).

- **Hiện tại:** Đòn thường thành một vành âm thanh bay ra rồi trở về. Mỗi lượt đi/về có thể trúng mỗi địch một lần, 65% ATK. Đánh đổi: Chỉ một vành đang bay; không còn đánh chạm vũ khí trong lúc chờ vành về.
- **Đề xuất:** Giữ đòn thường và cơ chế né. Mỗi đòn trúng thứ tư thêm vành âm hồi lưu, 35% ATK mỗi chiều, tầm 170.
- **Lợi ích và giới hạn:** Không dừng đánh chạm trong lúc chờ; vành phụ không né thêm, không proc; tối đa một vành.
- **Kiểm chứng riêng:** Đo sát thương và tỷ lệ né nền; thử vừa chạy tránh đòn vừa bắt vành.

#### 20. Bẫy Can Đảm · mốc 8

ID: `char_07:resolve`. Điểm mẫu cũ: **46,88%** (43,75% / 50% ở hai đội hình).

- **Hiện tại:** Khi mất HP do địch đánh trực tiếp, để lại một bẫy âm trước người. Sau 0,6 giây bẫy lên ngòi, nổ bán kính 55 với 65% ATK. Hồi 6 giây. Đánh đổi: Nhịp đánh thường dài hơn 25%. Bẫy đứng yên, chỉ tồn tại 3 giây và không cho né thêm.
- **Đề xuất:** Giữ nhịp đánh gốc. Khi mất HP từ đòn trực tiếp của địch, đặt bẫy 65% ATK; lên ngòi 0,4 giây, tồn tại 3 giây, bán kính 55; hồi 6 giây.
- **Lợi ích và giới hạn:** Bỏ phạt nhịp 25%. Không kích từ mất khiên, DoT, tự hại hoặc đòn đã né; tối đa một bẫy/chủ.
- **Kiểm chứng riêng:** Đo sát thương phản công, số lần bẫy trúng; kiểm tra né không kích bẫy và không hình thành chuỗi phản.

#### 21. Tiếng Hú Dội Tường · mốc 15

ID: `char_07:tempo`. Điểm mẫu cũ: **62,5%** (56,25% / 68,75% ở hai đội hình).

- **Hiện tại:** Thay tiếng hét khống chế bằng tám vành âm bắn ra tám hướng, mỗi vành nảy tường hai lần và gây 30% ATK. Đánh đổi: Không còn Choáng/Paralyzed diện rộng từ Super gốc.
- **Đề xuất:** Giữ tiếng hét Choáng/Paralyzed gốc. Thêm tám vành âm 8% ATK, nảy tối đa một lần.
- **Lợi ích và giới hạn:** Một địch nhận tối đa 24% ATK từ các vành của một Super; vành không gây thêm khống chế.
- **Kiểm chứng riêng:** Đo thời gian khống chế gốc và sát thương cộng thêm; kiểm tra trần khi ép góc.

<a id="char_08"></a>

### 8. Sói Suy Tư

**Bộ gốc theo mô tả:** Đòn thường có 20% gây Bleeding trong 3 giây; nạn nhân mất HP khi thực sự di chuyển, không cộng tầng.

**Super gốc theo mô tả:** Trăng máu trong 4 giây: +30% Damage, +20% di chuyển và xoay; đổi lại nhận thêm 20% sát thương trực tiếp.

#### 22. Song Nha · mốc 3

ID: `char_08:pressure`. Điểm mẫu cũ: **59,38%** (62,5% / 56,25% ở hai đội hình).

- **Hiện tại:** Đòn thường quét thành hai đường nanh vuông góc. Mỗi địch chỉ nhận một lần 75% ATK trong cùng nhịp, tối đa ba người. Đánh đổi: Nhịp đánh dài hơn 55%; không tăng sát thương khi hai đường cùng chạm một người.
- **Đề xuất:** Giữ đòn thường và Bleeding. Mỗi đòn trúng thứ tư thêm hai đường nanh chữ thập tầm 90, 40% ATK, tối đa ba địch.
- **Lợi ích và giới hạn:** Mỗi người chỉ trúng một lần nhịp chữ thập; nhát phụ không proc Bleeding; bỏ thay toàn bộ nhịp đánh.
- **Kiểm chứng riêng:** Đo sát thương đơn/đa mục tiêu và tỷ lệ Bleeding; kiểm tra hai trục cùng chạm một địch.

#### 23. Liềm Trăng · mốc 8

ID: `char_08:resolve`. Điểm mẫu cũ: **56,25%** (56,25% / 56,25% ở hai đội hình).

- **Hiện tại:** Ném liềm trăng xuyên hai địch rồi quay về chủ; mỗi người có thể trúng một lần mỗi chiều, 65% ATK. Đánh đổi: Không đánh chạm trong lúc liềm đang bay; không tự hồi HP khi bắt liềm.
- **Đề xuất:** Giữ đòn chạm. Mỗi đòn trúng thứ năm ném liềm tầm 190, 45% ATK lúc đi và 30% lúc về, xuyên hai địch/chiều.
- **Lợi ích và giới hạn:** Liềm không ngừng đánh chạm và không proc Bleeding thêm; chỉ một liềm, không tích lượt bắn dồn.
- **Kiểm chứng riêng:** Đo sát thương truy đuổi và lượt về, so tần suất Bleeding với bộ gốc.

#### 24. Bầy Sói Ảo · mốc 15

ID: `char_08:tempo`. Điểm mẫu cũ: **56,25%** (56,25% / 56,25% ở hai đội hình).

- **Hiện tại:** Thay Trăng máu bằng hai sói nhỏ có HP đuổi địch bằng chuyển động vật lý, tồn tại 5 giây; mỗi cú cắn bằng 30% ATK gốc chủ. Đánh đổi: Không nhận phần tăng sát thương/tốc độ của Trăng máu. Mỗi sói chỉ có 18% HP gốc chủ.
- **Đề xuất:** Giữ Trăng máu cả buff lẫn rủi ro nhận thêm sát thương. Thêm hai sói săn trong 5 giây, mỗi sói 12% HP gốc chủ, cắn 10% ATK gốc mỗi 0,8 giây.
- **Lợi ích và giới hạn:** Tổng sát thương sói lên một địch tối đa 60% ATK gốc/mỗi Super; không proc Bleeding, không giữ round.
- **Kiểm chứng riêng:** Đo lợi ích sói riêng và HP chủ; kiểm tra rủi ro Super vẫn đúng, sói không tính người sống.

<a id="char_09"></a>

### 9. Sếp Chốt Đơn

**Bộ gốc theo mô tả:** Ném deadline, 20% gây Paralyzed 25% trong 2 giây.

**Super gốc theo mô tả:** Rải năm vùng deadline tồn tại 4 giây. Tất cả người khác, kể cả đồng đội, chạm vùng sẽ chịu sát thương, Paralyzed và Áp lực giảm 20% Damage. Không dùng Hướng Nội của Hổ.

#### 25. Deadline Gập · mốc 3

ID: `char_09:pressure`. Điểm mẫu cũ: **32,81%** (31,25% / 34,38% ở hai đội hình).

- **Hiện tại:** Deadline gập thành đường đạn đi rồi quay về, gây 65% ATK mỗi lượt; mỗi mục tiêu chỉ trúng một lần mỗi chiều. Đánh đổi: Nhịp bắn dài hơn 50%; chỉ một deadline hồi lưu đang bay.
- **Đề xuất:** Giữ deadline và proc gốc. Mỗi phát thứ năm thêm deadline hồi lưu 40% ATK mỗi chiều; quay sau 0,6 giây, hai địch/chiều.
- **Lợi ích và giới hạn:** Không làm chậm bắn thường, không thêm Paralyzed từ đạn phụ, tối đa một deadline phụ.
- **Kiểm chứng riêng:** Đo sát thương, tần suất tê và số phát nền khi deadline chưa về.

#### 26. Ghim Việc · mốc 8

ID: `char_09:resolve`. Điểm mẫu cũ: **26,56%** (31,25% / 21,88% ở hai đội hình).

- **Hiện tại:** Phóng một ghim bay 80 đơn vị rồi neo lại. Sau 0,6 giây lên ngòi, chạm địch hoặc hết 3 giây thì nổ bán kính 55 với 95% ATK. Đánh đổi: Nhịp đặt dài hơn 30%; phải dụ địch đi vào ghim, không tự gây Paralyzed của đòn thường.
- **Đề xuất:** Giữ deadline thường. Mỗi phát thứ tư đặt thêm ghim tại điểm trúng hoặc hết tầm: 40% ATK, lên ngòi 0,4 giây, bán kính 55, tồn tại 3 giây.
- **Lợi ích và giới hạn:** Tối đa ba ghim/chủ, không sát thương đồng đội, không proc Paralyzed. Không thay đạn chính bằng mìn.
- **Kiểm chứng riêng:** Đo sát thương và số lần ghim trúng; kiểm tra proc gốc không mất và đếm tối đa ba ghim.

#### 27. Dây Chuyền Công Việc · mốc 15

ID: `char_09:tempo`. Điểm mẫu cũ: **56,25%** (50% / 62,5% ở hai đội hình).

- **Hiện tại:** Bắn một deadline chuyền mục tiêu: sau mỗi cú trúng, đường đạn đuổi người chưa trúng gần đó trong 140, tối đa bốn địch, 75% ATK mỗi người. Đánh đổi: Thay năm vùng deadline; đường chuyền có thể bị chặn và không tạo vùng áp lực.
- **Đề xuất:** Giữ năm vùng deadline và hiệu ứng gốc. Khi Super kích hoạt, thêm một deadline chuyền tối đa ba địch, 15% ATK mỗi người, khoảng chuyền 140.
- **Lợi ích và giới hạn:** Không chuyền về người đã trúng, không khống chế thêm. Sát thương đồng đội của vùng gốc giảm 25% so với bộ gốc, không thêm friendly fire từ đạn chuyền.
- **Kiểm chứng riêng:** Đo sát thương địch, friendly fire và thời gian áp lực; đường chuyền phải bay thật.

<a id="char_10"></a>

### 10. Lốp Lăn Ăn Vặt

**Bộ gốc theo mô tả:** Đòn thường có 25% tạo khiên mỏng 4% HP, tồn tại 2 giây; có hồi kích hoạt 1 giây.

**Super gốc theo mô tả:** Lăn lao nhanh trong 2,5 giây và đẩy người chạm phải; vẫn nhận đầy đủ sát thương, không có bất tử.

#### 28. Vành Cưa · mốc 3

ID: `char_10:pressure`. Điểm mẫu cũ: **53,13%** (75% / 31,25% ở hai đội hình).

- **Hiện tại:** Đòn thường quét tròn quanh Lốp, tối đa ba địch trong bán kính 78, mỗi người 70% ATK. Đánh đổi: Nhịp đánh dài hơn 65%; không đánh từ xa.
- **Đề xuất:** Giữ vũ khí và proc khiên gốc. Mỗi đòn trúng thứ tư quét vòng bán kính 78, 40% ATK lên tối đa ba địch.
- **Lợi ích và giới hạn:** Vòng phụ không tạo khiên thêm; không kéo dài nhịp đánh hoặc tạo thêm lượt khi chỉ đi sát địch.
- **Kiểm chứng riêng:** Đo sát thương và khiên thực hấp thụ; kiểm tra đúng số lượt tạo khiên gốc.

#### 29. Lốp Hồi Lưu · mốc 8

ID: `char_10:resolve`. Điểm mẫu cũ: **31,25%** (43,75% / 18,75% ở hai đội hình).

- **Hiện tại:** Phóng một vành lốp lớn đi rồi trở về, mỗi chiều gây 60% ATK và có thể xuyên hai địch. Đánh đổi: Tạm ngừng đòn chạm trong khi vành lốp chưa về.
- **Đề xuất:** Giữ đòn chạm. Mỗi đòn trúng thứ năm thêm vành hồi lưu 40% ATK mỗi chiều, tầm 175, xuyên hai địch/chiều.
- **Lợi ích và giới hạn:** Không ngừng đòn chạm hoặc mất proc khiên; một vành phụ, không hồi HP khi bắt.
- **Kiểm chứng riêng:** Đo sát thương, khiên và thời gian ngoài tầm; không dùng đòn phụ để kích khiên.

#### 30. Hai Làn Lăn · mốc 15

ID: `char_10:tempo`. Điểm mẫu cũ: **53,13%** (50% / 56,25% ở hai đội hình).

- **Hiện tại:** Thay cú tự lăn bằng hai lốp nhỏ có HP lao theo hai làn, nảy khi va chạm, húc địch bằng 55% ATK gốc và đẩy người trúng. Tồn tại 4 giây. Đánh đổi: Chủ không còn được lao nhanh. Mỗi lốp có 18% HP gốc chủ và có thể bị phá.
- **Đề xuất:** Giữ cú lăn 2,5 giây và lực đẩy gốc. Thêm hai lốp nhỏ chạy 4 giây, mỗi lốp 12% HP gốc, húc 15% ATK gốc mỗi 0,8 giây, lực đẩy 150.
- **Lợi ích và giới hạn:** Một địch chịu tối đa 60% ATK gốc từ hai lốp/Super; giữ trần impulse, không bất tử cho chủ.
- **Kiểm chứng riêng:** Đo quãng tiếp cận và sát thương; thử nhiều va chạm ở góc, giới hạn đệ và lượt húc.

<a id="char_11"></a>

### 11. Cờ Con Cổ Vũ

**Bộ gốc theo mô tả:** Đánh cận chiến và tự đặt cờ mỗi 4 giây: vùng cờ buff Rage/hồi HP cho đồng đội, Frozen cho địch. Tối đa ba cờ, không nhân chồng cùng loại.

**Super gốc theo mô tả:** Cổ vũ tất cả đồng đội trong 3 giây, cấp khiên bằng 5% HP gốc của Cờ; địch trong 180 nhận Áp lực và Paralyzed.

#### 31. Trạm Tiếp Sức · mốc 3

ID: `flagShield`. Điểm mẫu cũ: **50%** (50% / 50% ở hai đội hình).

- **Hiện tại:** Đồng đội khác lần đầu vào vùng cờ nhận khiên bằng 4% HP gốc của Cờ trong 3 giây. Mỗi mục tiêu có hồi chung 8 giây giữa mọi cờ. Đánh đổi: Cờ không còn hồi HP định kỳ cho đồng đội. Các lá chắn cùng nguồn không cộng dồn.
- **Đề xuất:** Giữ hồi HP, Rage và bán kính cờ gốc. Đồng đội khác lần đầu vào cờ nhận khiên 3% HP gốc Cờ trong 3 giây, hồi 8 giây/người giữa mọi cờ.
- **Lợi ích và giới hạn:** Thêm chống dồn sát thương; bỏ mất hồi nền. Khiên cùng nguồn không cộng tầng.
- **Kiểm chứng riêng:** Đo hồi thực và khiên thực hấp thụ; xác nhận chuyển qua nhiều cờ không bỏ qua hồi riêng.

#### 32. Hiệu Lệnh · mốc 8

ID: `flagParalyze`. Điểm mẫu cũ: **56,25%** (68,75% / 43,75% ở hai đội hình).

- **Hiện tại:** Kẻ địch vào vùng cờ nhận Paralyzed 15% trong 1 giây, giảm nhịp đánh và xoay. Mỗi mục tiêu có hồi 5 giây. Đánh đổi: Cờ bỏ Frozen và bán kính vùng cờ giảm 15%.
- **Đề xuất:** Giữ Frozen, hồi và bán kính cờ gốc. Địch vào vùng nhận thêm Paralyzed 15% trong 1 giây, hồi 5 giây/người.
- **Lợi ích và giới hạn:** Thêm cản nhịp đánh, không mất cản di chuyển; thời gian tê không kéo dài bởi nhiều cờ.
- **Kiểm chứng riêng:** Đo thời gian Frozen và Paralyzed riêng; kiểm tra đối thủ ra/vào vùng liên tục.

#### 33. Dồn Sức · mốc 15 · Truyền thừa

ID: `flagFocus`. Điểm mẫu cũ: **46,88%** (56,25% / 37,5% ở hai đội hình).

- **Hiện tại:** Khiên từ Super tập trung vào một đồng đội khác có tỷ lệ HP thấp nhất, bằng 10% HP gốc của Cờ, thay vì chia khiên 5% cho từng người. Đánh đổi: Các đồng đội còn lại và bản thân Cờ không nhận khiên từ Super.
- **Đề xuất:** Giữ khiên Super 5% HP gốc Cờ cho mọi đồng đội như gốc; tăng riêng đồng đội khác yếu nhất lên 10%, không cộng thành 15%. Không có đồng đội khác thì bản thân tăng lên 10%.
- **Lợi ích và giới hạn:** Thêm bảo vệ đúng người, không bỏ khiên các thành viên còn lại; giữ Truyền thừa và hiệu ứng địch gốc.
- **Kiểm chứng riêng:** Đo khiên hấp thụ từng người, thử đội 1/2/3 quân và mục tiêu chết ngay trước Super.

<a id="char_12"></a>

### 12. Kiếm Khách Mượn Vai

**Bộ gốc theo mô tả:** Cận chiến, xoay cơ sở nhanh hơn 35%. Tốc độ xoay và Damage tăng theo thời gian.

**Super gốc theo mô tả:** Trong 2,5 giây xoay rất nhanh và lao về phía địch; không tự miễn sát thương hay vượt tường.

#### 34. Trảm Chữ Thập · mốc 3

ID: `char_12:pressure`. Điểm mẫu cũ: **65,63%** (56,25% / 75% ở hai đội hình).

- **Hiện tại:** Hai đường kiếm vuông góc thay đòn chạm, mỗi người nhận tối đa một lần 95% ATK mỗi nhịp. Đánh đổi: Nhịp đánh dài hơn 25%; giới hạn ba địch mỗi nhịp.
- **Đề xuất:** Giữ xoay/vũ khí gốc. Mỗi đòn trúng thứ tư thêm chữ thập tầm 105, 40% ATK lên tối đa ba địch.
- **Lợi ích và giới hạn:** Bỏ thay toàn bộ đòn chạm. Một người chỉ nhận một nhát phụ, chỉ đòn gốc proc/đếm chuỗi.
- **Kiểm chứng riêng:** Đo sát thương theo tốc độ xoay và trận nhiều địch; phát hiện double-hit hai trục.

#### 35. Kiếm Vọng · mốc 8

ID: `char_12:resolve`. Điểm mẫu cũ: **54,69%** (43,75% / 65,63% ở hai đội hình).

- **Hiện tại:** Chém một đường 84% ATK, để lại vệt báo trước tại đúng vị trí chém. Sau 0,4 giây, vệt chém lặp gây thêm 42% ATK cho người còn đứng trên đó. Đánh đổi: Nhịp đánh dài hơn 30%; nhát lặp đứng yên, có thể tránh và không kích hoạt proc đòn thường.
- **Đề xuất:** Giữ nhát chém gốc. Mỗi đòn trúng thứ ba để vệt chém báo trước; sau 0,3 giây chém lại 45% ATK, dài 95, theo vị trí/hướng ban đầu.
- **Lợi ích và giới hạn:** Không giảm sát thương hoặc kéo dài nhịp nhát đầu. Nhát lặp né được, tối đa ba địch, không proc.
- **Kiểm chứng riêng:** Đo tỷ lệ nhát lặp trúng và sát thương sau mỗi ba đòn; xác nhận vệt không bám mục tiêu.

#### 36. Mưa Phi Kiếm · mốc 15

ID: `char_12:tempo`. Điểm mẫu cũ: **75%** (81,25% / 68,75% ở hai đội hình).

- **Hiện tại:** Thay lao kiếm bằng mười hai phi kiếm tỏa quanh người, mỗi kiếm nảy tường hai lần, 45% ATK. Đánh đổi: Không còn cú lao và tăng xoay của Super gốc.
- **Đề xuất:** Giữ cú lao và tăng xoay Super gốc. Cuối cú lao phóng tám phi kiếm 10% ATK, mỗi kiếm nảy một lần.
- **Lợi ích và giới hạn:** Một địch nhận tối đa 30% ATK từ nhóm kiếm; điều chỉnh lại nhánh hiện có điểm mẫu cao để tránh ghép nguyên 12 kiếm 45% với buff gốc.
- **Kiểm chứng riêng:** Đo sát thương cả cửa sổ Super, trần khi sát tường và khả năng áp sát gốc.

<a id="char_13"></a>

### 13. Mâm Quả Chủ Tịch

**Bộ gốc theo mô tả:** Ném hoa quả xuyên tối đa ba mục tiêu: trúng đồng đội hồi HP bằng 65% Damage và cấp Blessing/Rage nhẹ; trúng địch gây Damage và Tiểu Đường. Tốc độ ném và bay tăng dần.

**Super gốc theo mô tả:** Rải tám quả quanh sân gần bản thân, tạo vùng tiếp tế ngắn hạn buff đồng đội và debuff địch.

#### 37. Suất Dành Riêng · mốc 3

ID: `fruitOverflow`. Điểm mẫu cũ: **46,88%** (43,75% / 50% ở hai đội hình).

- **Hiện tại:** 15% lượng hồi dư từ quả thường thành khiên cho đúng đồng đội đó; tối đa 4% HP gốc của Mâm Quả, tồn tại 3 giây. Hồi 8 giây mỗi mục tiêu. Đánh đổi: Lượng hồi HP trực tiếp từ quả thường giảm 20%. Không chuyển khiên thành khiên thêm.
- **Đề xuất:** Giữ 100% hồi quả thường. Chuyển 30% hồi dư sau giảm hồi thành khiên, trần 4% HP gốc Mâm Quả, 3 giây, hồi 6 giây/người.
- **Lợi ích và giới hạn:** Bỏ giảm hồi trực tiếp 20%; chỉ chuyển hồi dư thực, không chuyển khiên hoặc hồi bị giảm thành khiên.
- **Kiểm chứng riêng:** Đo hồi thực và khiên hấp thụ ở đội đầy máu/bị thương/giảm hồi; không ghi hồi dư là hồi hữu dụng.

#### 38. Khay Thanh Mát · mốc 8

ID: `fruitCleanse`. Điểm mẫu cũ: **46,88%** (43,75% / 50% ở hai đội hình).

- **Hiện tại:** Quả thường trúng đồng đội sẽ xóa một Frozen hoặc Paralyzed trước khi hồi HP. Mỗi mục tiêu có hồi 10 giây. Đánh đổi: Quả chỉ xuyên tối đa hai mục tiêu, thay vì ba. Không giải choáng hoặc DoT.
- **Đề xuất:** Giữ xuyên ba người và hồi/buff gốc. Quả giải một Frozen hoặc Paralyzed trước hồi, hồi 8 giây/người; nếu vừa giải thành công, người đó miễn tái áp đúng loại trong 0,75 giây.
- **Lợi ích và giới hạn:** Không phạt khi đối thủ không có khống chế; không giải Choáng/DoT và không nhân giải theo nhiều quả cùng tick.
- **Kiểm chứng riêng:** Đo thời gian giải khống chế, xuyên đủ ba người và đóng góp trong kèo không có trạng thái cần giải.

#### 39. Hậu Cần · mốc 15 · Truyền thừa

ID: `fruitSupply`. Điểm mẫu cũ: **48,44%** (37,5% / 59,38% ở hai đội hình).

- **Hiện tại:** Super tạo bốn quả tiếp tế lớn. Phần hồi HP của chúng tăng 25% so với quả Super thường; chỉ số khác vẫn theo kỹ năng gốc. Đánh đổi: Số quả Super giảm từ tám xuống bốn và sát thương lên địch của các quả đó giảm 50%.
- **Đề xuất:** Giữ tám vùng quả, sát thương/buff gốc. Tăng hồi mỗi nhịp lên 125% gốc; khi tạo, tối đa hai vùng được dời tới hai đồng đội bị thương gần nhất trong 240, phần còn lại rải như cũ.
- **Lợi ích và giới hạn:** Giữ Truyền thừa. Vùng trùng không nhân nhịp hồi; nếu không có đồng đội bị thương, rải đủ tám vùng gốc.
- **Kiểm chứng riêng:** Đo hồi thực và tỷ lệ đồng đội được tiếp tế, xác nhận đủ tám vùng và không nhân hồi khi trùng.

<a id="char_14"></a>

### 14. Hộp Quà Nghiêm Túc

**Bộ gốc theo mô tả:** Đánh cận chiến; gọi đệ nhỏ đầu tiên sau 3 giây, tiếp tục mỗi 4 giây dù không tấn công. Tối đa hai đệ nhỏ, chuyển động bi-a và nảy khi va chạm; có HP, bị vũ khí đánh và xạ thủ chọn làm mục tiêu.

**Super gốc theo mô tả:** Gọi một đệ khổng lồ tồn tại 10 giây, có HP và Damage riêng, chuyển động bi-a như đệ nhỏ. Đệ tiếp tục hoạt động sau khi chủ chết đến hết lifetime hoặc bị phá; không tính là nhân vật sống để kéo dài round.

#### 40. Gói Gia Cố · mốc 3

ID: `giftTank`. Điểm mẫu cũ: **62,5%** (68,75% / 56,25% ở hai đội hình).

- **Hiện tại:** Đệ nhỏ thành một hộ vệ có 220% HP, 150% Damage và thân lớn hơn thường. Hộ vệ chủ động đứng giữa chủ và địch gần nhất, chặn đạn bằng thân và vẫn va chạm/nảy theo vật lý. Đánh đổi: Giới hạn đệ nhỏ giảm từ hai xuống một: ít hướng chặn và tổng nhịp gây sát thương thấp hơn.
- **Đề xuất:** Giữ tối đa hai đệ nhỏ. Đệ có 115% HP và 100% Damage so với đệ gốc; một đệ ưu tiên chắn trước chủ, đệ còn lại giữ hành vi tấn công gốc.
- **Lợi ích và giới hạn:** Bỏ việc mất một đệ. Không dùng lại hệ số 220% HP/150% Damage cho cả hai; một hộ vệ, một đệ thường.
- **Kiểm chứng riêng:** Đo sát thương đệ, HP đệ thực hấp thụ và sát thương chủ nhận; kiểm tra hai vai trò khi một đệ chết.

#### 41. Quà Tiếp Tế · mốc 8

ID: `giftShield`. Điểm mẫu cũ: **28,13%** (18,75% / 37,5% ở hai đội hình).

- **Hiện tại:** Đệ nhỏ thành đệ tiếp tế, tìm đồng đội khác bị thương và hồi 1% HP gốc chủ mỗi 2 giây khi đến trong 45, tối đa 20 HP/lần. Khi bị đối thủ phá, vẫn cấp khiên 4% HP gốc chủ cho một đồng đội gần trong 120, hồi chung 6 giây. Đánh đổi: Đệ nhỏ giảm 20% HP và không đánh địch trực tiếp. Khiên khi bị phá không kích khi hết lifetime hoặc chủ đã bị hạ.
- **Đề xuất:** Giữ hai đệ và 100% HP/Damage gốc. Một đệ nhận thêm vai trò tiếp tế: trong 60 đơn vị hồi đồng đội khác yếu nhất 1,5% HP gốc chủ mỗi 2 giây, trần 20 HP/lần; tấn công khi có địch chạm.
- **Lợi ích và giới hạn:** Chỉ một đệ chữa trị/chủ. Khi đệ này bị địch phá, khiên 3% HP gốc chủ cho một đồng đội trong 120, hồi chung 8 giây; không kích khi hết hạn.
- **Kiểm chứng riêng:** Đo sát thương đệ không sụt mạnh vì đi cứu người, hồi thực và khiên khi bị phá; thử không có đồng đội.

#### 42. Hộ Tống · mốc 15 · Truyền thừa

ID: `giftEscort`. Điểm mẫu cũ: **43,75%** (25% / 62,5% ở hai đội hình).

- **Hiện tại:** Chọn một đồng đội trước trận. Đệ khổng lồ từ Super xuất hiện gần và đi theo bảo vệ người đó, chặn đạn bằng thân và tấn công địch chạm gần. Vẫn va chạm/nảy theo vật lý; đổi người được bảo vệ nếu mục tiêu đã bị hạ. Đánh đổi: Đệ khổng lồ giảm 30% Damage và chỉ tồn tại 8 giây thay vì 10; không rời người được bảo vệ để đuổi địch xa.
- **Đề xuất:** Giữ Damage và thời gian 10 giây của đệ khổng lồ. Cho chọn đồng đội để hộ tống, tăng HP đệ lên 110% gốc; nếu không có mục tiêu hợp lệ thì bảo vệ chủ.
- **Lợi ích và giới hạn:** Đệ chặn bằng thân và đánh khi địch ở gần, không tự đổi thành bất tử/chuyển sát thương. Không phạt Damage hoặc lifetime; giữ Truyền thừa.
- **Kiểm chứng riêng:** Đo HP người được bảo vệ và sát thương đệ; kiểm tra mục tiêu chết, chủ chết và thời hạn còn lại.

<a id="char_15"></a>

### 15. Hiệp Sĩ Gâu Gâu

**Bộ gốc theo mô tả:** Cầm kiếm và khiên ở hai phía. Khiên có hitbox chặn đạn trực diện, kích thước tăng dần; cú đánh của khiên chỉ gây 40% Damage.

**Super gốc theo mô tả:** Ném tám mảnh xương/kiếm/khiên ra xung quanh, gây sát thương và đẩy lùi; vẫn có thể né hoặc chặn.

#### 43. Khiên Hồi Lưu · mốc 3

ID: `char_15:pressure`. Điểm mẫu cũ: **40,63%** (31,25% / 50% ở hai đội hình).

- **Hiện tại:** Ném khiên thành đĩa bay xuyên hai địch rồi quay về; mỗi lượt gây 90% ATK. Chỉ có một khiên đang bay. Đánh đổi: Trong lúc khiên bay, không đánh cận chiến và không dùng khiên chặn đạn.
- **Đề xuất:** Giữ kiếm, cú chạm khiên và hitbox chặn đạn gốc. Mỗi 4 giây, khi có địch trong 180, phóng một bản sao khiên: 40% ATK mỗi chiều, hai địch/chiều.
- **Lợi ích và giới hạn:** Không tháo khiên thật, không dừng cận chiến; một bản sao đang bay, không proc hoặc chặn đạn bằng bản sao.
- **Kiểm chứng riêng:** Đo tỷ lệ chặn đạn, sát thương và tính độc lập của khiên thật khi bản sao đang bay.

#### 44. Phản Kích Khiên · mốc 8

ID: `char_15:resolve`. Điểm mẫu cũ: **62,5%** (56,25% / 68,75% ở hai đội hình).

- **Hiện tại:** Sau khi mất HP do địch đánh trực tiếp, phóng ba mảnh khiên theo hướng người vừa đánh, mỗi mảnh 40% ATK. Hồi 6 giây. Đánh đổi: Nhịp đánh thường dài hơn 25%. Không cấp khiên/giảm sát thương thêm, không phản công khi chỉ mất khiên.
- **Đề xuất:** Giữ nhịp đánh gốc. Sau HP thực mất từ địch, bắn ba mảnh theo hướng nguồn đánh, mỗi mảnh 25% ATK, hồi 6 giây.
- **Lợi ích và giới hạn:** Một địch nhận tối đa 50% ATK mỗi lần phản. Không phản từ mất khiên, DoT, tự hại; không proc chuỗi.
- **Kiểm chứng riêng:** Đo sát thương phản, kiểm tra giới hạn shotgun và nhịp kiếm/khiên nền.

#### 45. Chiến Hữu Xương · mốc 15

ID: `char_15:tempo`. Điểm mẫu cũ: **37,5%** (31,25% / 43,75% ở hai đội hình).

- **Hiện tại:** Super gọi một hộ vệ có HP đi theo đồng đội yếu nhất, chặn đường đạn bằng thân và đánh địch gần. Tồn tại 6 giây. Đánh đổi: Thay tám mảnh xương; hộ vệ có 40% HP gốc và 50% ATK gốc chủ, có thể bị phá.
- **Đề xuất:** Giữ tám mảnh xương Super gốc. Thêm một hộ vệ 20% HP gốc chủ trong 4 giây, theo đồng đội yếu nhất hoặc chủ, chỉ chắn bằng thân.
- **Lợi ích và giới hạn:** Hộ vệ không đánh, không cấp khiên hay nạp Super; tối đa một hộ vệ cộng thêm/chủ.
- **Kiểm chứng riêng:** Đo sát thương Super không mất và HP hộ vệ thực chặn; kiểm tra đường đạn có thực sự va vào thân.

<a id="char_16"></a>

### 16. Họa Sĩ Chạy Deadline

**Bộ gốc theo mô tả:** Bắn mực có 20% gây Frozen 20% trong 1,5 giây.

**Super gốc theo mô tả:** Đặt vũng mực lớn bán kính 150, báo trước 0,5 giây, tồn tại 4 giây; gây Damage mỗi giây và Frozen.

#### 46. Mực Loang · mốc 3

ID: `char_16:pressure`. Điểm mẫu cũ: **18,75%** (18,75% / 18,75% ở hai đội hình).

- **Hiện tại:** Viên mực 60% ATK vỡ thành ba nét mực nhỏ theo ba hướng khi va chạm đầu hoặc hết tầm; mỗi nét con bằng 30% đạn mẹ. Đánh đổi: Nhịp bắn dài hơn 25%; nét con không gây proc đòn thường hoặc tách tiếp.
- **Đề xuất:** Giữ viên mực và nhịp gốc. Mỗi viên thứ tư tách ba nét con 15% ATK tại lần trúng đầu hoặc hết tầm, không thay sát thương viên mẹ.
- **Lợi ích và giới hạn:** Không trúng lại người vừa làm tách; nét con không Frozen/proc/tách tiếp; chỉ tách một lần.
- **Kiểm chứng riêng:** Đo viên mẹ/nét con riêng và tần suất Frozen; kiểm tra hết tầm và bị đệ chặn.

#### 47. Bút Lượn Sóng · mốc 8

ID: `char_16:resolve`. Điểm mẫu cũ: **34,38%** (25% / 43,75% ở hai đội hình).

- **Hiện tại:** Nét mực lượn ngang theo đường tiến, xuyên hai mục tiêu với 80% ATK mỗi người. Đánh đổi: Nhịp bắn dài hơn 20%; có thể lượn lệch khỏi mục tiêu đứng yên ở đường giữa.
- **Đề xuất:** Giữ đạn mực gốc. Mỗi viên thứ tư thêm nét sóng 45% ATK, xuyên hai địch, biên độ lượn tối đa 10 đơn vị.
- **Lợi ích và giới hạn:** Không làm lệch viên chính hoặc chậm bắn; sóng không Frozen/proc; tránh mất sát thương ở đường giữa.
- **Kiểm chứng riêng:** Đo tỷ lệ trúng đường giữa và hai bên, sát thương đơn/đa mục tiêu.

#### 48. Ba Ô Tranh · mốc 15

ID: `char_16:tempo`. Điểm mẫu cũ: **28,13%** (25% / 31,25% ở hai đội hình).

- **Hiện tại:** Super tạo ba ô mực bán kính 70 nối thành một dải quanh mục tiêu, báo trước lệch nhịp rồi tồn tại 3 giây, gây 23% ATK mỗi giây. Đánh đổi: Thay một vũng lớn 150; giữa các ô có khoảng tránh và vùng chồng không nhân nhịp sát thương.
- **Đề xuất:** Giữ vũng mực gốc bán kính 150, 4 giây. Thêm hai ô mực bán kính 45 ở hai bên, tồn tại 3 giây, gây 10% ATK/giây và Frozen như vùng gốc.
- **Lợi ích và giới hạn:** Vùng phụ có báo trước 0,5 giây, dùng chung nhịp gây sát thương với vùng gốc; chỗ trùng lấy mạnh nhất.
- **Kiểm chứng riêng:** Đo vùng phủ và thời gian gây sát thương thực; không tăng damage một người bằng chồng ba vùng.

<a id="char_17"></a>

### 17. Anh Tết Ship Nhanh

**Bộ gốc theo mô tả:** Cận chiến nhanh, tốc độ di chuyển và xoay tăng theo thời gian.

**Super gốc theo mô tả:** Giao hàng siêu tốc trong 1,4 giây: tăng tốc mạnh và né tất cả đòn trực tiếp. DoT đã gắn vẫn chạy; không xuyên tường.

#### 49. Đơn Hàng Xuyên Tuyến · mốc 3

ID: `char_17:pressure`. Điểm mẫu cũ: **40,63%** (37,5% / 43,75% ở hai đội hình).

- **Hiện tại:** Đòn thường thành cú đâm thẳng dài 125, có thể xuyên ba địch, 110% ATK mỗi người. Đánh đổi: Nhịp đánh dài hơn 50%; đường đâm hẹp, dễ hụt người ở bên hông.
- **Đề xuất:** Giữ cận chiến nhanh và nhịp gốc. Mỗi đòn trúng thứ tư phóng kiện hàng đâm thẳng tầm 125, 45% ATK, xuyên tối đa hai địch.
- **Lợi ích và giới hạn:** Đòn phụ không tự đánh thêm vào đồng đội hoặc kích trang bị; không cắt mất đòn chạm.
- **Kiểm chứng riêng:** Đo DPS và số đòn theo tốc độ, thử đối thủ né ngang hoặc đứng sau đệ.

#### 50. Giao Hàng Hai Chiều · mốc 8

ID: `char_17:resolve`. Điểm mẫu cũ: **28,13%** (25% / 31,25% ở hai đội hình).

- **Hiện tại:** Ném kiện hàng cứng theo hướng vũ khí rồi kéo về, gây 60% ATK mỗi lượt đi/về, xuyên tối đa hai người. Đánh đổi: Chỉ một kiện đang bay; không đánh chạm trong khi kiện chưa về.
- **Đề xuất:** Giữ đòn chạm. Mỗi đòn trúng thứ năm ném kiện hồi lưu tầm 195, 45% ATK lúc đi và 30% lúc về.
- **Lợi ích và giới hạn:** Một kiện phụ, không khóa cận chiến; bắt kiện không hồi HP hoặc reset nhịp.
- **Kiểm chứng riêng:** Đo sát thương cả hai chiều và thời gian đánh liên tục khi di chuyển nhanh.

#### 51. Trạm Giao Nhanh · mốc 15

ID: `char_17:tempo`. Điểm mẫu cũ: **26,56%** (12,5% / 40,63% ở hai đội hình).

- **Hiện tại:** Thay cú giao hàng né đòn bằng hai đệ tiếp tế có HP tìm đồng đội bị thương. Khi tới gần, mỗi đệ hồi 1% HP gốc chủ mỗi 2 giây, tối đa 20 HP/lần. Tồn tại 6 giây. Đánh đổi: Mất phần lao và né đòn của Super. Đệ chỉ có 18% HP gốc chủ, không tấn công địch.
- **Đề xuất:** Giữ tăng tốc và né đòn trực tiếp 1,4 giây của Super. Thêm một đệ tiếp tế 18% HP gốc chủ trong 5 giây, hồi đồng đội khác 1,5% HP gốc chủ mỗi 1,5 giây trong tầm 60, trần 20 HP/lần.
- **Lợi ích và giới hạn:** Tối đa một đệ, không đánh địch; DoT trên chủ vẫn chạy, không truyền né cho người được hồi.
- **Kiểm chứng riêng:** Đo né, sát thương/di chuyển chủ và hồi đệ; kiểm tra đệ đến được đồng đội trước hết hạn.

<a id="char_18"></a>

### 18. Ông Hoàng Nồi Lẩu

**Bộ gốc theo mô tả:** Thân lớn hơn thường, đòn cận chiến có 25% gây Burn trong 3 giây.

**Super gốc theo mô tả:** Vùng lẩu nóng đi theo chủ trong 4 giây: địch chịu Damage/Burn mỗi giây; chủ hồi nhẹ, đồng đội không nhận phần hồi này.

#### 52. Muôi Vung Rộng · mốc 3

ID: `char_18:pressure`. Điểm mẫu cũ: **57,81%** (56,25% / 59,38% ở hai đội hình).

- **Hiện tại:** Vung muôi thành quạt rộng phía trước, đánh tối đa ba địch, mỗi người 85% ATK. Đánh đổi: Nhịp đánh dài hơn 40%; không đánh được người ở sau lưng.
- **Đề xuất:** Giữ đòn muôi và Burn gốc. Mỗi đòn trúng thứ tư thêm quạt 45% ATK, tầm 90, tối đa ba địch phía trước.
- **Lợi ích và giới hạn:** Đòn phụ không Burn thêm hoặc kích chuỗi; nhịp gốc giữ nguyên.
- **Kiểm chứng riêng:** Đo sát thương đơn/nhóm và Burn; kiểm tra địch sau lưng không trúng quạt.

#### 53. Nắp Nồi Bay · mốc 8

ID: `char_18:resolve`. Điểm mẫu cũ: **53,13%** (50% / 56,25% ở hai đội hình).

- **Hiện tại:** Phóng nắp nồi đi rồi trở về, mỗi chiều 65% ATK; cú trúng chính vẫn xét Burn của bộ kỹ năng. Đánh đổi: Chỉ một nắp đang bay và không đánh chạm trong lúc chờ nắp về.
- **Đề xuất:** Giữ đòn muôi. Mỗi đòn trúng thứ năm ném nắp nồi 40% ATK mỗi chiều, tầm 175, xuyên hai địch/chiều.
- **Lợi ích và giới hạn:** Không mất Burn hoặc cận chiến trong khi nắp bay; nắp phụ không xét Burn.
- **Kiểm chứng riêng:** Đo sát thương, tần suất Burn và số đòn chạm khi nắp đang bay.

#### 54. Bếp Lẩu Dã Chiến · mốc 15

ID: `char_18:tempo`. Điểm mẫu cũ: **37,5%** (31,25% / 43,75% ở hai đội hình).

- **Hiện tại:** Super đặt bếp có HP đứng yên 6 giây, mỗi 1,5 giây bắn một viên lẩu nổ bán kính 55, 40% ATK gốc. Đánh đổi: Không còn vùng lẩu đi theo chủ và phần tự hồi của Super gốc. Bếp có 40% HP gốc chủ.
- **Đề xuất:** Giữ vùng lẩu theo chủ và tự hồi Super gốc. Thêm một bếp 20% HP gốc chủ trong 4 giây; mỗi 1,5 giây bắn đạn nổ 12% ATK gốc chủ, bán kính 55.
- **Lợi ích và giới hạn:** Tối đa một bếp; không Burn thêm, không hồi đồng đội, không nổ trúng chủ/đồng đội.
- **Kiểm chứng riêng:** Đo tự hồi không mất, sát thương bếp riêng, số phát thật trước khi bếp bị phá.

<a id="char_19"></a>

### 19. Cô Nàng Khui Tết

**Bộ gốc theo mô tả:** Chạm đồng đội trao Rage/Blessing; chạm địch gây debuff ngẫu nhiên. Mỗi cặp có hồi trao lì xì 1 giây.

**Super gốc theo mô tả:** Ném tám lì xì hiệu ứng: đồng đội nhận buff, địch nhận Damage và debuff. Không áp Hướng Nội lên nhân vật khác.

#### 55. Phi Phong Bao · mốc 3

ID: `char_19:pressure`. Điểm mẫu cũ: **62,5%** (68,75% / 56,25% ở hai đội hình).

- **Hiện tại:** Mỗi nhịp ném ba phong bao tỏa quạt: trúng địch mỗi bao 40% ATK, trúng đồng đội giữ hiệu ứng lì xì của phong bao. Đánh đổi: Nhịp đánh dài hơn 50%; thay cú đánh chạm và không tăng buff khi nhiều bao cùng trúng một người.
- **Đề xuất:** Giữ đòn chạm và lì xì gốc. Mỗi đòn trúng thứ tư thêm ba phong bao: giữa 20% ATK, hai bên 10%, tầm 180; có thể trao buff gốc khi chạm đồng đội.
- **Lợi ích và giới hạn:** Mỗi người nhận tối đa một buff/loạt, dùng chung hồi lì xì cặp 1 giây; đạn phụ không thêm debuff ngẫu nhiên lên địch.
- **Kiểm chứng riêng:** Đo sát thương và thời gian buff; kiểm tra đạn phụ không bỏ qua hồi cặp.

#### 56. Bao Lì Xì Hồi Đáp · mốc 8

ID: `char_19:resolve`. Điểm mẫu cũ: **62,5%** (50% / 75% ở hai đội hình).

- **Hiện tại:** Một phong bao bay ra rồi trở về; có thể tương tác với mỗi người một lần mỗi chiều. Đánh đổi: Chỉ một bao hồi lưu đang bay; sát thương mỗi chiều 60% ATK và không đánh chạm trong lúc chờ.
- **Đề xuất:** Giữ cận chiến/lì xì chạm. Mỗi đòn trúng thứ năm ném bao hồi lưu 35% ATK mỗi chiều, tầm 190; có thể tiếp sức đồng đội.
- **Lợi ích và giới hạn:** Không khóa đánh chạm; cùng người nhận buff từ bao phụ tối đa một lần mỗi 2 giây; không thêm debuff lên địch.
- **Kiểm chứng riêng:** Đo buff hữu dụng và sát thương; kiểm tra lượt đi/về không nhân buff hoặc debuff.

#### 57. Sạp Lộc Di Động · mốc 15

ID: `char_19:tempo`. Điểm mẫu cũ: **43,75%** (43,75% / 43,75% ở hai đội hình).

- **Hiện tại:** Super đặt một sạp tiếp tế có HP cạnh đồng đội yếu nhất. Trong 6 giây, sạp bắn quả tiếp tế tới đồng đội bị thương mỗi 1,5 giây. Đánh đổi: Thay tám lì xì tỏa hướng; sạp đứng yên, có 25% HP gốc chủ và có thể bị phá.
- **Đề xuất:** Giữ tám lì xì Super gốc. Thêm sạp tiếp tế 15% HP gốc chủ trong 4 giây cạnh đồng đội yếu nhất; mỗi 2 giây bắn một quả hồi 1% HP gốc chủ, trần 15 HP/lần, trong 220.
- **Lợi ích và giới hạn:** Quả mới tự đuổi đúng đồng đội, chỉ hồi HP, không kèm Rage/Blessing/debuff; tối đa một sạp. Sạp đứng yên theo tên cũ, mô tả phải nói rõ.
- **Kiểm chứng riêng:** Đo tám bao gốc vẫn đủ, đạn tiếp tế có tới mục tiêu đang di chuyển, không tạo buff ngoài ngân sách.

<a id="char_20"></a>

### 20. Hoàng Tử Ngậm Hoa

**Bộ gốc theo mô tả:** Hoa hồng dừng khi chạm tường hoặc nhân vật và cắm xuống đất, tạo vùng nhỏ Rage/hồi HP cho đồng đội, Frozen cho địch. Tối đa bốn hoa.

**Super gốc theo mô tả:** Tạo vườn sáu hoa quanh mục tiêu; các vùng trùng không nhân chồng buff hoặc tick Damage.

#### 58. Hồng Leo · mốc 3

ID: `roseLink`. Điểm mẫu cũ: **53,13%** (56,25% / 50% ở hai đội hình).

- **Hiện tại:** Hai hoa thường cách nhau tối đa 80 tạo một dây nối. Đồng đội cắt qua dây nhận khiên 2% HP gốc của Hoàng Tử trong 2 giây. Hồi chung 8 giây mỗi đồng đội. Đánh đổi: Giới hạn hoa thường giảm từ bốn xuống ba; tối đa hai dây. Hoa Super không tạo dây.
- **Đề xuất:** Giữ bốn hoa thường và chức năng gốc. Nối tối đa ba cặp hoa gần nhất trong 100; đồng đội cắt dây nhận khiên 2% HP gốc Hoàng Tử trong 3 giây, hồi 6 giây/người.
- **Lợi ích và giới hạn:** Một nguồn khiên không cộng tầng; không tạo dây từ hoa Super, không thêm hồi khi đi qua nhiều dây.
- **Kiểm chứng riêng:** Đo hồi và khiên thực, kiểm tra bốn hoa còn đủ và số dây không vượt ba.

#### 59. Lưu Hương · mốc 8

ID: `roseFollow`. Điểm mẫu cũ: **50%** (43,75% / 56,25% ở hai đội hình).

- **Hiện tại:** Hoa thường trúng đồng đội đầu tiên bám theo người đó trong 2 giây, tạo vùng Rage và hồi HP nhỏ di động. Giữ tối đa hai hoa bám. Đánh đổi: Các hoa này không cắm ở đất và bỏ Frozen. Hoa Super giữ cách hoạt động gốc.
- **Đề xuất:** Giữ tối đa bốn hoa. Hoa trúng đồng đội đầu tiên bám 2 giây rồi cắm tại vị trí cuối để sống hết thời gian gốc; giữ Rage/hồi và Frozen trên địch trong vùng.
- **Lợi ích và giới hạn:** Tối đa hai hoa đang bám; vùng trùng lấy mạnh nhất; không cộng thời gian sống sau khi rơi.
- **Kiểm chứng riêng:** Đo thời gian buff và hồi khi đồng đội di chuyển, kiểm tra đủ chức năng sau khi hoa rơi.

#### 60. Vườn Che Chở · mốc 15 · Truyền thừa

ID: `roseWall`. Điểm mẫu cũ: **53,13%** (56,25% / 50% ở hai đội hình).

- **Hiện tại:** Mỗi hoa từ Super chặn được một viên đạn địch rồi tan. Không chặn tia, va chạm hoặc sát thương vùng; tối đa sáu lượt chặn mỗi Super. Đánh đổi: Hoa Super không còn gây Frozen. Những hoa chặn đạn bị mất sớm, giảm thời gian hỗ trợ.
- **Đề xuất:** Giữ sáu hoa Super, Frozen và lifetime gốc. Mỗi hoa chặn một viên đạn địch nhưng sau chặn vẫn tồn tại để hỗ trợ; mỗi hoa chỉ chặn một lần.
- **Lợi ích và giới hạn:** Tối đa sáu lượt chặn/Super; không chặn tia/vùng/va chạm; giữ Truyền thừa.
- **Kiểm chứng riêng:** Đo số đạn chặn và hỗ trợ sau chặn; thử đạn xuyên, tia và nhiều đạn cùng tick.

<a id="char_21"></a>

### 21. Độ Duy Môn

**Bộ gốc theo mô tả:** Bắn pháo không khí theo hướng vũ khí, lực đẩy cao và tăng dần cùng Damage.

**Super gốc theo mô tả:** Bắn tám hướng và tự tạo khiên 12% HP tối đa; pháo có lực đẩy mạnh.

#### 61. Pháo Tản · mốc 3

ID: `char_21:pressure`. Điểm mẫu cũ: **21,88%** (18,75% / 25% ở hai đội hình).

- **Hiện tại:** Mỗi lần bắn phóng năm viên khí tỏa quạt, mỗi viên 25% ATK; rất mạnh khi đứng sát, khó gom đủ viên ở xa. Đánh đổi: Nhịp bắn dài hơn 35%; viên ngoài không có proc đòn thường.
- **Đề xuất:** Giữ viên khí chính 100% ATK, lực đẩy và nhịp gốc. Mỗi phát thứ tư thêm bốn viên bên 10% ATK mỗi viên.
- **Lợi ích và giới hạn:** Đạn bên không đẩy/proc; một người nhận tối đa 30% ATK sát thương phụ/loạt. Viên giữa luôn theo hướng ngắm gốc.
- **Kiểm chứng riêng:** Đo sát thương tầm xa không hụt đường giữa, sát thương sát thân và lực đẩy chính.

#### 62. Khí Xuyên · mốc 8

ID: `char_21:resolve`. Điểm mẫu cũ: **43,75%** (50% / 37,5% ở hai đội hình).

- **Hiện tại:** Pháo khí thành một đường đạn lớn xuyên ba địch, mỗi người 110% ATK. Đánh đổi: Nhịp bắn dài hơn 55%; không còn lực đẩy mạnh theo đòn thường gốc.
- **Đề xuất:** Giữ viên khí chính 100% ATK và lực đẩy. Đạn xuyên hai địch phụ, mỗi người phụ 25% ATK và 25% lực đẩy gốc; nhịp gốc.
- **Lợi ích và giới hạn:** Không tăng damage người đầu; tối đa ba mục tiêu, lực đẩy không vượt trần engine.
- **Kiểm chứng riêng:** Đo DPS người đầu và tuyến sau; thử xếp hàng sát tường và vật thể chắn.

#### 63. Vệ Tinh Khí Nén · mốc 15

ID: `char_21:tempo`. Điểm mẫu cũ: **37,5%** (37,5% / 37,5% ở hai đội hình).

- **Hiện tại:** Super tạo ba vệ tinh khí xoay quanh người một giây, sau đó phóng ra đuổi địch, 65% ATK mỗi vệ tinh. Đánh đổi: Không nhận khiên và không bắn tám hướng ngay như Super gốc.
- **Đề xuất:** Giữ tám phát và khiên 12% HP của Super. Thêm ba vệ tinh 10% ATK xoay 0,6 giây rồi đuổi địch.
- **Lợi ích và giới hạn:** Không cấp thêm khiên từ vệ tinh; mỗi vệ tinh trúng một địch một lần, tổng tối đa 30% ATK/người.
- **Kiểm chứng riêng:** Đo khiên hấp thụ, tám phát gốc và vệ tinh riêng, thử triệu hồi sát biên.

<a id="char_22"></a>

### 22. Đẳng Cấp Aura

**Bộ gốc theo mô tả:** Cận chiến và phát aura cho đồng đội khác trong 160; buff Damage cơ sở 12%, hiệu lực và bán kính tăng dần. Nhiều aura cùng loại lấy mạnh nhất.

**Super gốc theo mô tả:** Aura tuôn trào: tất cả đồng đội nhận Rage mạnh, tăng nhịp và Blessing trong 3 giây. Không hồi sinh.

#### 64. Tâm Hào Quang · mốc 3

ID: `auraAnchor`. Điểm mẫu cũ: **46,88%** (37,5% / 56,25% ở hai đội hình).

- **Hiện tại:** Chọn một đồng đội trước trận làm tâm aura thay cho Aura. Buff vẫn biến mất nếu Aura hoặc người làm tâm bị hạ. Đánh đổi: Bán kính aura giảm 25%. Không tạo thêm aura thứ hai.
- **Đề xuất:** Cho chọn đồng đội làm tâm aura phụ bán kính 80% bán kính gốc; đồng thời giữ aura quanh chủ bán kính gốc. Tâm phụ mất thì chỉ tắt phần phụ.
- **Lợi ích và giới hạn:** Hai vùng cùng nguồn không cộng buff; không giảm hiệu lực hay phạm vi quanh chủ. Một tâm phụ, giữ điều kiện chủ còn sống.
- **Kiểm chứng riêng:** Đo thời gian buff của từng đồng đội; kiểm tra hai vùng chồng không tăng gấp đôi Damage.

#### 65. Dư Âm · mốc 8

ID: `auraEcho`. Điểm mẫu cũ: **43,75%** (43,75% / 43,75% ở hai đội hình).

- **Hiện tại:** Buff aura tồn tại thêm 1,5 giây sau khi đồng đội rời vùng. Mỗi người có hồi 6 giây cho lần kéo dài tiếp theo. Đánh đổi: Hiệu lực buff Damage của aura giảm 20%. Buff vẫn tắt nếu nguồn bị hạ.
- **Đề xuất:** Giữ hiệu lực aura 100% gốc. Khi rời vùng, buff lưu thêm 1,5 giây; hồi riêng 6 giây/người cho lần kéo dài mới.
- **Lợi ích và giới hạn:** Không mất 20% buff; nguồn bị hạ thì buff tắt ngay. Ra/vào liên tục không kéo dài vô hạn.
- **Kiểm chứng riêng:** Đo thời gian buff và sát thương đồng đội, thử nguồn chết và ra/vào trong hồi.

#### 66. Dẫn Nhịp · mốc 15 · Truyền thừa

ID: `auraEnergy`. Điểm mẫu cũ: **43,75%** (50% / 37,5% ở hai đội hình).

- **Hiện tại:** Super cấp 12 năng lượng cho mỗi đồng đội khác, tối đa một lần/người trong 8 giây. Không tự nạp; vẫn chịu trần năng lượng của engine. Đánh đổi: Super bỏ Rage và Blessing, giữ phần tăng nhịp gốc. Không tăng trần năng lượng hoặc tạo vòng nạp vô hạn.
- **Đề xuất:** Giữ Rage, Blessing và tăng nhịp Super gốc. Thêm 6 năng lượng cho mỗi đồng đội khác, hồi 8 giây/người.
- **Lợi ích và giới hạn:** Không tự nạp hoặc tràn qua 100; phần năng lượng này không kích hồi năng lượng từ hiệu ứng khác; giữ Truyền thừa.
- **Kiểm chứng riêng:** Đo thời điểm Super tiếp theo của đồng đội và năng lượng thực nhận; kiểm tra đội hai nguồn cấp năng lượng không tạo vòng.

<a id="char_23"></a>

### 23. King Of RiseOn

**Bộ gốc theo mô tả:** Kiếm xoay có 15% lướt qua va chạm vũ khí; không đồng nghĩa bỏ qua giáp/khiên. Tầm kiếm và Damage tăng dần.

**Super gốc theo mô tả:** Kiếm khổng lồ trong 4 giây, chắc chắn bỏ qua va chạm vũ khí; vẫn nhận sát thương từ đòn đánh vào thân.

#### 67. Xung Kiếm · mốc 3

ID: `char_23:pressure`. Điểm mẫu cũ: **43,75%** (31,25% / 56,25% ở hai đội hình).

- **Hiện tại:** Đòn thường trở thành đường đâm thẳng rất dài, xuyên ba mục tiêu, mỗi người 110% ATK. Đánh đổi: Nhịp đánh dài hơn 45%; vùng trúng hẹp và vẫn chịu giáp/khiên.
- **Đề xuất:** Giữ kiếm xoay, tăng trưởng tầm và cơ chế lướt va chạm gốc. Mỗi đòn trúng thứ tư phóng xung kiếm 45% ATK tầm 135, xuyên hai địch.
- **Lợi ích và giới hạn:** Xung phụ không tự bỏ giáp/khiên hoặc proc; không thay kiếm chạm bằng đạn.
- **Kiểm chứng riêng:** Đo sát thương, va chạm kiếm, tăng trưởng và khả năng chạm mục tiêu sau đệ.

#### 68. Kiếm Quét Hai Trục · mốc 8

ID: `char_23:resolve`. Điểm mẫu cũ: **53,13%** (43,75% / 62,5% ở hai đội hình).

- **Hiện tại:** Quét hai trục kiếm vuông góc thay cú chạm, mỗi người chỉ trúng một lần 95% ATK mỗi nhịp. Đánh đổi: Nhịp đánh dài hơn 25%; tối đa ba địch.
- **Đề xuất:** Giữ kiếm gốc. Mỗi đòn trúng thứ tư thêm chữ thập tầm 110, 40% ATK lên tối đa ba địch.
- **Lợi ích và giới hạn:** Một địch trúng tối đa một lần/nhịp phụ; không tự kích thêm lượt lướt va chạm.
- **Kiểm chứng riêng:** Đo DPS và số nhát ở giao điểm hai trục, giữ hành vi kiếm Super.

#### 69. Vương Kiếm Tách Mảnh · mốc 15

ID: `char_23:tempo`. Điểm mẫu cũ: **46,88%** (43,75% / 50% ở hai đội hình).

- **Hiện tại:** Phóng một kiếm lớn 120% ATK. Khi chạm đầu hoặc hết tầm, kiếm vỡ thành bốn mảnh theo hướng tiến, mỗi mảnh 30% đạn mẹ. Đánh đổi: Thay Super kiếm khổng lồ cận chiến; không còn giai đoạn chắc chắn bỏ qua va chạm vũ khí.
- **Đề xuất:** Giữ kiếm khổng lồ 4 giây và bỏ va chạm vũ khí gốc. Khi Super kết thúc, phóng kiếm nhỏ 25% ATK; khi chạm đầu tách bốn mảnh 8% ATK mỗi mảnh.
- **Lợi ích và giới hạn:** Người bị kiếm mẹ trúng không trúng mảnh; không xuyên giáp/khiên. Chỉ một lần tách, không phóng nếu chủ đã chết.
- **Kiểm chứng riêng:** Đo sát thương cửa sổ kiếm gốc và phần kết thúc; kiểm tra chết trước lúc kết thúc và checkpoint đúng thời điểm.

<a id="char_24"></a>

### 24. Thi Thánh Họ Mai

**Bộ gốc theo mô tả:** Bắn nét mực có 10% gắn một debuff ngẫu nhiên hợp lệ. Tỉ lệ và tốc độ bắn tăng dần.

**Super gốc theo mô tả:** Bắn mười hai nét mực tỏa quanh người; mỗi nét có tỉ lệ gắn debuff. Không dùng Hướng Nội và không khóa liên tục.

#### 70. Bút Tam Tài · mốc 3

ID: `char_24:pressure`. Điểm mẫu cũ: **23,44%** (21,88% / 25% ở hai đội hình).

- **Hiện tại:** Mỗi nhịp bắn ba nét mực tỏa quạt, mỗi nét 40% ATK; chỉ nét giữa tính là đòn thường để xét hiệu ứng bộ kỹ năng. Đánh đổi: Nhịp bắn dài hơn 45%; hai nét ngoài không gây thêm debuff ngẫu nhiên.
- **Đề xuất:** Giữ nét mực chính, nhịp và debuff gốc. Mỗi phát thứ tư thêm hai nét bên 20% ATK mỗi nét.
- **Lợi ích và giới hạn:** Chỉ nét chính xét debuff, hai nét phụ không phát thêm trạng thái hoặc chuỗi.
- **Kiểm chứng riêng:** Đo sát thương và số debuff, kiểm tra ba nét cùng trúng không nhân proc.

#### 71. Mực Đuổi Hình · mốc 8

ID: `char_24:resolve`. Điểm mẫu cũ: **48,44%** (43,75% / 53,13% ở hai đội hình).

- **Hiện tại:** Nét mực tự uốn đường bay theo mục tiêu đã chọn, gây 75% ATK khi trúng. Đánh đổi: Nhịp bắn dài hơn 40%; đạn không xuyên, không tự tăng tầm sống và vẫn bị đệ/khiên chặn.
- **Đề xuất:** Giữ sát thương 100% ATK và nhịp bắn gốc; mỗi nét thứ ba được tự đuổi mục tiêu đã chọn, đời đạn tăng tối đa 20%.
- **Lợi ích và giới hạn:** Không xuyên; chỉ một lượt proc debuff trên một viên. Mục tiêu chết thì chọn địch gần nhất trong tầm sống còn lại.
- **Kiểm chứng riêng:** Đo tỷ lệ trúng đối thủ cơ động và debuff; thử mất mục tiêu, đệ/khiên chắn.

#### 72. Bút Trận Tứ Phương · mốc 15

ID: `char_24:tempo`. Điểm mẫu cũ: **45,31%** (46,88% / 43,75% ở hai đội hình).

- **Hiện tại:** Super vẽ bốn nét tỏa theo bốn hướng vuông góc tại người dùng; mỗi nét dài 260, gây 70% ATK. Đánh đổi: Thay mười hai viên mực tỏa; nét cắt không tự gắn debuff ngẫu nhiên.
- **Đề xuất:** Giữ mười hai nét mực Super và proc gốc. Thêm bốn nét vuông góc dài 260, 8% ATK mỗi nét; một nét ưu tiên hướng tới địch gần nhất.
- **Lợi ích và giới hạn:** Một địch chịu tối đa 16% ATK từ các nét phụ; nét phụ không debuff, không nạp Super.
- **Kiểm chứng riêng:** Đo sát thương và debuff gốc, trần sát thương ở giao điểm bốn nét.

<a id="char_25"></a>

### 25. Công Tử Phú Thọ

**Bộ gốc theo mô tả:** Cận chiến, giao dịch định kỳ: lợi nhuận thêm máu ảo theo tài sản, thua lỗ trừ trực tiếp HP thật. Không tự hoàn lại khiên đã bị đánh mất.

**Super gốc theo mô tả:** Trong 4 giây có bốn nhịp giao dịch chắc chắn sinh lời và nhận Rage; máu ảo vẫn có trần.

#### 73. Đồng Xu Xoay · mốc 3

ID: `char_25:pressure`. Điểm mẫu cũ: **12,5%** (12,5% / 12,5% ở hai đội hình).

- **Hiện tại:** Thay đòn thường bằng hai đồng xu bay sát quanh chủ trong 1,5 giây; mỗi xu chỉ trúng mỗi địch một lần, 55% ATK. Đánh đổi: Nhịp gọi dài gấp đôi, tối đa hai xu cùng lúc; không còn đòn chạm trong thời gian đó.
- **Đề xuất:** Giữ đòn chạm và giao dịch gốc. Mỗi 3 giây tạo hai xu xoay bán kính 65 trong 1,5 giây, mỗi xu gây 20% ATK/địch một lần.
- **Lợi ích và giới hạn:** Xu không chặn đánh thường, không proc/giao dịch hoặc bắn dồn; tối đa hai xu phụ/chủ.
- **Kiểm chứng riêng:** Đo DPS và tần suất giao dịch, thử địch sát thân và đứng ngoài quỹ đạo.

#### 74. Búng Tiền · mốc 8

ID: `char_25:resolve`. Điểm mẫu cũ: **59,38%** (81,25% / 37,5% ở hai đội hình).

- **Hiện tại:** Búng một đồng xu thành cú đánh thẳng tầm 170, có thể xuyên ba địch, mỗi người 100% ATK. Đánh đổi: Nhịp đánh dài hơn 50%; vùng trúng hẹp, không thay đổi rủi ro giao dịch.
- **Đề xuất:** Giữ đòn chạm. Mỗi đòn trúng thứ tư búng xu tầm 170, 45% ATK, xuyên tối đa hai địch.
- **Lợi ích và giới hạn:** Không thay toàn bộ cận chiến; không thay rủi ro giao dịch, không sinh tài sản từ xu phụ.
- **Kiểm chứng riêng:** Đo sát thương ở các khoảng cách, kiểm tra tài sản/HP mất do thua lỗ không đổi luật.

#### 75. Quỹ Đầu Tư Tiền Tuyến · mốc 15

ID: `char_25:tempo`. Điểm mẫu cũ: **53,13%** (56,25% / 50% ở hai đội hình).

- **Hiện tại:** Super dựng quỹ có HP trong 6 giây, mỗi 1,5 giây bắn ba đồng xu về hướng địch, mỗi xu 22% ATK gốc. Đánh đổi: Không còn bốn giao dịch chắc chắn lãi và Rage từ Super gốc. Quỹ có 40% HP gốc chủ.
- **Đề xuất:** Giữ bốn giao dịch chắc lãi và Rage Super. Thêm quỹ có 15% HP gốc chủ trong 4 giây; mỗi 1,5 giây bắn ba xu 5% ATK gốc/viên.
- **Lợi ích và giới hạn:** Một người nhận tối đa 30% ATK gốc từ quỹ/Super; quỹ không tự giao dịch hoặc tạo máu ảo cho chủ.
- **Kiểm chứng riêng:** Đo số giao dịch gốc, khiên tài sản, sát thương quỹ riêng; thử quỹ bị phá sớm.

<a id="char_26"></a>

### 26. Anh Fam De Phonk

**Bộ gốc theo mô tả:** Cận chiến, nhẹ nhàng bẻ hướng về địch gần nhất, đòn trúng tạo luồng gió đẩy lùi.

**Super gốc theo mô tả:** Đặt lốc lớn trong 4 giây: kéo địch về tâm và gây sát thương mỗi giây; lực hút có trần.

#### 76. Lưỡi Bass · mốc 3

ID: `char_26:pressure`. Điểm mẫu cũ: **68,75%** (75% / 62,5% ở hai đội hình).

- **Hiện tại:** Phóng lưỡi gió lượn ngang theo đường tiến, xuyên hai mục tiêu, mỗi người 80% ATK. Đánh đổi: Nhịp đánh dài hơn 35%; thay cú đánh chạm đẩy lùi.
- **Đề xuất:** Giữ đòn chạm, bẻ hướng và đẩy gốc. Mỗi đòn trúng thứ tư thêm lưỡi Bass 40% ATK tầm 200, xuyên hai địch.
- **Lợi ích và giới hạn:** Sóng không đẩy/proc; giới hạn biên độ lượn 10 để không bỏ trống hoàn toàn đường giữa.
- **Kiểm chứng riêng:** Đo sát thương sau đẩy và tỷ lệ sóng trúng, kiểm tra chuyển động bẻ hướng gốc.

#### 77. Vòng Xoáy Đổi Beat · mốc 8

ID: `char_26:resolve`. Điểm mẫu cũ: **68,75%** (75% / 62,5% ở hai đội hình).

- **Hiện tại:** Đòn thường thành một vòng quét bán kính 75 quanh người, tối đa ba địch, mỗi người 70% ATK. Đánh đổi: Nhịp đánh dài hơn 75%; không tạo thêm đòn khi chỉ đi sát đối thủ.
- **Đề xuất:** Giữ đòn gốc. Mỗi đòn trúng thứ tư thêm vòng quét bán kính 75, 35% ATK lên tối đa ba địch; địch phụ nhận đẩy lực 100.
- **Lợi ích và giới hạn:** Mục tiêu chính không nhận thêm lượt đẩy từ vòng. Không nhân đẩy theo ba địch hoặc bỏ qua trần impulse.
- **Kiểm chứng riêng:** Đo sát thương, vị trí và tổng lực đẩy, thử sát tường và nhiều địch cùng vòng.

#### 78. Hai Mắt Bão · mốc 15

ID: `char_26:tempo`. Điểm mẫu cũ: **40,63%** (43,75% / 37,5% ở hai đội hình).

- **Hiện tại:** Super đặt hai tâm lốc ở hai bên mục tiêu, mỗi tâm bán kính 95, kéo địch và gây 20% ATK mỗi giây trong 3 giây. Đánh đổi: Thay một lốc lớn 160; khoảng giữa hai tâm có thể bị vượt qua, vùng trùng không nhân nhịp sát thương.
- **Đề xuất:** Giữ lốc gốc bán kính 160 trong 4 giây. Thêm hai mắt bão bán kính 45 ở hai bên, lệch tâm 160, 3 giây, 8% ATK/giây, hút bằng 25% lực lốc chính.
- **Lợi ích và giới hạn:** Cùng người trong nhiều vùng lấy nhịp và sát thương mạnh nhất; tổng lực hút vẫn chịu trần, không cộng ba lực đầy đủ.
- **Kiểm chứng riêng:** Đo vùng phủ và thời gian kiểm soát; so sát thương ở tâm không thấp hơn gốc, kiểm tra vùng chồng.

<a id="char_27"></a>

### 27. Robot Da Đỏ

**Bộ gốc theo mô tả:** Mỗi đòn trúng đều gây Burn nhẹ; 20% thiêu đốt mạnh hơn. Tăng trưởng nâng tỉ lệ đốt mạnh, không cộng tầng Burn.

**Super gốc theo mô tả:** Cháy bỏng 4 giây: tăng Damage, di chuyển và nhịp đánh, đồng thời tự chịu Burn.

#### 79. Hỏa Tiễn Tay · mốc 3

ID: `char_27:pressure`. Điểm mẫu cũ: **53,13%** (68,75% / 37,5% ở hai đội hình).

- **Hiện tại:** Thay đòn chạm bằng luồng nhiệt thẳng tầm 150, xuyên tối đa ba địch, mỗi người 100% ATK; giữ xét Burn ở cú trúng chính. Đánh đổi: Nhịp đánh dài hơn 50%; không đánh được mục tiêu ngoài đường nhiệt.
- **Đề xuất:** Giữ đòn chạm và Burn gốc. Mỗi đòn trúng thứ tư thêm luồng nhiệt 40% ATK tầm 150, xuyên hai địch.
- **Lợi ích và giới hạn:** Luồng phụ không Burn thêm hoặc tăng số lần xét đốt mạnh; nhịp nền giữ nguyên.
- **Kiểm chứng riêng:** Đo Damage/Burn riêng và tăng trưởng tỷ lệ đốt mạnh.

#### 80. Dao Nhiệt Hồi Lưu · mốc 8

ID: `char_27:resolve`. Điểm mẫu cũ: **40,63%** (31,25% / 50% ở hai đội hình).

- **Hiện tại:** Ném dao nhiệt đi rồi trở về, mỗi chiều gây 60% ATK và có thể trúng lại người đã trúng lúc đi. Đánh đổi: Chỉ một dao đang bay, không đánh chạm trong lúc chờ dao về.
- **Đề xuất:** Giữ đòn chạm. Mỗi đòn trúng thứ năm thêm dao nhiệt hồi lưu tầm 180, 40% ATK mỗi chiều, hai địch/chiều.
- **Lợi ích và giới hạn:** Không dừng cận chiến, không tạo Burn/proc từ dao phụ; một dao đang bay.
- **Kiểm chứng riêng:** Đo sát thương và uptime Burn, kiểm tra lượt về không thêm một lần đốt mạnh.

#### 81. Lò Nung Vệ Tinh · mốc 15

ID: `char_27:tempo`. Điểm mẫu cũ: **75%** (87,5% / 62,5% ở hai đội hình).

- **Hiện tại:** Super tạo ba lõi nhiệt xoay quanh người một giây rồi phóng ra đuổi địch, mỗi lõi 65% ATK. Đánh đổi: Không có phần tăng sát thương/di chuyển/nhịp đánh của Super gốc; cũng không tự Burn từ Super này.
- **Đề xuất:** Giữ buff Damage/di chuyển/nhịp đánh và tự Burn của Super. Thêm ba lõi nhiệt 10% ATK, xoay 1 giây rồi đuổi địch.
- **Lợi ích và giới hạn:** Mỗi lõi chỉ trúng một địch, không Burn thêm; tổng 30% ATK/người. Không cộng nguyên ba lõi 65% hiện có vào buff gốc.
- **Kiểm chứng riêng:** Đo sát thương tổng, tốc độ và HP mất do tự Burn; kiểm tra hệ số Super chỉ tính một lần.

<a id="char_28"></a>

### 28. Người Máy Sịp Đỏ Phế Thải

**Bộ gốc theo mô tả:** Đánh cận chiến, có 15% tự mất HP bằng 20% Damage cơ sở. Tỉ lệ tự đánh giảm dần, không kích hoạt chuỗi proc.

**Super gốc theo mô tả:** Bắn laser đỏ thẳng trong 300, gây 200% Damage; tự chịu Burn trong 3 giây.

#### 82. Nắm Đấm Phóng · mốc 3

ID: `char_28:pressure`. Điểm mẫu cũ: **50%** (31,25% / 68,75% ở hai đội hình).

- **Hiện tại:** Mỗi nhịp lao ngắn theo hướng vũ khí, đồng thời phóng một nắm đấm rộng gây 120% ATK khi chạm. Đánh đổi: Nhịp đánh dài hơn 70%; không tự né và vẫn bị tường chặn.
- **Đề xuất:** Giữ đòn thường và rủi ro tự đánh gốc. Mỗi 4 giây phóng nắm đấm phụ 50% ATK tầm 145; chỉ lao ngắn khi mục tiêu ngoài tầm chạm.
- **Lợi ích và giới hạn:** Nắm đấm phụ không xét tự đánh lần nữa. Lao 0,25 giây, không miễn sát thương hoặc xuyên tường.
- **Kiểm chứng riêng:** Đo DPS, thời gian tiếp cận, số lần tự đánh trên cùng số đòn nền.

#### 83. Đĩa Cưa Tái Chế · mốc 8

ID: `char_28:resolve`. Điểm mẫu cũ: **57,81%** (56,25% / 59,38% ở hai đội hình).

- **Hiện tại:** Ném một đĩa cưa đi rồi trở về chủ; xuyên hai người, 65% ATK mỗi chiều. Đánh đổi: Không đánh chạm trong lúc đĩa chưa về. Rủi ro tự đánh của dạng cơ bản vẫn xét trên các cú trúng chính.
- **Đề xuất:** Giữ cận chiến. Mỗi đòn trúng thứ năm thêm đĩa cưa hồi lưu tầm 190, 40% ATK mỗi chiều.
- **Lợi ích và giới hạn:** Đĩa phụ không khóa cận chiến, không tăng số lần xét tự đánh; tối đa một đĩa, hai địch/chiều.
- **Kiểm chứng riêng:** Đo sát thương và HP tự mất, thử cả dạng cơ bản và khi gắn item_28.

#### 84. Laser Tách Tia · mốc 15

ID: `char_28:tempo`. Điểm mẫu cũ: **40,63%** (50% / 31,25% ở hai đội hình).

- **Hiện tại:** Super bắn ba tia laser hẹp tỏa quạt, mỗi tia dài 260 và gây 100% ATK cho người trên tia. Đánh đổi: Thay tia laser lớn; mỗi tia yếu hơn và không có phần tự Burn từ Super cơ bản.
- **Đề xuất:** Thay hình tia Super bằng tia giữa 210% ATK, dài 300, rộng bằng tia gốc, kèm hai tia bên 15% ATK dài 260. Giữ tự Burn như Super gốc.
- **Lợi ích và giới hạn:** Địch trúng nhiều tia nhận tối đa 230% ATK/Super; đây là một lần Super, không proc hoặc nhân hệ số ba lần.
- **Kiểm chứng riêng:** Đo mục tiêu giữa, bên và giao tia; kiểm tra dạng item_28 và HP tự Burn.

<a id="char_29"></a>

### 29. Wacom Hỏng Hóc

**Bộ gốc theo mô tả:** Đạn thường chỉ gây 55% Damage, đồng đội trên đường đạn vẫn chịu 35% sát thương đạn. Sát thương đồng đội giảm dần theo tăng trưởng.

**Super gốc theo mô tả:** Bắn chuỗi tám phát, mỗi phát có 12% bật ngược về bản thân; không bắn xuyên mọi mục tiêu.

#### 85. Điểm Ảnh Tách · mốc 3

ID: `char_29:pressure`. Điểm mẫu cũ: **31,25%** (31,25% / 31,25% ở hai đội hình).

- **Hiện tại:** Viên đạn chính 40% ATK tách ba điểm ảnh 30% sát thương đạn mẹ khi va chạm đầu hoặc hết tầm. Đánh đổi: Nhịp bắn dài hơn 35%; chỉ viên chính giữ luật trúng đồng đội của dạng cơ bản. Mảnh con không có proc hoặc tách tiếp.
- **Đề xuất:** Giữ đạn chính 55% ATK, nhịp và luật friendly fire gốc. Mỗi viên thứ tư tách ba điểm ảnh 10% ATK sau va chạm đầu/hết tầm.
- **Lợi ích và giới hạn:** Điểm ảnh không trúng lại người vừa kích tách, không gây hại đồng đội/chủ, không tách tiếp hoặc proc.
- **Kiểm chứng riêng:** Đo sát thương địch và friendly fire, thử dạng item_29 có xuyên/nảy riêng.

#### 86. Đạn Gập Gương · mốc 8

ID: `char_29:resolve`. Điểm mẫu cũ: **40,63%** (43,75% / 37,5% ở hai đội hình).

- **Hiện tại:** Đạn thường nảy tường hai lần rồi tiếp tục bay, mỗi lần trúng gây 65% ATK. Đánh đổi: Nhịp bắn dài hơn 45%; giữ rủi ro trúng đồng đội ở dạng cơ bản và không tăng số lần nảy theo tăng trưởng.
- **Đề xuất:** Giữ đạn chính 55% ATK và nhịp gốc; mỗi viên thứ ba được thêm hai lần nảy tường. Người đã trúng có thể trúng lại sau nảy, hồi 0,4 giây/người.
- **Lợi ích và giới hạn:** Sau nảy, sát thương địch bằng 50% đạn ban đầu; sát thương đồng đội không được nhân thêm, vẫn theo hệ số rủi ro tăng trưởng.
- **Kiểm chứng riêng:** Đo sát thương từ lần nảy và friendly fire; xác nhận cùng người không bị hit hai lần trong 0,4 giây.

#### 87. Ống Kính Quét · mốc 15

ID: `char_29:tempo`. Điểm mẫu cũ: **25%** (31,25% / 18,75% ở hai đội hình).

- **Hiện tại:** Thay chuỗi tám phát bằng ba tia hẹp tỏa quạt, dài 260, mỗi tia 65% ATK. Đánh đổi: Không có tám phát hoặc phản đạn vào chủ; tổng sát thương tập trung thấp hơn chuỗi gốc.
- **Đề xuất:** Thay chuỗi tám phát bằng một lần quét: tia giữa 340% ATK, dài 300, hai tia bên 20% ATK, dài 260; không phản vào chủ hoặc đánh đồng đội.
- **Lợi ích và giới hạn:** Một địch nhận tối đa 360% ATK. Super gốc có tám phát 40% ATK ở dạng cơ bản; dạng item_29 phải có cấu hình riêng tối thiểu bằng tổng chuỗi gốc cùng dạng ×1,05 trước khi xét độ rộng.
- **Kiểm chứng riêng:** So sát thương mục tiêu giữa/di động, HP tự mất và thời gian gây sát thương; kiểm tra cả hai dạng vũ khí, tránh nhân hệ số Super.

<a id="char_30"></a>

### 30. Chó Bóng Bay

**Bộ gốc theo mô tả:** Thả bóng bay nổ sau 3 giây hoặc khi nhân vật chạm vào sau lúc lên ngòi. Vụ nổ gây sát thương cả chủ và đồng đội, tăng rủi ro theo thời gian.

**Super gốc theo mô tả:** Thả tám bóng lớn; vụ nổ vẫn gây sát thương chủ/đồng đội. Mỗi chủ có giới hạn số bóng đang hoạt động.

#### 88. Bóng Chùm · mốc 3

ID: `char_30:pressure`. Điểm mẫu cũ: **28,13%** (18,75% / 37,5% ở hai đội hình).

- **Hiện tại:** Bóng thường nổ 60% ATK rồi tách ba mảnh bay theo ba hướng, mỗi mảnh bằng 30% sát thương bóng mẹ. Đánh đổi: Nhịp thả dài hơn 40%; vụ nổ mẹ vẫn có rủi ro trúng chủ/đồng đội ở dạng cơ bản, mảnh con không tách tiếp.
- **Đề xuất:** Giữ bóng mẹ và nhịp gốc. Mỗi bóng thứ tư khi nổ sinh ba mảnh 15% ATK hướng về ba làn; giảm 10% sát thương bóng mẹ gây cho chủ/đồng đội so với gốc.
- **Lợi ích và giới hạn:** Mảnh không gây friendly fire hoặc nổ/tách tiếp; không trúng lại mục tiêu chính của vụ nổ mẹ. Rủi ro nền vẫn tăng trưởng theo luật gốc.
- **Kiểm chứng riêng:** Đo sát thương địch, tự hại và friendly fire; kiểm tra nổ do hết giờ, chạm địch, chạm chủ và item_30.

#### 89. Bóng Neo · mốc 8

ID: `char_30:resolve`. Điểm mẫu cũ: **43,75%** (37,5% / 50% ở hai đội hình).

- **Hiện tại:** Bóng thường bay 80 đơn vị rồi neo đứng yên, lên ngòi sau 0,6 giây; chạm người hoặc hết 3 giây nổ bán kính 55, 80% ATK. Đánh đổi: Nhịp thả dài hơn 50%; dạng cơ bản vẫn có nguy cơ nổ trúng chủ và đồng đội.
- **Đề xuất:** Giữ bóng bay gốc. Mỗi lần thả thứ tư tạo thêm một bóng neo ở hướng mục tiêu cách 80, lên ngòi 0,6 giây, tồn tại 3 giây, bán kính 55, 45% ATK.
- **Lợi ích và giới hạn:** Bóng neo phụ chỉ hại địch, không thay bóng chính; tối đa hai bóng neo phụ/chủ, vẫn chịu trần vật thể.
- **Kiểm chứng riêng:** Đo sát thương và tỷ lệ mìn được kích; xác nhận đòn nền không bị giới hạn phụ chiếm hết chỗ.

#### 90. Đoàn Bóng Hộ Tống · mốc 15

ID: `char_30:tempo`. Điểm mẫu cũ: **43,75%** (25% / 62,5% ở hai đội hình).

- **Hiện tại:** Super tạo năm bóng quay quanh người một giây, rồi tự phóng theo địch. Mỗi bóng gây 65% ATK khi trúng. Đánh đổi: Thay loạt bóng gốc; không nổ toàn vùng và không gây sát thương đồng đội/chủ từ năm bóng này.
- **Đề xuất:** Thay loạt bóng Super bằng tám bóng hộ tống, mỗi bóng giữ hệ số sát thương địch của bóng Super gốc; xoay 0,5 giây rồi đuổi địch, không gây sát thương chủ/đồng đội.
- **Lợi ích và giới hạn:** Mỗi bóng chỉ trúng một người, không nổ toàn vùng; cùng địch nhận tối đa ba bóng/Super, phân phối lại mục tiêu khi đã đủ ba.
- **Kiểm chứng riêng:** So tổng sát thương địch và HP đội giữ được trước đội tụ/cơ động, 1v1 và item_30; không coi bỏ tự hại tự động bù đủ mất AoE.

<a id="char_31"></a>

### 31. Ủn Đại Ca

**Bộ gốc theo mô tả:** Bắn tên lửa mini, 20% gây Phóng xạ; tối đa 3 tầng, gây DoT và giảm hồi phục tối đa 24%.

**Super gốc theo mô tả:** Tên lửa khổng lồ nổ toàn bản đồ: trong 130 gây 190% Damage, ngoài tâm gây 50%; mọi người trúng Phóng xạ/Burn. Chủ và đồng đội nhận 50% Damage tương ứng.

#### 91. Rocket Chia Đầu · mốc 3

ID: `char_31:pressure`. Điểm mẫu cũ: **34,38%** (37,5% / 31,25% ở hai đội hình).

- **Hiện tại:** Rocket 65% ATK vỡ thành ba mảnh 30% sát thương mẹ theo ba hướng khi va chạm đầu hoặc hết tầm. Đánh đổi: Nhịp bắn dài hơn 30%; chỉ đầu chính xét Phóng xạ, mảnh con không có proc.
- **Đề xuất:** Giữ rocket 100% ATK, nhịp và proc Phóng xạ gốc. Mỗi rocket thứ tư tách ba đầu phụ 15% ATK tại lần trúng đầu/hết tầm.
- **Lợi ích và giới hạn:** Đầu phụ không trúng lại người kích tách, không Phóng xạ, không tách tiếp; rocket mẹ giữ nguyên phần trúng gốc.
- **Kiểm chứng riêng:** Đo sát thương và số tầng Phóng xạ, thử vật thể chắn và hết tầm.

#### 92. Tên Lửa Truy Đuổi · mốc 8

ID: `char_31:resolve`. Điểm mẫu cũ: **56,25%** (56,25% / 56,25% ở hai đội hình).

- **Hiện tại:** Tên lửa thường uốn đường bay theo mục tiêu đã chọn, gây 80% ATK. Đánh đổi: Nhịp bắn dài hơn 40%; không xuyên, không tăng tầm sống và vẫn bị vật thể chặn.
- **Đề xuất:** Giữ sát thương 100% ATK, nhịp và proc gốc; mỗi rocket thứ ba tự đuổi mục tiêu đã chọn, thời gian sống tăng tối đa 20%.
- **Lợi ích và giới hạn:** Không xuyên, không nổ AoE mới hoặc thêm lần proc; khi mục tiêu chết chỉ tìm địch trong tầm đời đạn còn lại.
- **Kiểm chứng riêng:** Đo tỷ lệ trúng đội cơ động và DoT; thử khiên/đệ chắn, mất mục tiêu.

#### 93. Trận Địa Pháo · mốc 15

ID: `char_31:tempo`. Điểm mẫu cũ: **37,5%** (37,5% / 37,5% ở hai đội hình).

- **Hiện tại:** Thay tên lửa toàn bản đồ bằng ba ụ pháo có HP, mỗi 1,5 giây bắn một đạn nổ bán kính 55 với 30% ATK gốc. Tồn tại 4 giây. Đánh đổi: Không còn vụ nổ/Phóng xạ toàn bản đồ. Mỗi ụ có 18% HP gốc chủ, đạn ụ không gây hại đồng đội.
- **Đề xuất:** Giữ tên lửa Super gốc, giảm 20% sát thương nó gây cho chủ/đồng đội so với gốc. Thêm hai ụ pháo 12% HP gốc chủ trong 3 giây, mỗi 1,5 giây bắn đạn nổ 10% ATK gốc, bán kính 55.
- **Lợi ích và giới hạn:** Ụ không Phóng xạ/Burn hoặc friendly fire; tối đa 40% ATK gốc/người từ hai ụ/Super; không dùng nguyên ba ụ cũ kèm tên lửa.
- **Kiểm chứng riêng:** Đo sát thương toàn bản đồ gốc, tự hại và damage ụ riêng; giới hạn bắn ở tick cuối lifetime.

<a id="char_32"></a>

### 32. Bang Chủ Cái Bang

**Bộ gốc theo mô tả:** Dép tổ ong chạm tường hoặc địch để lại vùng Frozen và Damage mỗi giây; tối đa ba vùng thường.

**Super gốc theo mô tả:** Đặt đại trận bán kính 175, báo trước 0,5 giây, tồn tại 4 giây; Frozen và Damage mỗi giây. Mỗi chủ giữ một đại trận.

#### 94. Dép Hồi Lưu · mốc 3

ID: `char_32:pressure`. Điểm mẫu cũ: **21,88%** (21,88% / 21,88% ở hai đội hình).

- **Hiện tại:** Dép bay ra rồi quay về chủ, gây 65% ATK mỗi chiều và xuyên hai người. Đánh đổi: Nhịp ném dài hơn 55%; không để lại vùng Frozen khi chạm, chỉ một dép hồi lưu đang bay.
- **Đề xuất:** Giữ dép gốc và vùng Frozen. Mỗi phát thứ năm thêm dép hồi lưu 35% ATK mỗi chiều, xuyên hai địch/chiều.
- **Lợi ích và giới hạn:** Dép phụ để tối đa một vùng Frozen gốc khi lần đầu trúng địch, dùng chung trần ba vùng và không xóa vùng còn sống chỉ để đặt lại; không khóa ném thường.
- **Kiểm chứng riêng:** Đo Damage/uptime Frozen, kiểm tra vùng thêm không làm mất vùng gốc hiệu quả hơn.

#### 95. Đôi Dép So Le · mốc 8

ID: `char_32:resolve`. Điểm mẫu cũ: **21,88%** (6,25% / 37,5% ở hai đội hình).

- **Hiện tại:** Ném đồng thời hai dép theo hai hướng lệch nhau; mỗi dép gây 45% ATK và để vùng theo bộ kỹ năng gốc. Đánh đổi: Nhịp ném dài hơn 50%; hai dép có thể cùng trượt người ở đường giữa và vẫn dùng chung giới hạn vùng.
- **Đề xuất:** Giữ dép chính theo đường giữa và nhịp gốc. Mỗi phát thứ tư thêm một dép phụ lệch 11,25 độ luân phiên trái/phải, 35% ATK.
- **Lợi ích và giới hạn:** Dép phụ có thể tạo vùng theo luật gốc, dùng chung trần ba vùng; khi đã đủ vùng, bỏ tạo vùng phụ. Chỉ dép chính proc.
- **Kiểm chứng riêng:** Đo hit đường giữa, Damage và thời gian Frozen; kiểm tra luân phiên hướng qua checkpoint.

#### 96. Tam Giác Dép · mốc 15

ID: `char_32:tempo`. Điểm mẫu cũ: **37,5%** (37,5% / 37,5% ở hai đội hình).

- **Hiện tại:** Super đặt ba trận dép nhỏ bán kính 70 quanh mục tiêu theo hình tam giác, báo trước lệch nhịp, tồn tại 3 giây và gây 22% ATK mỗi giây. Đánh đổi: Thay một đại trận bán kính 175; có khe tránh giữa các trận nhỏ, không nhân nhịp khi vùng trùng.
- **Đề xuất:** Giữ đại trận gốc bán kính 175 và 4 giây. Thêm ba góc dép bán kính 35, tâm ở rìa đại trận thành tam giác, 3 giây, 8% ATK/giây và Frozen gốc.
- **Lợi ích và giới hạn:** Báo trước 0,5 giây; vùng trùng lấy sát thương/khống chế mạnh nhất theo nguồn, không cộng tick.
- **Kiểm chứng riêng:** Đo vùng phủ thật và thời gian khống chế, giữ damage tại tâm bằng gốc.

<a id="char_33"></a>

### 33. Sóc Jake

**Bộ gốc theo mô tả:** Cầm dĩa và đùi gà, phía đùi gà gây 35% Damage; đòn trúng có 25% ném gà boomerang, khi quay lại hồi HP cho chủ. Hồi ném 2,5 giây.

**Super gốc theo mô tả:** Ném đùi gà khổng lồ xuyên mục tiêu: đồng đội chạm hồi ít HP, địch nhận Damage; quay lại hồi HP chủ.

#### 97. Dĩa Bay Xuyên Tuyến · mốc 3

ID: `char_33:pressure`. Điểm mẫu cũ: **48,44%** (40,63% / 56,25% ở hai đội hình).

- **Hiện tại:** Thay đòn chạm bằng mũi dĩa bay thẳng tầm 170, xuyên ba người, mỗi người 95% ATK. Đánh đổi: Nhịp đánh dài hơn 45%; đường bay hẹp và không còn hai mặt vũ khí đánh riêng.
- **Đề xuất:** Giữ cả dĩa/đùi gà và proc ném gà gốc. Mỗi đòn trúng thứ tư phóng dĩa 40% ATK, tầm 170, xuyên hai địch.
- **Lợi ích và giới hạn:** Hai phía vũ khí dùng chung một bộ đếm; dĩa phụ không đếm chuỗi hoặc kích thêm gà.
- **Kiểm chứng riêng:** Đo damage hai phía, tần suất gà và sát thương dĩa riêng; kiểm tra khác biệt mô tả/engine về hệ số đùi gà.

#### 98. Đùi Gà Quét Vòng · mốc 8

ID: `char_33:resolve`. Điểm mẫu cũ: **56,25%** (50% / 62,5% ở hai đội hình).

- **Hiện tại:** Quét đùi gà thành vòng tròn bán kính 85, tối đa ba địch, mỗi người 80% ATK. Đánh đổi: Nhịp đánh dài hơn 50%; không thể đánh riêng hai phía để tăng số lần trúng.
- **Đề xuất:** Giữ hai phía vũ khí. Mỗi đòn trúng thứ tư thêm vòng quét đùi gà bán kính 85, 40% ATK, tối đa ba địch.
- **Lợi ích và giới hạn:** Vòng phụ không kích gà/proc; mỗi địch một hit/vòng, không mất phía dĩa.
- **Kiểm chứng riêng:** Đo đơn/đa mục tiêu và số boomerang gốc, tránh hai mặt vũ khí làm tăng đôi bộ đếm.

#### 99. Tiệc Nướng Trên Không · mốc 15

ID: `char_33:tempo`. Điểm mẫu cũ: **18,75%** (6,25% / 31,25% ở hai đội hình).

- **Hiện tại:** Super ném ba đùi gà theo ba hướng; mỗi đùi quay về sau 0,8 giây, có thể trúng mỗi người một lần mỗi chiều. Chủ bắt lại mỗi đùi hồi 1% HP gốc, tối đa 20 HP. Đánh đổi: Thay một đùi khổng lồ 125%; mỗi đùi nhỏ yếu hơn và tổng hồi chủ tối đa 3% HP gốc trước giảm hồi.
- **Đề xuất:** Thay đùi Super đơn bằng một đùi giữa giữ 125% ATK mỗi chiều, bán kính và hồi HP gốc; thêm hai đùi bên 15% ATK mỗi chiều, không hồi HP riêng.
- **Lợi ích và giới hạn:** Cả ba có thể tồn tại đồng thời, tách chỗ cho ba đùi Super khỏi hai đạn gà thường nhưng vẫn chịu trần chung. Mỗi địch nhận tối đa 40% ATK phụ từ hai đùi bên/Super; buff hồi đồng đội của đùi giữa giữ nguyên.
- **Kiểm chứng riêng:** Kiểm tra phát đủ ba đùi khi đang có hai gà thường; đo damage/hồi gốc, trần sát thương phụ và bắt đủ đùi.

## Điều kiện nghiệm thu sau khi duyệt

1. **Đủ 99/99:** mỗi nhánh có kiểm thử cơ chế và kết quả so bộ gốc riêng; không dùng trung bình cả bộ để che nhánh làm yếu nhân vật. Chỉ gắn trạng thái “đạt” sau thực nghiệm.
2. **Bộ thử cơ chế có đối chứng:** cố định mục tiêu/HP/vị trí khi cần đo đóng góp; thử điều kiện có/không xuất hiện, bị đệ/khiên chặn, chủ chết, hết lifetime, đầy trần vật thể, hai mặt vũ khí, vùng chồng và mục tiêu đổi/đã chết. Phân tách sát thương nền/phụ, hồi thực, hấp thụ khiên, thời gian khống chế/hỗ trợ và friendly fire.
3. **Mô phỏng nhiều cấu hình:** cùng seed, vị trí và hai bên để đối chiếu bộ gốc với nhánh mới; tối thiểu bốn kiểu đối thủ (cận chiến, xạ thủ cơ động, chống chịu/hồi phục, khống chế), hai đội đồng minh phù hợp vai trò; Lv.1/10/20 hoặc mức tối đa được game cho phép, trang bị trống và trang bị phù hợp. Thử 1v1 với nhánh có ý nghĩa trong 1v1; 3v3 cho mọi nhánh; kiểm tra giảm hồi trong viễn chinh và boss.
4. **Seed độc lập để xác nhận:** bắt đầu ít nhất 32 seed/cấu hình ưu tiên, mỗi seed đổi bên; tăng mẫu nếu kết quả còn bất định. Tách seed chỉnh thông số khỏi seed xác nhận. Báo khoảng tin cậy theo cụm seed, không coi các lượt dùng chung seed là độc lập. Số mẫu không tự bảo đảm đạt.
5. **Lợi ích ròng:** nhánh tấn công cần chứng minh tăng sát thương hữu dụng trong vai trò mục tiêu; nhánh hỗ trợ cần chứng minh tăng hiệu quả hữu dụng và không làm đội tệ đi do mất công dụng nền. Đặt biên không suy giảm kết quả đội tối đa 3 điểm phần trăm trên nhóm cấu hình đại diện; nếu chưa đủ độ chắc để kết luận thì ghi “chưa đủ dữ liệu”, không coi là đạt. Mức +10–20%/+15–25% là đích điều chỉnh, không bắt mọi kèo đều tăng đúng tỷ lệ.
6. **Kèo không thuận lợi:** nhánh tình huống phải giữ được năng lực nền khi không gặp điều kiện kích hoạt; thêm đạn/đệ không được vô tình chặn đồng đội, thay đổi hình học làm mất sát thương nhiều hơn phần lợi. Nếu có suy giảm lặp lại, sửa hành vi rồi mới tăng chỉ số.
7. **Chống vượt ngân sách:** kiểm tra đội có ba Bí kỹ cùng hoạt động, ghép trang bị/cộng hưởng, trận dài 30/60/120 giây, ép góc, spam đạn và chuỗi năng lượng. Nhánh có lợi ích quá lớn so với hai lựa chọn còn lại phải cân lại hệ số phụ, không phạt bộ gốc vô điều kiện.
8. **Tương thích và giao diện:** giữ ID/tiến độ/cấu hình đang lắp; giữ giới hạn Truyền thừa. Đổi phiên bản engine khi đổi luật; checkpoint/replay cùng phiên bản phải xác định. Cập nhật mô tả, VFX và sân thử theo đúng luật mới; thêm chỉ số so bộ gốc để người chơi thấy lợi ích thực.

## Phạm vi bạn có thể duyệt

Có thể duyệt toàn bộ định hướng, duyệt từng nhân vật bằng số 1–33, hoặc từng Bí kỹ bằng số 01–99. Việc duyệt bản này cho phép triển khai thiết kế và kiểm thử; con số cần điều chỉnh nếu không đạt các tiêu chí trên phải được ghi lại rõ ràng. Đây chưa phải xác nhận bản mới đã cân bằng hoặc lệnh phát hành production.

Dữ liệu cấu trúc: [proposal-99.json](../reports/mastery-review/proposal-99.json). Báo cáo trước thay đổi: [baseline.json](../reports/mastery-review/baseline.json). Công cụ tạo tài liệu: [build-proposal.ts](../reports/mastery-review/build-proposal.ts).
