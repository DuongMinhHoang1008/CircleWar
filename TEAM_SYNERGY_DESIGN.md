# Circle Chaos — Class, race, vũ khí, tier và liên kết đội

**Bản mở rộng để duyệt · v0.2 · 18/10/2026.** Kế thừa [19 bộ chiêu nhân vật](CHARACTER_POOL_DESIGN.md) và [19 vật phẩm](ITEM_POOL_DESIGN.md) đã được duyệt về hướng thiết kế. Tài liệu này bổ sung phân loại, liên kết đội và vật phẩm hợp cạ; chưa tích hợp các cơ chế này vào game. Luật tăng nhịp trong round và bo vuông đã triển khai được giữ làm nền.

## 1. Năm nhãn riêng biệt

| Nhãn | Ý nghĩa | Có quyết định sức mạnh tuyệt đối không? |
|---|---|---|
| **Class** | Vai trò thực chiến, dùng cho lọc đội và buff đội hình. | Không; mỗi class có điểm mạnh và khắc chế. |
| **Race** | Chủng tộc hư cấu của avatar trong thế giới game. | Không; không suy ra chủng tộc, giới hay đặc điểm thật của người trong ảnh. |
| **Category vũ khí** | Cách đòn thường tiếp xúc mục tiêu: tay không, kiếm, quét, đạn, dụng cụ, va chạm. | Không; không tự thêm hiệu ứng ngoài bộ chiêu. |
| **Tier nhân vật/vũ khí** | Độ phức tạp và yêu cầu phối hợp: T1 dễ hiểu, T2 có điều kiện, T3 cần canh nhịp/phối hợp. | Không; không phải xếp hạng S/A/B hoặc tăng giá/mở khóa. |
| **Bậc vật phẩm** | Thường / Hiếm / Sử thi / Huyền thoại, liên quan giá và tỷ lệ shop đã đề xuất. | Có ngân sách hiệu ứng khác nhau; độc lập với tier nhân vật/vũ khí. |

Giữ tất cả 19 nhân vật mở từ đầu, chọn trước trận và tồn tại qua các round như hiện tại. Không thêm mua tướng, pool tranh giành hoặc chi phí nhân vật. Tier không tự cộng chỉ số và không cấm nhân vật T1 dùng vũ khí T3.

Mỗi nhân vật có đúng **một class chính + một race** để việc đếm đội hình dễ hiểu. Vai trò phụ vẫn nằm trong hồ sơ cũ, không được tính thêm một class thứ hai.

## 2. Class và race

### Sáu class hiển thị cho người chơi

| Class | Mã đề xuất | Nhiệm vụ | Thành viên |
|---|---|---|---|
| Hộ vệ | guardian | Chặn đường, chịu va chạm, tạo khoảng trống. | 01, 10, 15 |
| Đấu sĩ | bruiser | Đánh gần, giữ nhịp sát thương khi áp sát. | 02, 04, 08, 12, 18 |
| Cơ động | skirmisher | Đuổi người, tận dụng đường nảy. | 17 |
| Xạ thủ | marksman | Sát thương đạn và chọn mục tiêu từ xa. | 05 |
| Kiểm soát | controller | Làm chậm, đặt vùng/bẫy, phá nhịp đối phương. | 03, 07, 09, 14, 16 |
| Hỗ trợ | supporter | Hồi máu, khiên, tăng công hoặc tốc độ cho đồng đội. | 06, 11, 13, 19 |

Class thiết kế này khác `classId` sáu khung engine đang có. Ví dụ Cờ Con là **Hỗ trợ**, nhưng vẫn có thể dùng khung chỉ số `guardian`; không nhận cả buff Hỗ trợ lẫn Hộ vệ. Khi triển khai cần `roleClassId` riêng, không đổi nhầm hành vi vũ khí hiện tại chỉ từ nhãn lọc.

### Năm race hư cấu

| Race | Mã đề xuất | Chủ đề | Thành viên |
|---|---|---|---|
| Người Phố Hội | townfolk | Người thường với công việc và đạo cụ rất bất thường. | 04, 05, 06, 09, 11, 12, 16, 17, 18, 19 |
| Thú Nhân | beastkin | Hổ, sói và hiệp sĩ tai gâu. | 01, 08, 15 |
| Linh Vật | mascot | Thân ôm bông và bọ hét được hoạt hình hóa. | 02, 07 |
| Thực Linh | harvest | Trái cây thành tinh và người giữ mâm quả trong cốt truyện. | 03, 13 |
| Vật Linh | objectkin | Lốp xe và hộp quà có linh hồn trong cốt truyện. | 10, 14 |

