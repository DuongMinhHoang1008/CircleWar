# Circle Chaos — Thiết kế 19 vật phẩm

> Tài liệu dưới đây giữ đề xuất pool đầu tiên làm lịch sử. Catalog thực tế hiện có 20 vật phẩm; shop và item mới được mô tả ở phần gameplay v10 cuối tài liệu.

**Bản đề xuất để duyệt · v0.1 · 18/10/2026.** Chưa thay đổi shop hoặc hiệu ứng trong game. Thông số là mốc thử cân bằng, áp dụng lên nhân vật mang món đồ; không tác động HP người chơi hoặc tiền thưởng của phòng.

## 1. Hướng sử dụng

Chia thành **7 phụ kiện giữ qua nhiều round** và **12 món ăn/đồ uống tiêu hao cho một round**. Mỗi món có một nét riêng để nhìn tên là đoán được công dụng. Không cần bấm ăn hoặc kích hoạt giữa trận.

Giữ hai ô phụ kiện và một ô tiêu hao mỗi nhân vật. Danh sách mới chưa có món đóng vai trò vũ khí chính: không ép đồ ăn thành vũ khí; ô vũ khí hiện tại giữ nguyên trong bước thiết kế này. Đề xuất 19 món này thay danh mục phụ kiện/tiêu hao cũ khi triển khai, còn danh mục vũ khí chốt riêng. Đây chưa phải migration dữ liệu trang bị đã mua.

Giá theo bốn bậc đang dùng: **Thường 5G / Hiếm 10G / Sử thi 16G / Huyền thoại 24G**. Đồ ăn cũng dùng giá theo bậc thay vì mặc định mọi món cùng giá thuốc 4G. Chưa thay tỷ lệ xuất hiện 60/26/12/2%; cần đo riêng lượng cung đồ ăn và phụ kiện sau khi thay danh mục.

## 2. Bảng hiệu ứng

