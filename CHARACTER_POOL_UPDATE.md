# Cập nhật pool 20 nhân vật và hội bạn

Lịch sử cập nhật pool đã tích hợp từ engine `chaos-integer-v9`. Gameplay hiện hành chạy `chaos-integer-v10`, protocol 4, có 20 nhân vật và 20 vật phẩm. Catalog hiện hành ở `packages/shared/src/catalog-data.json`.

## Hoàng Tử Ngậm Hoa — char_20

Ảnh nguồn do người dùng cung cấp, sao chép nguyên bản vào `apps/web/public/avatars/char_20.png`. Không sửa gương mặt.

- **Class / race / tier:** Hỗ trợ · Người Phố Hội · T2.
- **Vũ khí:** Kiếm Hồng Tặng Bạn · Kiếm · T2. Cành hồng có gai làm lưỡi kiếm, bông hồng đỏ ở chuôi.
- **Chỉ số gốc:** 210 HP, 15 ATK, 4 giáp, 470 tốc độ.
- **Nội tại — Nháy Mắt Lấy Đà:** mỗi đòn thường thứ tư trúng địch cấp bản thân 12 khiên trong 2 giây.
- **Chiêu tự động — Hoa Gửi Đúng Người:** mỗi 7 giây chọn đồng minh thấp % HP nhất trong 240, gồm bản thân; cấp 20 khiên trong 3 giây và xóa chậm. Level 5 tăng khiên lên 26.
- **Super — Vườn Hồng Không Drama:** vùng bán kính 150 đi theo bản thân trong 4 giây. Mỗi giây gây 30% ATK lên địch và hồi 4 HP cho đồng minh; địch trong vùng chậm 20%. Damage/heal chịu hệ số sức mạnh Super.
- **Đánh đổi:** ít máu/giáp, cần đứng gần đồng đội. Bàn cờ tướng (item_20) là món chữ ký; item cho 12 khiên đầu trận và khi hợp cạ thêm 8 khiên cùng hiệu ứng tiếp khi tung Super.
- **Cặp P13 — Hoa Hồng Và Vitamin:** cùng Mâm Quả, khi Hoa Gửi Đúng Người cấp khiên cho Mâm Quả thì đòn thường tiếp theo của Mâm Quả thêm 25% ATK trong 3 giây. Giới hạn 3 lần/round, hồi 8 giây, tầm cặp 240.
- **Bộ T09 — Vũ Hội Ngậm Hoa:** Hoàng Tử + Đùi Gió Lốc + Sói Suy Tư. Hoàng Tử tung Super cấp cả ba 15 khiên trong 3 giây. Giới hạn 2 lần/round, hồi 12 giây, khoảng cách tối đa 280.

## Courage Nhút Nhát

Đổi tên hiển thị thành Courage Nhút Nhát, giữ cơ chế gốc, sửa phần nhận diện thành **chú chó hồng nhút nhát lấy cảm hứng từ Courage — Chú chó nhút nhát**, tai đen dài và thân có đốm đen. Race đổi Linh Vật → Thú Nhân. Vũ khí đổi Râu Bọ → **Găng Chân Run Rẩy**. Nội tại đổi tên thành **Sợ Nhưng Vẫn Cứu Bạn**, giữ điều kiện mất 40 HP, tăng tốc 15% trong 1 giây, hồi 4 giây. Không còn mô tả côn trùng hoặc vũ khí râu trong catalog chạy thật.

Race Linh Vật giờ chỉ có Bé Ôm nên chưa có mốc hai nhân vật khác nhau. Race Thú Nhân có Hổ, Bọ/Courage, Sói và Hiệp Sĩ; người chơi có thể chọn bất kỳ 2/3 người khác nhau cho đặc tính race, còn bộ liên kết mang tên vẫn yêu cầu đúng thành viên.

## Mười ba hội bạn

Tất cả hội, đặc tính class/race và liên kết đôi/bộ ba đủ điều kiện đều tự kích hoạt cùng lúc. Mốc 2/3 tính số CharacterId khác nhau đang sống trong đội cùng chủ; không cần đủ toàn bộ danh sách dài. Bản sao không tăng mốc. Mất người tự hạ mốc; không chuyển sang hội khác giữa round. Mỗi hội/liên kết có lượt proc và hồi chiêu riêng; trạng thái được lưu checkpoint và reset ở round mới.