Mâm Quả và Hộp Quà là race theo **vai diễn hư cấu**, không khẳng định người trong ảnh có hình dạng khác. Avatar gốc được giữ nguyên, thêm badge nhỏ giúp giải thích chủ đề.

## 3. Ma trận đủ 19 nhân vật

| # | Nhân vật | Class chính | Race | Tier nhân vật | Vũ khí định danh | Category | Tier vũ khí |
|---|---|---|---|---|---|---|---|
| 01 | Hổ Hướng Nội | Hộ vệ | Thú Nhân | T1 | Đệm Chân Đừng Đụng | Tay không | T1 |
| 02 | Bé Ôm Bão | Đấu sĩ | Linh Vật | T1 | Gối Ôm Hai Tay | Tay không | T1 |
| 03 | Anh Tím Mọng | Kiểm soát | Thực Linh | T2 | Xiên Nho Mọng Nước | Dụng cụ | T2 |
| 04 | Đùi Gió Lốc | Đấu sĩ | Người Phố Hội | T1 | Giày Leg Day | Va chạm | T1 |
| 05 | Kính Cận Bắt Bài | Xạ thủ | Người Phố Hội | T2 | Bút Laser Đáp Án C | Đạn | T2 |
| 06 | Đội Trưởng Sắc Màu | Hỗ trợ | Người Phố Hội | T2 | Ruy Băng Quẩy Hội | Quét | T1 |
| 07 | Bọ Hét Hết Hồn | Kiểm soát | Linh Vật | T2 | Râu Bọ Bắt Sóng | Quét | T2 |
| 08 | Sói Suy Tư | Đấu sĩ | Thú Nhân | T2 | Vuốt Trăng Buồn | Tay không | T2 |
| 09 | Sếp Chốt Đơn | Kiểm soát | Người Phố Hội | T3 | Hồ Sơ Đã Chốt | Dụng cụ | T2 |
| 10 | Lốp Lăn Ăn Vặt | Hộ vệ | Vật Linh | T1 | Hộp Snack Cán Drama | Va chạm | T1 |
| 11 | Cờ Con Cổ Vũ | Hỗ trợ | Người Phố Hội | T2 | Cán Cờ Cứu Bồ | Quét | T1 |
| 12 | Kiếm Khách Mượn Vai | Đấu sĩ | Người Phố Hội | T2 | Đại Kiếm Bổ Dưa | Kiếm | T2 |
| 13 | Mâm Quả Chủ Tịch | Hỗ trợ | Thực Linh | T2 | Nho Ném Lấy Thảo | Đạn | T1 |
| 14 | Hộp Quà Nghiêm Túc | Kiểm soát | Vật Linh | T3 | Nơ Khui Bất Ngờ | Quét | T2 |
| 15 | Hiệp Sĩ Gâu Gâu | Hộ vệ | Thú Nhân | T2 | Kiếm Xương Giữ Nhà | Kiếm | T1 |
| 16 | Họa Sĩ Chạy Deadline | Kiểm soát | Người Phố Hội | T3 | Bút Final Cuối Cùng | Dụng cụ | T3 |
| 17 | Anh Tết Ship Nhanh | Cơ động | Người Phố Hội | T2 | Quai Túi Giao Hỏa Tốc | Quét | T2 |
| 18 | Ông Hoàng Nồi Lẩu | Đấu sĩ | Người Phố Hội | T2 | Muôi Lẩu Sôi | Dụng cụ | T2 |
| 19 | Cô Nàng Khui Tết | Hỗ trợ | Người Phố Hội | T2 | Nơ Lộc Đầu Năm | Quét | T1 |

### Category vũ khí vận hành thế nào?

| Category | Đòn thường | Điểm mạnh / đánh đổi |
|---|---|---|
| Tay không | Capsule ngắn xoay; hai tay/vuốt nếu hồ sơ ghi rõ, vẫn theo quy tắc số hit đã duyệt. | Dễ áp sát nhiều người; phải ở gần. |
| Kiếm | Capsule có thân/lưỡi đọc rõ góc xoay. | Tầm tiếp xúc và nhịp chém; dễ hụt khi đối thủ thoát góc. |
| Quét | Ruy băng, nơ, cán cờ, quai túi hoặc râu quét theo góc xoay. | Dễ đọc vùng đòn; không tự trói hay xuyên mục tiêu. |
| Đạn | Laser hoặc nho bay, swept collision, bị tường bo hủy. | Đánh từ xa; bị thân địch che, không tự xuyên nếu bộ chiêu không cho. |
| Dụng cụ | Xiên, tập hồ sơ, bút hoặc muôi vẫn dùng hitbox cận chiến của hồ sơ. | Phân biệt hình ảnh; sát thương vùng chỉ do kỹ năng tương ứng. |
| Va chạm | Đòn thường vẫn là vũ khí xoay; **cú tông thân chỉ gây damage khi chiêu/hiệu ứng cho phép**. | Tận dụng đường nảy; không biến mỗi solver contact thành một hit. |