| # | Vật phẩm | Loại · Bậc · Giá | Tên hiệu ứng | Hiệu ứng đề xuất | Câu mô tả vui |
|---|---|---|---|---|---|
| 01 | **Máy chấm công** | Phụ kiện · Hiếm · 10G | **Đúng Giờ Có Thưởng** | +15 điểm charge. Ở giây 10/20/30/40/50/60, nhận thêm 8 năng lượng mỗi mốc, tối đa 6 lần/round. | “Không quên chấm công, chỉ quên né chiêu.” |
| 02 | **Chăn gối** | Phụ kiện · Hiếm · 10G | **Ngủ Nốt Năm Phút** | +30 HP tối đa. Lần đầu HP còn ≤40% trong round, nhận 35 khiên trong 3 giây. | “Đang combat nhưng tâm hồn vẫn nằm ngang.” |
| 03 | **Xôi** | Tiêu hao · Thường · 5G | **Chắc Bụng Chắc Kèo** | +65 HP tối đa trong round. | “Một gói xôi, bớt chơi vơi.” |
| 04 | **Bánh mì** | Tiêu hao · Thường · 5G | **Ổ Này Có Lực** | +35 HP tối đa và +3 ATK trong round. | “Thêm pate, thêm sát thương.” |
| 05 | **Cơm thợ xây** | Tiêu hao · Hiếm · 10G | **Đổ Bê Tông Dạ Dày** | +80 HP tối đa, +40 mass và −30 speed trong round. | “Ăn xong đứng vững như cột nhà.” |
| 06 | **Bún vịt** | Tiêu hao · Hiếm · 10G | **Lướt Như Nước Dùng** | +50 speed, +2 giáp trong round. | “Nước dùng thanh, đường lăn mượt.” |
| 07 | **Kem mít** | Tiêu hao · Hiếm · 10G | **Mát Lạnh Tới Công Chuyện** | +2 ATK trong round. Mỗi đòn thường thứ tư trúng địch gây chậm 20% trong 1 giây; hồi kích hoạt chung 3 giây. | “Một miếng mát lòng, một đòn mát chân.” |
| 08 | **Mô hình Nami One Piece** | Phụ kiện · Sử thi · 16G | **Hoa Tiêu Gọi Sấm** | +20 điểm superPower. Mỗi lần tung Super, đòn thường trúng đầu tiên trong 4 giây gây thêm 50% ATK sát thương điện lên chính mục tiêu đó. Không lan. | “Dự báo thời tiết: có sấm ở đội bên kia.” |
| 09 | **PC** | Phụ kiện · Huyền thoại · 24G | **FPS Cao, Tay Vẫn Auto** | +6 ATK, −4 tick cooldown đánh thường. Mỗi lần tung Super, nhận +12% ATK trong 3 giây. | “Máy gánh đồ họa, bạn gánh niềm tin.” |
| 10 | **Máy pha cà phê** | Phụ kiện · Hiếm · 10G | **Espresso Chạy Deadline** | +35 speed và +20 điểm charge. | “Một shot tỉnh ngủ, hai shot tỉnh cả sân.” |
| 11 | **Tủ lạnh** | Phụ kiện · Sử thi · 16G | **Đóng Băng Cuộc Hội Thoại** | +5 giáp, +50 mass. Va chạm thân với địch khiến địch chậm 20% trong 1 giây; hồi chung 4 giây cho người mang. | “Mở cửa lấy đồ, tiện thể hạ nhiệt đối thủ.” |
| 12 | **Bánh khảo** | Tiêu hao · Thường · 5G | **Phủ Phấn Đỡ Đòn** | Nhận 40 khiên lúc bắt đầu giao tranh, tồn tại tối đa 10 giây. | “Bánh hơi bở, lớp khiên thì chưa chắc.” |
| 13 | **Thịt dê** | Tiêu hao · Hiếm · 10G | **Húc Là Phải Thấm** | +5 ATK. Lần va chạm thân đầu tiên với địch trong round gây thêm một hit bằng 60% ATK và đẩy lùi bằng xung đẩy của một đòn đánh thường. | “Nạp protein, nạp luôn cú húc.” |
| 14 | **Nem chua** | Tiêu hao · Hiếm · 10G | **Chua Nhưng Có Võ** | +3 ATK. Đòn thường thứ ba trúng địch đặt hiệu ứng chua lên mục tiêu: 4 sát thương gốc mỗi giây trong 3 giây. Hồi kích hoạt chung 5 giây. | “Chua miệng một chút, đối thủ nhăn mặt cả lượt.” |
| 15 | **Rau má** | Tiêu hao · Thường · 5G | **Hạ Nhiệt Tâm Hồn** | +25 HP tối đa. Lần đầu nhận chậm trong round, xóa chậm và miễn chậm trong 1,5 giây. | “Nóng trong người? Uống xong lăn tiếp.” |
| 16 | **Vịt quay** | Tiêu hao · Sử thi · 16G | **Da Giòn Combo Giòn** | +4 ATK và −3 tick cooldown đánh thường trong round. | “Da giòn rụm, nhịp đánh rôm rả.” |
| 17 | **Khau nhục** | Tiêu hao · Sử thi · 16G | **Nằm Khâu Nhục, Đứng Khó Gục** | +60 HP tối đa, +3 giáp. Lần đầu HP còn ≤30% trong round, hồi ngay 20 HP. | “Mềm ở miếng thịt, cứng ở tinh thần.” |
| 18 | **Quần sịp đỏ** | Phụ kiện · Sử thi · 16G | **Đỏ Vận Đỏ Đòn** | +8 điểm phần trăm chí mạng. Lần đầu HP còn ≤25% trong round, nhận 25 khiên trong 2 giây và +15% speed trong 2 giây. | “Đồ mặc bên trong, tự tin tỏa ra ngoài.” |
| 19 | **Chai sữa** | Tiêu hao · Thường · 5G | **Uống Ngoan, Lăn Khỏe** | +40 HP tối đa. Hồi 5 HP tại giây 5/10/15/20, tổng tối đa 20 HP; lượng hồi dư khi đầy máu bị bỏ. | “Bốn ngụm nhỏ, bốn lần bớt rén.” |

## 3. Quy tắc cộng dồn và kích hoạt

### Chỉ số, tăng nhịp và reset