| Hội | Thành viên chính xác | Mốc 2 | Mốc 3 |
|---|---|---|---|
| Mấy đứa 2k4 | Hổ, Kính Cận, Đội Trưởng, Bọ/Courage, Cờ Con, Kiếm Khách, Hộp Quà, Anh Tết, Nồi Lẩu, Cô Khui Tết | +4% tốc độ cho thành viên hội. | +6% tốc độ; tại giây 10/20 mỗi người còn sống nhận 4 năng lượng. |
| The RiseOn Couple | Hổ, Cô Khui Tết | Hổ dùng Gầm hoặc Cô dùng Lì Xì cấp người kia 10 khiên/2 giây; 3 lần/round, hồi 8 giây, tầm 240. | Không có, đây là hội hai người. |
| Hoàng tử 34 | Bé Ôm, Lốp | Ôm hoặc tông trúng địch cấp cả hai 8 khiên và +8% tốc độ/2 giây; 3 lần/round, hồi 8 giây, tầm 240. | Không có, đây là hội hai người. |
| The ABI | Tím Mọng, Lốp, Hiệp Sĩ | +1 giáp. | +2 giáp; giây 20 cấp 10 khiên/người trong 5 giây, một lần/round. |
| Tít và Mít | Đùi Gió, Đội Trưởng, Anh Tết | +4% tốc độ; Super cấp người còn lại 4 năng lượng. | +6% tốc độ; Super cấp hai người còn lại 8 năng lượng/người. |
| Người miền núi chất | Đội Trưởng, Bọ/Courage, Sếp, Anh Tết, Nồi Lẩu | +10 sức mạnh Super; Super đầu cấp 8 khiên/người trong 3 giây. | +15 sức mạnh Super; khiên tăng thành 12/người. |
| Tiểu vương quốc 36 | Hoàng Tử Ngậm Hoa, Sói, Cờ Con, Mâm Quả | +3 điểm % crit; khi một người sống xuống ≤40% HP sau hit, hồi 6 HP/người trong tầm 280. | +5 điểm % crit; hồi tăng thành 8 HP/người. |
| Imposter | Kính Cận, Courage, Lốp, Nồi Lẩu | Diễn Sâu: khi một thành viên tung Super, cả hội nhận +8% ATK trong 3 giây. | Diễn Sâu tăng thành +12% ATK trong 3 giây. |
| Ạt tít | Họa Sĩ, Cô Khui Tết | Nét Vẽ Lì Xì: một người tung Super, người còn lại nhận 16 khiên trong 3 giây và 4 năng lượng. | Hội có đúng 2 người, không có mốc 3. |
| Cốt đơ | 16 người: trừ Sếp, Hộp Quà, Họa Sĩ, Cô Khui Tết | Code Chạy Rồi: ở giây 10 và 20, mỗi thành viên đang sống nhận 3 năng lượng. | Năng lượng ở mỗi mốc tăng thành 5/người. |
| Full Combo | Hộp Quà + Ạt tít và/hoặc Cốt đơ; Sếp không thuộc hội | Ghép Đôi Vá Nóng: Hộp Quà tung Super, đồng đội Ạt tít nhận 18 khiên và +8% tốc độ trong 3 giây; đồng đội Cốt đơ nhận 6 năng lượng và +10% tốc độ đánh trong 3 giây. Nếu có hai người cùng hội thì mỗi người nhận hiệu ứng ghép đôi tương ứng. | Full Combo chỉ bật khi cả ba còn sống: Hộp Quà + 1 người Ạt tít + 1 người Cốt đơ. Hộp Quà tung Super cấp cả hai đồng đội 24 khiên, 6 năng lượng và +15% tốc độ đánh trong 3 giây, thay hiệu ứng ghép đôi. |
| Tất cả quỳ xuống | Sếp + bất kỳ người khác trừ Anh Tím Mọng và Hiệp Sĩ Gâu Gâu | Sếp Đã Chỉ Đạo: Sếp đánh trúng bằng Mời Vào Họp hoặc tung Super, đồng đội được +8% ATK và +10% tốc độ đánh trong 3 giây. | Hai đồng đội được +12% ATK và +15% tốc độ đánh trong 3 giây. |
| Anh có ý tưởng | Anh Tím Mọng hoặc Hiệp Sĩ Gâu Gâu + người khác bất kỳ | Tôi Có Ý Này!: Anh Tím Mọng hoặc Hiệp Sĩ Gâu Gâu tung Super, đồng đội còn lại nhận 4 năng lượng và +8% ATK trong 3 giây. Ý tưởng vừa lóe, cả đội bớt đứng ngơ! | Chốt Ý Tưởng: người tung ý tưởng cấp hai đồng đội 6 năng lượng và +12% ATK trong 3 giây. |