Vũ khí định danh luôn đi cùng nhân vật và không chiếm một trong hai ô phụ kiện. **Ô vũ khí chính hiện tại được đề xuất chuyển thành ô nâng vũ khí**: chọn modifier nâng cấp cho vũ khí định danh, không thay sang vũ khí người khác. Đây là bổ sung so với tài liệu trước, cần triển khai/migration riêng. Món chưa có trong danh mục 19 vật phẩm không tự xuất hiện trong shop.

### Tier cho nâng vũ khí, độc lập tier độ phức tạp

Để tránh nhầm chữ tier: bảng trên là **tier thiết kế cố định**; còn ba mốc dưới dùng tên **Bậc nâng I/II/III**, là tiến trình thật trong trận nhiều round.

| Bậc nâng | Điều kiện / giá đề xuất | Hiệu ứng giữ qua round |
|---|---|---|
| I — Đồ Nhà Làm | Mặc định, miễn phí. | Vũ khí định danh và bộ chiêu gốc. |
| II — Đồ Có Tâm | Level nhân vật ≥3, trả 8G một lần cho slot. | Thêm +2 ATK vào baseline. |
| III — Đồ Có Nghề | Đã có II, level ≥6, trả thêm 12G. | Thêm +2 ATK nữa và +10 điểm superPower vào baseline. |

Không cộng thêm nội tại class cũ. Không tăng bán kính thân, số đạn, proc liên kết hoặc tầm vũ khí theo bậc nâng. Tổng thưởng III so với I là +4 ATK và +10 superPower. Các bậc này không reset cuối round, khác tăng nhịp thời gian; mốc nâng kỹ năng level 5 đã đề xuất vẫn riêng biệt. Chưa cộng các giá này vào shop đang chạy.

## 4. Luật đội nhiều nhân vật

- **1 nhân vật:** không có liên kết đội; vẫn nhận đầy đủ kỹ năng và hiệu ứng vật phẩm hợp cạ. Không thêm buff solo bù trừ ở bản đầu.
- **2 nhân vật:** được chọn tối đa một **đặc tính đội** đủ điều kiện và một **liên kết đôi** có tên.
- **3 nhân vật:** vẫn tối đa một đặc tính đội; chọn một liên kết đôi hoặc một liên kết bộ ba, **không bật đồng thời cả ba cặp và bộ ba**. Có thể giữ liên kết đôi nếu người thứ ba chỉ bổ sung chiến thuật.
- **Đặc tính đội** là một lựa chọn class **hoặc** race ở phần 5. Không đồng thời bật cả hai. Mốc 3 thay thế mốc 2, không cộng hai mốc.
- Không ghép xuyên người chơi. Cùng chủ sở hữu và trong đội hình round đã khóa mới tính. Mọi buff mặc định chỉ dành cho thành viên của tổ hợp, không tự buff người thứ ba nếu chỉ chọn cặp.
- Đếm **CharacterId khác nhau**, không đếm số bản sao. Được chọn ba Hổ, nhưng không thành ba Thú Nhân khác nhau và không kích hoạt cặp Hổ + Sói. Với bản sao có cùng ID, người chơi chọn slot đại diện; mặc định slot nhỏ nhất. Liên kết không nhảy sang bản sao sống khác giữa round.
- Lựa chọn lưu trong chuẩn bị và khóa cùng đội. Khi đổi người mất điều kiện, UI bỏ lựa chọn không hợp lệ và báo ngay. Nếu không chọn, mặc định **không có** đặc tính/liên kết; không tự chọn combo có lợi sau khi thấy seed.
- Đặc tính class/race xét các thành viên đại diện còn sống. Mất người thì tự hạ mốc 3 → 2 hoặc tắt. Hiệu ứng liên kết mới chỉ kích hoạt khi tất cả thành viên chỉ định còn sống; không đổi cặp giữa round. Buff hữu hạn đã cấp vẫn hết theo hạn, không hủy/khôi phục mỗi lần ra vào vùng.
- Cặp chỉ kích hoạt khi hai tâm cách nhau ≤240 world units. Bộ ba yêu cầu khoảng cách xa nhất giữa bất kỳ hai thành viên ≤280. Phạm vi kiểm tra đúng lúc sự kiện xảy ra, không dùng ảnh hay tầm nhìn màn hình.