- Chỉ số cộng thẳng từ trang bị và đồ ăn được tính vào baseline đầu round **trước tăng nhịp mỗi 10 giây**, có clamp như engine. Ví dụ Bánh mì cộng ATK vào baseline rồi mới nhân hệ số nhịp; không cộng lại +3 mỗi mốc.
- Máy chấm công và cà phê cộng **điểm charge**, không cộng năng lượng ban đầu. Nami cộng điểm superPower, không phải +20 năng lượng. Bún vịt cộng 50 đơn vị speed dữ liệu, không phải +50% tốc độ.
- PC và Vịt quay trừ tổng cộng tối đa 7 tick vào cooldown baseline nếu dùng chung; baseline vẫn tối thiểu 8 tick. Sau đó mới chia theo hệ số tốc độ đánh của round. Không làm chiêu tự động hoặc Super hết hồi nhanh hơn.
- HP tăng tối đa của Xôi, Chăn gối, Khau nhục… đồng thời làm HP bắt đầu round cao hơn tương ứng vì mỗi round sinh snapshot đầy máu. Không phải hồi HP người chơi; không tăng HP giữa trận khi shop thay đồ. Máu tối đa và giáp không tăng theo nhịp thời gian.
- Buff +12% ATK của PC là buff tạm: tính trên ATK hiện tại sau tăng nhịp, hết hạn trả về đúng chỉ số theo thời điểm đó. Không ghi ngược vào baseline, không nhân chồng nếu tung Super tiếp khi buff chưa hết.
- Giữ các trần engine: HP 1600, giáp 60, speed 900, crit 65%; ATK baseline 150 và ATK sau tăng nhịp/buff tối đa 300. Cooldown không dưới 8 tick. Không vượt trần để bù cho người đã chạm trần.
- Tất cả bộ đếm, ngưỡng HP, hồi kích hoạt, phong điện Nami và lịch uống sữa reset khi tạo round mới. Phụ kiện tiếp tục có trong loadout; tiêu hao dùng một lần cho round đã khóa và bị trừ đúng một lần lúc kết toán, kể cả người mang chết sớm. Không trừ lại khi reconnect/replay.

### Chạm, đánh và sát thương phụ

- **Đòn thường trúng** là một hit vũ khí hoặc đạn đánh thường đã tiếp xúc hợp lệ với địch sống, kể cả damage bị khiên hấp thụ hết. Hit nhiều mục tiêu đếm từng mục tiêu theo thứ tự ID; hồi chung chặn kích hoạt liên tiếp trong cùng tick. Đạn Super, vùng, DoT, thorns và hit phụ không tính là đòn thường.
- Bộ đếm của Kem mít/Nem chua dừng ở trạng thái sẵn sàng khi đủ ngưỡng. Nếu còn hồi thì đợi đòn thường hợp lệ đầu tiên sau hồi mới kích hoạt, sau đó đặt bộ đếm về 0. Không tích nhiều lượt chờ.
- Nami chỉ giữ một lượt điện tối đa 4 giây sau Super. Super mới làm mới hạn, không cộng số lượt. Điện là phần cộng vào sát thương cùng một hit trước giáp, chịu khiên và phòng thủ bình thường; không nảy, không chí mạng riêng, không tạo thêm một lượt proc hoặc một gói năng lượng thứ hai.
- Hit húc của Thịt dê là sát thương riêng, không chí mạng và không kích hoạt đòn thứ tư, Kem mít, Nem chua, Nami hoặc các hiệu ứng “khi đánh thường”. Vẫn tuân thủ trần năng lượng 12 mỗi nhân vật mỗi tick. Không húc đồng minh; va chạm nhiều địch cùng tick chọn mục tiêu ID nhỏ nhất.
- DoT Nem chua tick ở +1/+2/+3 giây sau khi đặt, **4 sát thương gốc mỗi tick trước giáp**; chịu quy tắc damage tối thiểu 1 và khiên hiện tại. Cùng nguồn chỉ làm mới hạn, không cộng nhiều chồng. Hai nguồn khác nhau giữ hai DoT riêng. DoT không chí mạng, không kích hoạt lại vật phẩm; nguồn chết thì hủy phần còn lại.
- Tủ lạnh kích hoạt khi hai thân thực sự tiếp xúc; solver ba pass không tính thành ba lần. Hồi chung 4 giây nên không thể chạm nhiều người để phát chậm liên tục. Cùng tick dùng thứ tự cặp/ID ổn định của engine.
- Chậm của Kem mít/Tủ lạnh lấy mức mạnh nhất cùng các chiêu nhân vật, trần 35%; không cộng thành đứng im. Rau má kích hoạt ngay sau khi nhận chậm, rồi xóa chậm và bật miễn chậm. Khiên không chặn việc nhận chậm.