- **Imposter:** 2 lần/round, hồi chung 12 giây; các thành viên sống cách nhau ≤280.
- **Ạt tít:** 2 lần/round, hồi chung 12 giây; cả hai sống và cách nhau ≤280.
- **Cốt đơ:** 2 mốc/round; không cần đứng gần. Không gồm Sếp, Hộp Quà và hai thành viên Ạt tít.
- **Full Combo:** Bắt buộc Hộp Quà còn sống cùng ít nhất một người Ạt tít hoặc Cốt đơ. 2 lần/round, hồi chung 12 giây; các thành viên sống cách nhau ≤280. Hộp Quà không tự nhận. Thiếu một nhánh thì dùng Ghép Đôi, Sếp không thuộc hội.
- **Tất cả quỳ xuống:** Bắt buộc Sếp Chốt Đơn còn sống cùng ít nhất một nhân vật khác. 2 lần/round, hồi chung 12 giây; các thành viên sống cách nhau ≤280. Sếp không tự nhận hiệu ứng. Anh Tím Mọng và Hiệp Sĩ Gâu Gâu không thuộc hội, không được hưởng và không tăng mốc.
- **Anh có ý tưởng:** Cần ít nhất một Anh Tím Mọng hoặc Hiệp Sĩ Gâu Gâu còn sống cùng một nhân vật khác nhau bất kỳ. Chỉ hai người này khởi xướng; 2 lần/round, hồi chung 12 giây, mọi thành viên sống cách nhau ≤280. Hai người cùng góp mặt vẫn dùng chung lượt/hồi. Người tung không tự nhận.

Mốc Full Combo kiểm tra đủ ba vai trò đang sống, không chỉ đếm ba người. Mất nhánh Ạt tít/Cốt đơ thì hạ về hiệu ứng Ghép Đôi, mất Hộp Quà thì ngừng kích hoạt. Hội Sếp cần Sếp còn sống; Anh có ý tưởng cần ít nhất một trong hai người khởi xướng còn sống. Buff đã cấp giữ đến hết hạn. Bản sao không tăng mốc, mọi hội đủ điều kiện tự bật cho cả đội.

Tít và Mít nạp tối đa hai lần/round, hồi 12 giây, cả nhóm sống trong khoảng cách 280. Miền núi chỉ cấp khiên một lần/round khi các thành viên sống cách nhau ≤280. Hội 36 hồi tối đa hai lần/round, hồi 12 giây và không cứu hit chết người. Chỉ số tĩnh và mốc thời gian của 2k4/ABI không yêu cầu đứng gần.

Chỉ thành viên của hội nhận thưởng, người thứ ba ngoài hội không được hưởng. Bonus chỉ số từ các nguồn phối hợp cộng số phần trăm; khiên chung trần 100, năng lượng cộng dồn trong tick đến tối đa 100. Mỗi hội/liên kết có lượt và hồi chiêu riêng. Không kích dây chuyền từ heal/khiên phụ.

## Hình vũ khí

Đã gen một atlas nền trong suốt 5 cột × 4 hàng, thứ tự char_01 → char_20. Lưu tại `apps/web/public/weapons/weapon-atlas-v2.png`. Ảnh 1402×1122, có alpha thật. UI dùng SVG viewBox theo khung alpha, Pixi dùng cùng Texture frame để vũ khí quay cùng hướng đánh, không thay hitbox. Không sửa avatar để dán vũ khí vào ảnh gốc.

Dùng built-in **imagegen**. Prompt và nguồn ảnh được lưu tại [WEAPON_ART_PROMPT.md](WEAPON_ART_PROMPT.md). Vũ khí hiển thị trong thẻ nhân vật, hồ sơ và trận; chế độ giảm hiệu ứng vẫn giữ vũ khí và vùng kỹ năng cần thiết.