## 5. Đặc tính class/race — chọn một cho đội

Thưởng nhỏ, không thêm hồi phục vô hạn. Buff tĩnh tính lại khi thay đổi số người sống; khiên đầu round chỉ cấp một lần nếu đội đã đủ điều kiện lúc khóa. Không cấp lại khi một thành viên chết, đổi đại diện hoặc reconnect.

| Đặc tính | 2 nhân vật khác nhau | 3 nhân vật khác nhau |
|---|---|---|
| Hộ vệ | Các Hộ vệ +1 giáp. | Các Hộ vệ +2 giáp. |
| Đấu sĩ | Các Đấu sĩ +4% ATK. | Các Đấu sĩ +6% ATK. |
| Kiểm soát | Các Kiểm soát +5 điểm superPower. | Các Kiểm soát +8 điểm superPower. |
| Hỗ trợ | Các Hỗ trợ nhận 10 khiên đầu round trong 5 giây. | Các Hỗ trợ nhận 16 khiên đầu round trong 5 giây. |
| Người Phố Hội | Các thành viên race này +4% speed. | +6% speed. |
| Thú Nhân | Các Thú Nhân +3 điểm phần trăm crit. | +5 điểm phần trăm crit. |
| Linh Vật | Hai Linh Vật +5% speed. | Chưa có ba người khác nhau, chưa mở mốc 3. |
| Thực Linh | Hai Thực Linh +20 HP baseline đầu round. | Chưa mở mốc 3. |
| Vật Linh | Hai Vật Linh +20 mass. | Chưa mở mốc 3. |

Cơ động và Xạ thủ hiện chỉ có một nhân vật/class nên **chưa có mốc 2/3**; không đưa mục không thể kích hoạt lên UI. Mọi class vẫn có lợi từ race, liên kết riêng và đồ hợp cạ. Bộ ba cùng race không bắt buộc cùng class.

Thực Linh khóa thêm HP vào snapshot đầu round, không rút HP tối đa hay HP hiện tại khi đồng đội chết; đây là ngoại lệ có chủ đích so với buff class/race tĩnh. Bản đầu không có hồi sinh nên không có tình huống bật lại mốc sau khi hạ.

## 6. Liên kết 1–1 có tên

Mỗi cặp tối đa **3 lần kích hoạt/round**, hồi liên kết **8 giây**, bắt đầu sẵn sàng. Chỉ trigger từ kỹ năng/đòn gốc ghi trong bảng. Phần thưởng không kích hoạt dây chuyền một liên kết khác, không tự đếm thành đánh thường, không tạo Gold. Khi ghi “đòn kế tiếp”, lượt chờ sống 3 giây, không cộng dồn.

| ID | Cặp nhân vật | Tên liên kết | Sự kiện → hiệu ứng |
|---|---|---|---|
| P01 | 01 Hổ + 08 Sói | **Hội Ngồi Nghĩ Nhiều** | Hổ dùng Gầm Nhỏ Thôi → Sói nhận 15 khiên trong 2 giây và +8% speed trong 2 giây. |
| P02 | 02 Bé Ôm + 07 Bọ Hét | **Ôm Mic Đừng Hét** | Ôm Một Miếng của Bé chạm địch → Bọ nhận 10 năng lượng. |
| P03 | 03 Tím Mọng + 13 Mâm Quả | **Vitamin Có Tổ Chức** | Táo Đến Công Chuyện của Mâm Quả hồi HP thực cho Tím Mọng → cả hai nhận 10 khiên trong 2 giây. Hồi dư ở đầy máu không trigger. |
| P04 | 04 Đùi Gió + 10 Lốp | **Leg Day Có Bánh Xe** | Cán Qua Drama của Lốp tông trúng địch → Đùi nhận +10% speed trong 2 giây. |
| P05 | 05 Kính Cận + 16 Họa Sĩ | **Một Người Soi, Một Người Sửa** | Kính dùng Khoanh Đáp Án C → đòn thường kế tiếp của Họa Sĩ thêm 30% ATK. Mục tiêu có thể khác mục tiêu đánh dấu. |
| P06 | 06 Đội Trưởng + 11 Cờ Con | **Cổ Vũ Có Biên Chế** | Quẩy Đúng Nhịp của Đội Trưởng cấp buff cho Cờ Con → Cờ Con nhận thêm 10 khiên trong 2 giây. |
| P07 | 09 Sếp + 16 Họa Sĩ | **Final Lần Này Thật** | Mời Vào Họp của Sếp nổ trúng địch → Họa Sĩ nhận 8 năng lượng. |
| P08 | 12 Kiếm Khách + 15 Hiệp Sĩ | **Kiếm Dài, Gâu To** | Gâu Là Có Mặt cấp khiên cho Kiếm Khách → đòn thường kế tiếp của Kiếm Khách thêm 30% ATK. |
| P09 | 14 Hộp Quà + 17 Anh Tết | **Đóng Gói Và Giao Gấp** | Giao Hỏa Tốc của Anh Tết có đòn cường hóa trúng → Hộp Quà nhận 8 năng lượng. |
| P10 | 17 Anh Tết + 19 Cô Khui Tết | **Giao Đúng Người, Lộc Đúng Chỗ** | Lì Xì Lấy Hên cấp buff cho Anh Tết → đòn thường kế tiếp của Anh Tết thêm 25% ATK. |
| P11 | 18 Nồi Lẩu + 13 Mâm Quả | **Có Lẩu Có Tráng Miệng** | Chan Nước Nóng trúng ít nhất một địch → Mâm Quả nhận 8 năng lượng, một lần cho cả lượt hất. |
| P12 | 11 Cờ Con + 19 Cô Khui Tết | **Phất Cờ Khui Lộc** | Phất Cờ Cứu Bồ cấp khiên cho Cô Khui Tết → Cờ Con nhận 12 khiên trong 2 giây. |