### Hồi phục, bảo hộ và chống trận kéo dài

- Chăn gối, Khau nhục và Quần sịp đỏ chỉ kiểm tra ngưỡng **sau khi trừ sát thương, khi người mang vẫn còn HP > 0**. Một hit chết người không được cứu lại; không phải hồi sinh. Nếu cùng tick có nhiều hit, hiệu ứng một lần được ghi đã dùng ngay ở hit kích hoạt đầu tiên.
- Nếu có nhiều hiệu ứng ngưỡng cùng lúc: nhận khiên trước, rồi hồi HP; tính điều kiện trên HP sau hit trước các hiệu ứng cứu trợ. Vì vậy một lần hồi không vô tình chặn hiệu ứng khác đã đủ điều kiện.
- Hồi HP chỉ tác động người mang, không vượt maxHP, không tạo năng lượng. Sữa/Khau nhục có tổng lượng hồi hữu hạn mỗi round, không tạo vòng lặp hồi vô hạn sau khi bo dừng. Vật phẩm này không thêm hút máu vô hạn.
- Khiên có nguồn và thời hạn riêng. Bánh khảo hết phần còn lại ở giây 10; Chăn gối và Quần sịp đỏ hết sau thời gian ghi. Tính chung với khiên kỹ năng trong giới hạn 100 điểm khiên hiệu ứng của bản thiết kế nhân vật; phần cấp vượt trần bị bỏ. Khiên trang bị vĩnh viễn của danh mục cũ cần xử lý riêng khi migration. Tiêu khiên gần hết hạn trước.
- Một nhân vật không trang bị hai bản sao của cùng một phụ kiện. Mua bản sao cho người khác được phép; tháo đồ về túi và gắn lại trong chuẩn bị không reset hiệu ứng của round đã khóa. Không đổi trang bị trong giao tranh.
- Các hit phụ và buff đều tuân thủ nguồn sống/đúng phe, RNG seed và snapshot/replay. Không dùng random mỹ thuật để quyết định hiệu ứng gameplay.

## 4. Gợi ý phối đồ

| Lối chơi | Hai phụ kiện | Món ăn | Điểm thú vị / đánh đổi |
|---|---|---|---|
| Chặn đường, giữ bo | Tủ lạnh + Chăn gối | Cơm thợ xây | Nặng, cứng, chạm là làm chậm; đánh đổi khả năng đuổi người. |
| Đánh nhanh về cuối | PC + Máy pha cà phê | Vịt quay | Nhiều hit và Super hơn; đắt, ít bảo hộ, hiệu quả haste giảm khi chạm trần cooldown. |
| Canh Super dồn đòn | Máy chấm công + Nami | Bánh mì | Có các mốc năng lượng dễ đọc; cần đánh thường trúng trong 4 giây để tiêu điện. |
| Lật kèo thấp máu | Quần sịp đỏ + Chăn gối | Khau nhục | Các ngưỡng bảo hộ khác nhau; vẫn chết nếu bị dồn một hit đủ lớn. |
| Chống đội nhiều chậm | Máy pha cà phê + Quần sịp đỏ | Rau má | Một cửa thoát chậm và tốc độ; miễn chậm ngắn, không vô hiệu hóa đội khống chế cả round. |

Không có buff bộ đồ ẩn. Bất kỳ nhân vật nào cũng mang được; các món hỗ trợ Super không được giới hạn cho pháp sư. Các phối đồ trên là tình huống thử nghiệm, chưa khẳng định mạnh nhất.

## 5. Hiển thị để người chơi hiểu

Mỗi thẻ shop có tên món, icon, loại ô, bậc, giá và hai dòng mô tả hiệu ứng. Tooltip ghi rõ một lần mỗi round hoặc hồi kích hoạt. Không bắt người chơi tự hiểu charge/superPower: dùng chữ **“hiệu suất nạp Super”** và **“sức mạnh Super”**, còn công thức nằm ở phần chi tiết.