Đủ cả 19 nhân vật có ít nhất một cặp riêng, không cần viết 171 cặp mới có giá trị đội hình. Các cặp khác vẫn phối hợp bằng chiêu gốc và đặc tính class/race, chỉ không có proc mang tên riêng. Cặp là quan hệ hai người nhưng trigger có thể có chiều để tạo vai trò rõ, không mặc định cả hai nhận cùng buff.

## 7. Hiệu ứng khi đủ bộ ba

Chọn một bộ ba thay cho liên kết đôi. Mỗi bộ có tối đa **2 lần kích hoạt/round**, hồi **12 giây**, bắt đầu sẵn sàng. Cần cả ba sống và nằm trong điều kiện khoảng cách phần 4. Mỗi lần chỉ xét một lượt Super gốc, không xét phát nổ phụ hoặc DoT. Không tăng số Super bằng việc miễn phí tự cast.

| ID | Bộ ba | Tên bộ | Khi kích hoạt | Thưởng cho ba thành viên |
|---|---|---|---|---|
| T01 | 01 Hổ + 08 Sói + 15 Hiệp Sĩ | **Tam Thú Giữ Xóm** | Hiệp Sĩ tung Super. | Mỗi người nhận 18 khiên trong 3 giây. |
| T02 | 02 Bé Ôm + 07 Bọ + 04 Đùi | **Ôm Hét Chạy** | Bọ tung Super. | Mỗi người +10% speed trong 3 giây. |
| T03 | 03 Tím + 13 Mâm Quả + 18 Nồi Lẩu | **Buffet Không Ai Đói** | Nồi Lẩu tung Super. | Mỗi người hồi ngay 10 HP. Tối đa 20 HP/người/round từ bộ này. |
| T04 | 05 Kính + 09 Sếp + 16 Họa Sĩ | **Phòng Ban Chạy Deadline** | Sếp tung Super. | Mỗi người +8% ATK trong 3 giây. |
| T05 | 06 Đội Trưởng + 11 Cờ Con + 19 Cô Khui | **Lễ Hội Có Ban Tổ Chức** | Đội Trưởng tung Super. | Mỗi người nhận 15 khiên trong 3 giây và xóa chậm hiện có. Không miễn chậm về sau. |
| T06 | 14 Hộp Quà + 17 Anh Tết + 19 Cô Khui | **Tết Đến Tận Cửa** | Cô Khui Tết tung Super. | Mỗi người nhận một lượt đòn thường kế tiếp trong 3 giây thêm 25% ATK. |
| T07 | 04 Đùi + 10 Lốp + 18 Nồi Lẩu | **Căng Tin Sau Leg Day** | Lốp tung Super. | Mỗi người nhận 12 khiên và +8% speed trong 3 giây. |
| T08 | 12 Kiếm Khách + 15 Hiệp Sĩ + 17 Anh Tết | **Giao Kiếm Tận Nhà** | Kiếm Khách tung Super. | Mỗi người nhận một lượt đòn thường kế tiếp trong 3 giây thêm 30% ATK. |

Toàn bộ 19 nhân vật đều có ít nhất một bộ ba. Bộ ba không mặc định mạnh hơn mọi cặp: điều kiện khó hơn và ít lượt hơn, đổi lại ảnh hưởng cả ba người. Sau khi một người bị hạ, bộ ba ngừng phát thưởng mới; không tự hạ thành cặp dự phòng trong round.

## 8. Vật phẩm hợp cạ — đủ 19 món, đủ 19 người

Hiệu ứng gốc của mọi món giữ nguyên theo [ITEM_POOL_DESIGN.md](ITEM_POOL_DESIGN.md). Bảng này **chỉ là phần cộng thêm** khi đúng nhân vật mang món đó. Món vẫn dùng tốt trên người khác. Mỗi người có một món chữ ký ở bản đầu để dễ nhớ và dễ cân bằng; không giới hạn quyền trang bị của người khác.

| Món đồ | Người hợp cạ | Tên bonus | Phần thêm so với hiệu ứng gốc |
|---|---|---|---|
| Máy chấm công | 09 Sếp Chốt Đơn | **Sếp Cũng Phải Quẹt** | Hai mốc đầu giây 10/20 cấp 10 năng lượng thay vì 8; bốn mốc còn lại giữ 8. Tổng thêm tối đa 4 năng lượng/round. |
| Chăn gối | 01 Hổ Hướng Nội | **Hang Ấm Không Tiếp Khách** | Khiên ngưỡng thấp máu tăng 35 → 45, hạn vẫn 3 giây. |
| Xôi | 02 Bé Ôm Bão | **Ôm Chắc Bụng** | Thêm 10 HP baseline, tổng bonus từ Xôi là +75 HP. |
| Bánh mì | 17 Anh Tết Ship Nhanh | **Vừa Ship Vừa Gặm** | Thêm +15 speed vào baseline; HP/ATK gốc của Bánh mì giữ nguyên. |
| Cơm thợ xây | 04 Đùi Gió Lốc | **Ăn Xong Tập Chân** | Loại bỏ riêng mức trừ −30 speed của món này; vẫn chịu chậm từ nguồn khác. |
| Bún vịt | 08 Sói Suy Tư | **Hết Buồn Nhờ Tô Bún** | Thêm 10 khiên đầu round, tồn tại 5 giây. Không sửa nội tại thấp máu. |
| Kem mít | 03 Anh Tím Mọng | **Trái Cây Full Topping** | Chậm từ riêng Kem mít tăng 20% → 25%; giữ nhịp đòn thứ tư và hồi 3 giây. |
| Mô hình Nami One Piece | 12 Kiếm Khách Mượn Vai | **Kiếm Gặp Hải Trình** | Lượt điện sau Super tăng 50% → 60% ATK; vẫn chỉ một đòn, không lan. |
| PC | 16 Họa Sĩ Chạy Deadline | **Render Xong Trước Deadline** | Buff +12% ATK sau Super kéo dài 3 → 4 giây. Không tăng hệ số. |
| Máy pha cà phê | 05 Kính Cận Bắt Bài | **Mắt Sáng Nhờ Một Shot** | Thêm +5 điểm charge, tổng charge từ máy là +25. |
| Tủ lạnh | 10 Lốp Lăn Ăn Vặt | **Đồ Ăn Luôn Trong Tầm Lăn** | Thêm 10 khiên đầu round trong 5 giây; giữ nguyên hồi 4 giây và mức chậm của tủ. |
| Bánh khảo | 14 Hộp Quà Nghiêm Túc | **Hộp Này Có Lót Bánh** | Khiên đầu round của bánh tăng 40 → 50; hạn vẫn 10 giây. |
| Thịt dê | 15 Hiệp Sĩ Gâu Gâu | **Một Miếng Rồi Canh Nhà** | Hit húc đầu round tăng 60% → 75% ATK; vẫn chỉ một lần và không tự proc kỹ năng. |
| Nem chua | 07 Bọ Hét Hết Hồn | **Chua Tới Mức Phải Hét** | DoT riêng Nem chua gây 5 thay vì 4 sát thương gốc/tick, vẫn ba tick và chịu giáp. |
| Rau má | 06 Đội Trưởng Sắc Màu | **Quẩy Nhiệt, Đầu Vẫn Mát** | Miễn chậm sau lần thanh tẩy đầu kéo dài 1,5 → 2 giây. |
| Vịt quay | 18 Ông Hoàng Nồi Lẩu | **Thực Đơn Có Món Quay** | Thêm +1 ATK baseline, tổng ATK từ Vịt quay là +5. |
| Khau nhục | 13 Mâm Quả Chủ Tịch | **Mâm Có Món Mặn** | Lần hồi ở ngưỡng 30% HP tăng 20 → 25 HP; không tăng HP tối đa hay giáp thêm. |
| Quần sịp đỏ | 11 Cờ Con Cổ Vũ | **Tự Tin Từ Bên Trong** | Khiên ngưỡng 25% HP tăng 25 → 35; speed/crit giữ nguyên. |
| Chai sữa | 19 Cô Nàng Khui Tết | **Lộc Đầu Năm, Sữa Đầu Round** | Mỗi ngụm hồi 6 thay vì 5 HP, tổng tối đa 24 thay vì 20 HP. |