Trong trận: Máy chấm công hiện “TÍCH!” ở đúng mốc; Chăn gối bật gối bông; Nami lóe tia sét ở vũ khí khi có lượt điện; PC hiện “TĂNG FPS”; Tủ lạnh thổi luồng lạnh; Quần sịp đỏ hiện ngôi sao đỏ. Không thay mặt/avatar nhân vật. Đồ ăn hiển thị icon nhỏ cạnh loadout, không bay dày kín sân.

Các món có số lượt giới hạn hiện số lượt còn lại khi xem chi tiết nhân vật. Khi đang xem replay, UI đọc từ state thay vì tự chạy timer theo đồng hồ máy. Giảm hiệu ứng vẫn giữ icon buff/debuff, không cần phát câu thoại mỗi lần kích hoạt.

## 6. Phạm vi triển khai sau khi duyệt

Danh mục hiện tại chỉ hỗ trợ modifier chỉ số. Máy pha cà phê, Xôi, Bánh mì, Cơm thợ xây, Bún vịt và Vịt quay có thể đi qua stat pipeline; các món còn lại cần hook theo tick, Super, đánh trúng, va chạm, ngưỡng HP hoặc nhận chậm. Chưa được quảng cáo những hook này là đã chạy trong game.

Cần ID vật phẩm ổn định, thay đổi validator/shop theo loại ô, trạng thái hiệu ứng có serialize/checkpoint, lớp khiên hết hạn và modifier tạm không ghi vào baseline. Khi đổi luật phải bump phiên bản engine/replay tương ứng. Không tự chuyển đồ cũ thành món mới chỉ theo vị trí trong mảng ITEMS.

Kiểm tra trước phát hành: mốc 10 giây trùng tăng nhịp và chấm công; nạp Super đã đầy; một hit chết người; nhiều hit cùng tick; buff hết hạn sau khi tăng nhịp; hồi khi đầy máu; tủ lạnh va trong ba solver pass; nhiều đạn trúng cùng tick; nguồn DoT chết; trần speed/cooldown; giữ hash khi khôi phục; đồ ăn chỉ tiêu một lần khi kết toán; reset sạch sang round mới. Chạy thêm đội nhiều hồi/khiên để kiểm tra thời lượng sau bo cuối.

**Cần duyệt:** hướng 7 phụ kiện + 12 tiêu hao, hiệu ứng từng món và việc thay danh mục phụ kiện/đồ ăn cũ. Giá, hệ số và phân bậc có thể tinh chỉnh sau thử nhiều seed.

## Gameplay v10 — shop và Bàn cờ tướng

Shop có 5 ô, mỗi ô độc lập có 52% cơ hội ra nhân vật và 48% ra vật phẩm. Reroll tốn 2G (hoặc dùng lượt reroll miễn phí khi comeback). Nhân vật T1/T2 giá 3G/4G; vật phẩm giữ giá hiện có. Nhân vật mua được đưa vào bench năm ô. Túi vật phẩm giữ tối đa tám món.

### item_20 — Bàn cờ tướng

- **Slot / rarity / giá:** Phụ kiện · Sử thi · 16G.
- **Hiệu ứng:** +12 khiên đầu trận.
- **Hợp cạ — Khai Cuộc Vườn Hồng (Hoàng Tử Ngậm Hoa):** thêm 8 khiên đầu trận; mỗi Super cấp 8 khiên trong 3 giây cho đồng minh yếu máu nhất trong tầm 240.
- **Hình:** sprite SVG riêng vẽ bàn cờ có quân tướng và nhánh hoa hồng. Mỗi vật phẩm catalog có icon vector riêng trong `apps/web/src/GameCatalog.tsx`.

Hiệu ứng trong trận chạy ở `character-combat.ts`, chỉ khi item được trang bị cho Hoàng Tử. Mục tiêu là đồng minh còn sống có phần trăm HP thấp nhất trong tầm 240; có thể chọn chính Hoàng Tử. Khiên tuân theo trần 100 và thời hạn của hệ thống shield hiện hành.