Đồ tiêu hao hợp cạ vẫn chỉ dùng một round, không trở thành phụ kiện vĩnh viễn. Bonus chữ ký không tăng rarity, không tạo món ID mới và không tăng giá mua. Một nhân vật chỉ có **một món chữ ký** trong bảng, nên không đồng thời nhận hai bonus chữ ký dù có ba ô đồ.

Hổ + Chăn gối và Lốp + Tủ lạnh là các ví dụ phù hợp chủ đề; người chơi vẫn có thể dùng PC trên Hổ nếu muốn build sát thương. Bonus hợp cạ cố ý nhỏ hơn hiệu ứng gốc để không biến món đồ thành lựa chọn bắt buộc.

## 9. Thứ tự hiệu ứng, giới hạn và reset

**Đầu round:** class stats → level → bậc nâng vũ khí → item stats + bonus hợp cạ → đặc tính baseline đầu round → clamp → lưu baseline → HP đầy và cấp khiên đầu round. Không đọc lại loadout đang sửa trong lúc trận chạy.

**Trong round:** baseline → tăng nhịp mỗi 10 giây → buff tĩnh class/race đang đủ số người sống → buff tạm kỹ năng/PC/liên kết → clamp hiện hành. Buff cùng loại theo phần trăm chỉ lấy **giá trị lớn nhất**, không nhân hoặc cộng dồn mọi nguồn; buff tĩnh cũng tham gia phép lấy lớn nhất. Ví dụ +10% ATK từ đội trưởng và +8% từ bộ ba chỉ lấy +10%, không thành +18%. Các bonus HP/mass/charge cố định ghi ở baseline không bị coi là cùng loại với buff ATK/speed phần trăm.

- Thưởng “đòn kế tiếp thêm X% ATK” có thể cùng tồn tại với nội tại gốc nhưng các lượt thưởng phụ từ Nami, liên kết và phong bao chỉ tiêu một lần trên cùng hit. Tổng hệ số **cộng thêm từ các nguồn phụ này** giới hạn 100% ATK mỗi hit; phần vượt bị bỏ khi tất cả lượt hợp lệ được tiêu. Không nerf hệ số riêng của đòn kỹ năng gốc bằng giới hạn này.
- Khiên hiệu ứng từ skill, liên kết, đặc tính và món đồ cộng tối đa 100; từng lớp có nguồn/hạn, tiêu lớp gần hết hạn trước. Điều này có thể làm một phần khiên cấp dư không hiệu quả; UI tooltip ghi rõ giới hạn.
- Năng lượng từ liên kết/vật phẩm và sát thương cùng dùng ngân sách tăng tối đa 12 mỗi nhân vật/tick. Thứ tự tick: xét Super bằng năng lượng tick trước → xử lý sự kiện theo ID → gộp năng lượng và clamp → tick sau mới có thể tung Super mới. Phần vượt 100 hoặc vượt ngân sách tick bị bỏ, không gửi sang tick sau.
- Khi liên kết phát thưởng, ghi `derived=true`. Các thưởng này không được kích hoạt một liên kết khác hoặc proc “đánh thường trúng” thêm lần nữa. Phải phân biệt `cast`, `impact`, `shieldGranted`, `hpActuallyHealed`, `normalAttackHit` để không trigger nhầm.
- Mốc HP tính sau damage khi người nhận còn sống. Không hồi sinh, reset Super, làm mới lượt cứu mạng hay cộng Gold từ bất kỳ liên kết nào. Hồi dư khi đầy máu bị bỏ.
- Kiểm tra khoảng cách bằng bình phương tọa độ nguyên. Cùng tick có nhiều sự kiện đủ điều kiện, sự kiện đầu theo thứ tự xử lý ổn định chiếm lượt và cooldown; các sự kiện sau không phát thêm thưởng. Cấp khiên liên kết không được tính như khiên của kỹ năng gốc để tự kích lại P08/P12.
- Sang round mới: hồi toàn bộ lượt đôi/bộ ba, trạng thái proc và item consume; tăng nhịp reset 0. Level, bậc nâng vũ khí và phụ kiện còn giữ. Đặc tính/liên kết chọn trước được giữ nếu còn hợp lệ nhưng vẫn có thể thay trong chuẩn bị.
- Nếu thành viên chết thì bỏ lượt đòn phụ chưa tiêu đang nằm trên người đó. Buff đã cấp cho đồng minh khác giữ đến hết hạn, như luật chung; không tạo hoạt động mới từ nguồn đã chết.

## 10. Màn chọn đội và ví dụ

Mỗi thẻ nhân vật có avatar + class + race + tier; chi tiết thêm category/tier vũ khí và món hợp cạ. Khi chạm một món trong shop, dòng **“Hợp cạ: Hổ Hướng Nội — khiên +10”** chỉ sáng nếu slot đang xem có đúng nhân vật. Khi xem bonus, tách rõ “hiệu ứng gốc” và “đúng người thêm”.

Khu đội hình có hai hàng chọn: **Đặc tính đội (1)** và **Liên kết (1)**. Hiện đúng điều kiện đạt/chưa đạt, người còn thiếu, số lượt và cooldown. Thêm người thứ ba xem được thay đổi **trước khi xác nhận**; không âm thầm bỏ cặp đang chọn. Liên kết không đủ người hoặc không có cặp riêng thì hiển thị “Chưa chọn”, không khóa nút Sẵn sàng.

Ví dụ **Hổ + Sói + Hiệp Sĩ**: class gồm Hộ vệ/Đấu sĩ/Hộ vệ; race đều Thú Nhân. Người chơi chọn một trong Hộ vệ mốc 2 hoặc Thú Nhân mốc 3; sau đó chọn P01 hoặc T01. Chọn T01 thì P01 tắt. Hổ mang Chăn gối vẫn nhận bonus chữ ký độc lập.

Ví dụ **Kính Cận + Sếp + Họa Sĩ**: chọn Người Phố Hội mốc 3 hoặc Kiểm soát mốc 2. Chọn P05, P07 hoặc T04, chỉ một. Họa Sĩ mang PC tăng thời gian buff sau Super; không giảm hồi chiêu nét mực.

Ví dụ **Hộp Quà + Anh Tết + Cô Khui Tết**: chỉ Người Phố Hội mốc 2 đủ điều kiện, vì Hộp Quà thuộc Vật Linh. Có thể chọn P09, P10 hoặc T06. Bộ này không tự thành “ba người race Tết”; Tết là tên liên kết có thành viên cụ thể.

## 11. Triển khai và kiểm chứng sau khi duyệt

Thêm dữ liệu riêng cho `roleClassId`, `raceId`, `designTier`, `signatureWeaponId`, category/tier, weapon upgrade rank, `traitChoice`, `bondChoice`, slot đại diện và item affinity. Không dùng tier để sửa chỉ số tự động. Chọn đội/đổi slot phải được server kiểm tra; config snapshot khóa đủ metadata để replay không đọc catalog mới khác bản.

Class/race buffs động cần tính từ baseline; không nhân rồi chia trả lại chỉ số đang có. Serialize số lượt, cooldown, buff, đòn phụ, khiên và nguồn trong checkpoint. Khi bổ sung luật này phải đổi phiên bản engine/protocol phù hợp; các thiết kế nhân vật/vật phẩm trước vẫn chưa có đủ hook trong engine hiện tại.

Kiểm tra catalog đủ 19 người, một class/race mỗi người, mọi ID liên kết tồn tại, mỗi người có ít nhất một cặp và một bộ ba, và bảng hợp cạ ánh xạ đủ 19 món/19 người không trùng. Test đội 1/2/3, bản sao, slot đổi chỗ, khoảng cách biên, thành viên chết, cấp khiên bị trần, đầy HP/năng lượng, simultaneous cast, bonus chỉ nhận khi đúng người, tiêu hao đúng một lần và checkpoint qua đúng tick proc.

Balance so sánh cùng seed/loadout giữa không liên kết, chỉ đặc tính, chỉ cặp, chỉ bộ ba và có bonus item. Theo dõi thời lượng sau khi bo dừng, win rate đội hình, khiên thật đã hấp thụ và heal thật; không kết luận tier cao mạnh hơn từ sát thương tổng. Mức thưởng ban đầu trong tài liệu đều là giả thuyết để thử.

**Phần đề xuất mới cần duyệt:** phân class/race/tier; ô nâng vũ khí I–III; một đặc tính và một liên kết mỗi đội; 12 cặp, 8 bộ ba; 19 bonus đồ hợp cạ. Không thay bộ chiêu gốc hoặc tự triển khai shop chỉ bằng việc lưu tài liệu này.
