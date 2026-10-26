# Bộ chiến đấu v26 — 26/10/2026

Source release: 2026.10.26.2. Engine: chaos-integer-v26. Tạo trận mới; checkpoint engine cũ bị từ chối rõ ràng.

## Kiến trúc

- CharacterKit là dữ liệu cơ chế, kiểu đòn và hai hướng tăng trưởng, độc lập với class/race. 33 card cũ và ba dạng biến hình giữ nguyên ID, class, race và cách biến hình bằng trang bị.
- KitCombatServices cung cấp damage/normal/heal/shield/buff. Lớp kit xử lý đạn, vùng và construct; lớp combat chung giữ giáp, khiên, crit, trang bị, hợp cạ và liên kết.
- Đã bỏ bộ kỹ năng tự động mỗi 7 giây và nội tại cũ thay thế bởi normal/Super mới. Hợp cạ dùng trigger kỹ năng được chuyển sang Super, giữ hồi và giới hạn lượt. Các liên kết cũ vẫn kích hoạt từ Super.
- Mỗi 300 tick sống sót tăng đúng hai trục ghi bên dưới, tối đa 12 tầng; tính từ baseline, không nhân lũy tiến. Bảng tăng trưởng tính sẵn, không tạo object cho mỗi lần đọc trong tick.
- Replay lưu construct có HP, loại/kích thước đạn, trạng thái và chỉ số hiển thị; checkpoint lưu đầy đủ số lần nảy, mục tiêu homing, cổ phiếu và cooldown.

## Trạng thái và quy tắc cân bằng

| Hiệu ứng | Quy tắc |
|---|---|
| Hướng Nội | Chỉ Hổ tự áp: giảm 25% sát thương trực tiếp, hồi 1% HP gốc/giây; giảm 15% di chuyển. Không giảm Damage gây ra. |
| Tiểu Đường | Giảm 35% hồi phục; không cộng tầng. |
| Cận Thị | Giảm 30% tầm tìm mục tiêu bắn thường; không giảm reach cận chiến. |
| Bleeding | Mất HP theo tick chỉ khi có di chuyển thực tế; không cộng tầng. |
| Choáng | Khóa đòn và Super khoảng 0,5 giây; thân vẫn trôi. Tối đa 18 tick, chống nối 60 tick từ lần áp. |
| Áp lực | Giảm 20% Damage gây ra, dùng cho deadline; không áp Hướng Nội lên người khác. |
| Phóng xạ | Tối đa 3 tầng dùng chung từ mọi nguồn; 2 HP/giây/tầng, giảm hồi phục 8%/tầng. |
| Burn / Poison | Burn lấy bản mạnh nhất; Poison tối đa 5 tầng có hạn riêng. DoT không chạy lại proc vật phẩm và không cấp điểm hạ gục đồng đội. |
| Frozen / Paralyzed | Frozen giảm di chuyển; Paralyzed giảm nhịp đánh/xoay, không khóa vật lý. |
| Blessing / Rage | Hồi HP theo tick / tăng Damage. Bản mạnh nhất thắng; không cộng vô hạn. |

Mỗi hiệu ứng có trần và hạn riêng trong STATUS_RULES. Giảm hồi phục tổng hợp có sàn 35%; hồi trực tiếp giảm thêm ở cuối trận. DoT giới hạn theo HP gốc. Không hồi sinh từ heal/boomerang.

## Lifetime sau khi chủ chết

Đạn, vùng hiệu ứng, trụ và đệ đã tạo tiếp tục hoạt động khi chủ chết; vẫn gây sát thương, áp trạng thái, hồi HP đồng minh còn sống và được ghi nhận hạ gục sau khi chết. Không hồi sinh chủ. Chỉ số tăng trưởng của hiệu ứng được giữ ở thời điểm chủ chết; chủ chết không tiếp tục đánh/cast hay tự gọi đệ mới. Trận vẫn tính đội sống từ nhân vật chiến đấu, không từ construct. Va chạm, phá hủy và thời hạn riêng vẫn kết thúc thực thể bình thường.

Hộp Quà tự gọi đệ nhỏ mỗi 120 tick (4 giây), không cần đòn trúng; tối đa hai đệ nhỏ. Super gọi một đệ lớn. Ngân sách đệ nhỏ: HP bằng 6% HP gốc nhưng tối thiểu 20, Damage 15% ATK gốc. Đệ lớn: 45% HP và 50% ATK gốc; trụ: 35% HP và 45% ATK gốc. Đệ nhỏ/lớn sống 10 giây, trụ sống 8 giây; HP/Damage của đệ chụp từ tăng trưởng lúc triệu hồi.

## Giới hạn thực thể

- Tối đa 240 đạn toàn trận; 12 bóng bay/chủ, hai boomerang/chủ, 18 đạn thường khác/chủ. Khi hết chỗ không tiêu hao Super hoặc hồi bắn.
- Tối đa 64 construct toàn trận. Mỗi chủ: hai đệ nhỏ, một đệ khổng lồ, một trụ. Có HP, bị phá bằng đạn/vũ khí/vùng; tiếp tục hoạt động sau khi chủ chết tới hết lifetime hoặc bị phá, không tính là nhân vật sống để kéo round.
- Tối đa 120 vùng toàn trận. Cờ/dép thường ba vùng; hoa thường bốn; vườn hoa sáu; Super mâm quả tám; deadline năm; paint/soup/vortex/đại trận một. Hết giới hạn cùng loại thay vùng cũ.
- Vùng trùng cùng chủ/loại không nhân tick sát thương/hồi HP. Hiệu ứng vùng được refresh liên tục; sát thương/hồi có cửa sổ riêng.
- Khiên tổng tối đa 100. Lốp tăng số lớp được tạo từ 1 lên 4; mỗi lớp 4% HP gốc, hồi proc 1 giây. Khiên vật lý Hiệp Sĩ tăng kích thước, không tăng số lớp.
- Kiếm/khiên Hiệp Sĩ và dĩa/gà Sóc Jake ở hai phía. Khiên gây 40%, gà gây 50% Damage để bù lợi thế hai vũ khí.
- Ủn Đại Ca: Super phát nổ khi trúng/va tường/hết hạn, phủ toàn bản đồ; 220% Damage trong 130, 80% ngoài tâm, nhân superPower. Chủ và đồng đội nhận 50% tương ứng và vẫn dính Phóng xạ/Burn. Hitbox không tự kích nổ ở nòng. Có vòng nổ và flash nhẹ toàn sân.
- Siêu Chiến Binh Wacom: đạn thường 60% Damage, hồi bắn nhân 1,3; Super tám phát 28% cách chín tick, tạm ngừng bắn thường đến hết chuỗi. Giữ đạn nhanh/nảy và không sát thương phe mình.
- Cổ phiếu: tài sản 0–300, chỉ lợi nhuận mới tạo thêm khiên, lỗ trừ HP thật xuyên khiên. Không tái cấp khiên mất từ tài sản cũ. Super bốn nhịp có lời.

## Toàn bộ bộ chiến đấu

### Hổ Hướng Nội (char_01)

- Đòn thường: Đòn thường có 20% vào Hướng Nội trong 2 giây: giảm 25% sát thương nhận, hồi 1% HP/giây, đổi lại giảm 15% di chuyển. Chỉ Hổ tự nhận hiệu ứng này.
- Super: Vồ về phía địch; đòn chạm đầu tiên gây 180% Damage và chắc chắn Hướng Nội. Không dịch chuyển tức thời.
- Tăng trưởng: Mỗi 10 giây sống sót: tỉ lệ hiệu ứng +2 điểm %; Damage +8% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Bé Ôm Bão (char_02)

- Đòn thường: Đòn thường có 20% gây Tiểu Đường trong 3 giây, giảm 35% hồi phục.
- Super: Tăng 100% tốc độ xoay trong 3 giây; mọi đòn thường trúng trong thời gian này chắc chắn gây Tiểu Đường.
- Tăng trưởng: Mỗi 10 giây sống sót: tỉ lệ hiệu ứng +2 điểm %; Damage +8% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Anh Tím Mọng (char_03)

- Đòn thường: Ném quả theo hướng vũ khí; quả có một lần nảy tường, tối đa 5 lần theo tăng trưởng. Sau nảy có thể trúng lại nhưng mỗi mục tiêu có hồi trúng 0,4 giây.
- Super: Ném rổ quả lớn: đạn nảy, nổ bán kính 90 khi trúng, gây 160% Damage cho mục tiêu chính và 60% cho địch xung quanh.
- Tăng trưởng: Mỗi 10 giây sống sót: thêm 1 lần nảy mỗi 3 tầng, tối đa 5; Damage +8% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Đùi Gió Lốc (char_04)

- Đòn thường: Đòn cận chiến có lực đẩy cao, tăng theo thời gian. Impulse giảm dần, bị giới hạn và chặn bởi tường.
- Super: Xoay nhanh trong 3 giây, tăng lực đẩy lên trần; vẫn có hồi đòn và nhận sát thương bình thường.
- Tăng trưởng: Mỗi 10 giây sống sót: lực đẩy +8% gốc; Damage +8% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Kính Cận Bắt Bài (char_05)

- Đòn thường: Bắn đạn có 20% gây Cận Thị trong 3 giây, giảm 30% tầm bắn. Không đổi tầm vũ khí cận chiến.
- Super: Đặt một trụ súng có HP, tồn tại 8 giây, bắn địch gần nhất trong 220. Tối đa một trụ mỗi chủ; trụ có thể bị phá.
- Tăng trưởng: Mỗi 10 giây sống sót: tỉ lệ hiệu ứng +2 điểm %; Damage +8% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Đội Trưởng Sắc Màu (char_06)

- Đòn thường: Bắn dải màu xuyên tối đa ba nhân vật: đồng đội nhận Rage nhẹ, địch nhận Frozen và sát thương. Dải dài dần và tạo nhanh dần.
- Super: Bắn tia cầu vồng rộng trong tầm 320; đồng đội trên tia nhận Rage/Blessing, kẻ địch chịu 180% Damage.
- Tăng trưởng: Mỗi 10 giây sống sót: độ dài dải màu +5% gốc; tốc độ đánh/tạo vùng +5% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Courage Nhút Nhát (char_07)

- Đòn thường: Khi nhận đòn trực tiếp có 18% né và chạy ngược nguồn đánh trong 1,5 giây; né thành công có hồi 1,5 giây, không né DoT đã gắn.
- Super: Hét trong bán kính 150: Choáng 0,5 giây và Paralyzed 25% trong 2 giây. Choáng có cửa sổ chống nối liên tục.
- Tăng trưởng: Mỗi 10 giây sống sót: tỉ lệ hiệu ứng +2 điểm %; di chuyển +4% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Sói Suy Tư (char_08)

- Đòn thường: Đòn thường có 20% gây Bleeding trong 3 giây; nạn nhân mất HP khi thực sự di chuyển, không cộng tầng.
- Super: Trăng máu trong 4 giây: +30% Damage, +20% di chuyển và xoay; đổi lại nhận thêm 20% sát thương trực tiếp.
- Tăng trưởng: Mỗi 10 giây sống sót: tỉ lệ hiệu ứng +2 điểm %; Damage +8% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Sếp Chốt Đơn (char_09)

- Đòn thường: Ném deadline, 20% gây Paralyzed 25% trong 2 giây.
- Super: Rải năm vùng deadline tồn tại 4 giây. Tất cả người khác, kể cả đồng đội, chạm vùng sẽ chịu sát thương, Paralyzed và Áp lực giảm 20% Damage. Không dùng Hướng Nội của Hổ.
- Tăng trưởng: Mỗi 10 giây sống sót: tỉ lệ hiệu ứng +2 điểm %; tốc độ đánh/tạo vùng +5% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Lốp Lăn Ăn Vặt (char_10)

- Đòn thường: Đòn thường có 25% tạo khiên mỏng 4% HP, tồn tại 2 giây; có hồi kích hoạt 1 giây.
- Super: Lăn lao nhanh trong 2,5 giây và đẩy người chạm phải; vẫn nhận đầy đủ sát thương, không có bất tử.
- Tăng trưởng: Mỗi 10 giây sống sót: thêm 1 lớp khiên mỗi 4 tầng, tối đa 4 lớp; Damage +8% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Cờ Con Cổ Vũ (char_11)

- Đòn thường: Đánh cận chiến và tự đặt cờ mỗi 4 giây: vùng cờ buff Rage/hồi HP cho đồng đội, Frozen cho địch. Tối đa ba cờ, không nhân chồng cùng loại.
- Super: Cổ vũ tất cả đồng đội trong 3 giây; địch trong 180 nhận Áp lực và Paralyzed.
- Tăng trưởng: Mỗi 10 giây sống sót: tốc độ đánh/tạo vùng +5% gốc; thời gian tồn tại vùng +5% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Kiếm Khách Mượn Vai (char_12)

- Đòn thường: Cận chiến, xoay cơ sở nhanh hơn 35%. Tốc độ xoay và Damage tăng theo thời gian.
- Super: Trong 2,5 giây xoay rất nhanh và lao về phía địch; không tự miễn sát thương hay vượt tường.
- Tăng trưởng: Mỗi 10 giây sống sót: tốc độ xoay +5% gốc; Damage +8% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Mâm Quả Chủ Tịch (char_13)

- Đòn thường: Ném hoa quả: trúng đồng đội cấp Blessing/Rage nhẹ; trúng địch gây Damage và Tiểu Đường. Tốc độ ném và bay tăng dần.
- Super: Rải tám quả quanh sân gần bản thân, tạo vùng tiếp tế ngắn hạn buff đồng đội và debuff địch.
- Tăng trưởng: Mỗi 10 giây sống sót: tốc độ đánh/tạo vùng +5% gốc; tốc độ bay +5% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Hộp Quà Nghiêm Túc (char_14)

- Đòn thường: Đánh cận chiến; tự gọi một đệ nhỏ mỗi 4 giây dù không tấn công. Tối đa hai đệ nhỏ, có HP và bị phá được.
- Super: Gọi một đệ khổng lồ tồn tại 10 giây, có HP và Damage riêng. Đệ tiếp tục hoạt động sau khi chủ chết đến hết lifetime hoặc bị phá; không tính là nhân vật sống để kéo dài round.
- Tăng trưởng: Mỗi 10 giây sống sót: HP đệ +5% gốc; Damage đệ +8% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Hiệp Sĩ Gâu Gâu (char_15)

- Đòn thường: Cầm kiếm và khiên ở hai phía. Khiên có hitbox chặn đạn trực diện, kích thước tăng dần; cú đánh của khiên chỉ gây 40% Damage.
- Super: Ném tám mảnh xương/kiếm/khiên ra xung quanh, gây sát thương và đẩy lùi; vẫn có thể né hoặc chặn.
- Tăng trưởng: Mỗi 10 giây sống sót: độ lớn khiên +5% gốc; Damage +8% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Họa Sĩ Chạy Deadline (char_16)

- Đòn thường: Bắn mực có 20% gây Frozen 25% trong 2 giây.
- Super: Đặt vũng mực lớn bán kính 160, báo trước 0,5 giây, tồn tại 4 giây; gây Damage mỗi giây và Frozen.
- Tăng trưởng: Mỗi 10 giây sống sót: tỉ lệ hiệu ứng +2 điểm %; tốc độ đánh/tạo vùng +5% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Anh Tết Ship Nhanh (char_17)

- Đòn thường: Cận chiến nhanh, tốc độ di chuyển và xoay tăng theo thời gian.
- Super: Giao hàng siêu tốc trong 2 giây: tăng tốc mạnh và né tất cả đòn trực tiếp. DoT đã gắn vẫn chạy; không xuyên tường.
- Tăng trưởng: Mỗi 10 giây sống sót: di chuyển +4% gốc; tốc độ xoay +5% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Ông Hoàng Nồi Lẩu (char_18)

- Đòn thường: Thân lớn hơn thường, đòn cận chiến có 25% gây Burn trong 3 giây.
- Super: Vùng lẩu nóng đi theo chủ trong 4 giây: địch chịu Damage/Burn mỗi giây; chủ hồi nhẹ, đồng đội không nhận phần hồi này.
- Tăng trưởng: Mỗi 10 giây sống sót: tỉ lệ hiệu ứng +2 điểm %; Damage +8% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Cô Nàng Khui Tết (char_19)

- Đòn thường: Chạm đồng đội trao Rage/Blessing; chạm địch gây debuff ngẫu nhiên. Mỗi cặp có hồi trao lì xì 1 giây.
- Super: Ném tám lì xì hiệu ứng: đồng đội nhận buff, địch nhận Damage và debuff. Không áp Hướng Nội lên nhân vật khác.
- Tăng trưởng: Mỗi 10 giây sống sót: di chuyển +4% gốc; tốc độ xoay +5% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Hoàng Tử Ngậm Hoa (char_20)

- Đòn thường: Hoa hồng dừng khi chạm tường hoặc nhân vật và cắm xuống đất, tạo vùng nhỏ Rage/hồi HP cho đồng đội, Frozen cho địch. Tối đa bốn hoa.
- Super: Tạo vườn sáu hoa quanh mục tiêu; các vùng trùng không nhân chồng buff hoặc tick Damage.
- Tăng trưởng: Mỗi 10 giây sống sót: tốc độ đánh/tạo vùng +5% gốc; thời gian tồn tại vùng +5% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Độ Duy Môn (char_21)

- Đòn thường: Bắn pháo không khí theo hướng vũ khí, lực đẩy cao và tăng dần cùng Damage.
- Super: Bắn tám hướng và tự tạo khiên 12% HP tối đa; pháo có lực đẩy mạnh.
- Tăng trưởng: Mỗi 10 giây sống sót: lực đẩy +8% gốc; Damage +8% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Đẳng Cấp Aura (char_22)

- Đòn thường: Cận chiến và phát aura cho đồng đội khác trong 160; buff Damage cơ sở 12%, hiệu lực và bán kính tăng dần. Nhiều aura cùng loại lấy mạnh nhất.
- Super: Aura tuôn trào: tất cả đồng đội nhận Rage mạnh, tăng nhịp và Blessing trong 3 giây. Không hồi sinh.
- Tăng trưởng: Mỗi 10 giây sống sót: hiệu lực buff +4% gốc; vùng aura +4% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### King Of RiseOn (char_23)

- Đòn thường: Kiếm xoay có 15% lướt qua va chạm vũ khí; không đồng nghĩa bỏ qua giáp/khiên. Tầm kiếm và Damage tăng dần.
- Super: Kiếm khổng lồ trong 4 giây, chắc chắn bỏ qua va chạm vũ khí; vẫn nhận sát thương từ đòn đánh vào thân.
- Tăng trưởng: Mỗi 10 giây sống sót: kích thước vũ khí +3% gốc; Damage +8% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Thi Thánh Họ Mai (char_24)

- Đòn thường: Bắn nét mực có 10% gắn một debuff ngẫu nhiên hợp lệ. Tỉ lệ và tốc độ bắn tăng dần.
- Super: Bắn mười hai nét mực tỏa quanh người; mỗi nét có tỉ lệ gắn debuff. Không dùng Hướng Nội và không khóa liên tục.
- Tăng trưởng: Mỗi 10 giây sống sót: tỉ lệ hiệu ứng +2 điểm %; tốc độ đánh/tạo vùng +5% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Công Tử Phú Thọ (char_25)

- Đòn thường: Cận chiến, giao dịch định kỳ: lợi nhuận thêm máu ảo theo tài sản, thua lỗ trừ trực tiếp HP thật. Không tự hoàn lại khiên đã bị đánh mất.
- Super: Trong 4 giây có bốn nhịp giao dịch chắc chắn sinh lời và nhận Rage; máu ảo vẫn có trần.
- Tăng trưởng: Mỗi 10 giây sống sót: biên độ cổ phiếu +5% gốc; tốc độ giao dịch +5% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Anh Fam De Phonk (char_26)

- Đòn thường: Cận chiến, nhẹ nhàng bẻ hướng về địch gần nhất, đòn trúng tạo luồng gió đẩy lùi.
- Super: Đặt lốc lớn trong 4 giây: kéo địch về tâm và gây sát thương mỗi giây; lực hút có trần.
- Tăng trưởng: Mỗi 10 giây sống sót: di chuyển +4% gốc; Damage +8% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Robot Da Đỏ (char_27)

- Đòn thường: Mỗi đòn trúng đều gây Burn nhẹ; 20% thiêu đốt mạnh hơn. Tăng trưởng nâng tỉ lệ đốt mạnh, không cộng tầng Burn.
- Super: Cháy bỏng 4 giây: tăng Damage, di chuyển và nhịp đánh, đồng thời tự chịu Burn.
- Tăng trưởng: Mỗi 10 giây sống sót: tỉ lệ hiệu ứng +2 điểm %; Damage +8% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Người Máy Sịp Đỏ Phế Thải (char_28)

- Đòn thường: Đánh cận chiến, có 15% tự mất HP bằng 20% Damage cơ sở. Tỉ lệ tự đánh giảm dần, không kích hoạt chuỗi proc.
- Super: Bắn laser đỏ thẳng trong 300, gây 200% Damage; tự chịu Burn trong 3 giây.
- Tăng trưởng: Mỗi 10 giây sống sót: giảm tỉ lệ tự đánh: hệ số rủi ro giảm 6% gốc; Damage +8% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Wacom Hỏng Hóc (char_29)

- Đòn thường: Đạn thường chỉ gây 55% Damage, đồng đội trên đường đạn vẫn chịu 35% sát thương đạn. Sát thương đồng đội giảm dần theo tăng trưởng.
- Super: Bắn chuỗi tám phát, mỗi phát có 12% bật ngược về bản thân; không bắn xuyên mọi mục tiêu.
- Tăng trưởng: Mỗi 10 giây sống sót: giảm Damage đồng đội: hệ số rủi ro giảm 6% gốc; Damage +8% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Chó Bóng Bay (char_30)

- Đòn thường: Thả bóng bay nổ sau 3 giây hoặc khi nhân vật chạm vào sau lúc lên ngòi. Vụ nổ gây sát thương cả chủ và đồng đội, tăng rủi ro theo thời gian.
- Super: Thả tám bóng lớn; vụ nổ vẫn gây sát thương chủ/đồng đội. Mỗi chủ có giới hạn số bóng đang hoạt động.
- Tăng trưởng: Mỗi 10 giây sống sót: sát thương chủ/đồng đội +5% gốc; Damage +8% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Ủn Đại Ca (char_31)

- Đòn thường: Bắn tên lửa mini, 20% gây Phóng xạ; tối đa 3 tầng, gây DoT và giảm hồi phục tối đa 24%.
- Super: Tên lửa khổng lồ nổ toàn bản đồ: trong 130 gây 220% Damage, ngoài tâm gây 80%; mọi người trúng Phóng xạ/Burn. Chủ và đồng đội nhận 50% Damage tương ứng.
- Tăng trưởng: Mỗi 10 giây sống sót: tỉ lệ hiệu ứng +2 điểm %; Damage +8% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Bang Chủ Cái Bang (char_32)

- Đòn thường: Dép tổ ong chạm tường hoặc địch để lại vùng Frozen và Damage mỗi giây; tối đa ba vùng thường.
- Super: Đặt đại trận bán kính 175, báo trước 0,5 giây, tồn tại 4 giây; Frozen và Damage mỗi giây. Mỗi chủ giữ một đại trận.
- Tăng trưởng: Mỗi 10 giây sống sót: Damage theo tick +5% gốc; vùng ảnh hưởng +3% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Sóc Jake (char_33)

- Đòn thường: Cầm dĩa và đùi gà, phía đùi gà gây 50% Damage; đòn trúng có 25% ném gà boomerang, khi quay lại hồi HP cho chủ. Hồi ném 2 giây.
- Super: Ném đùi gà khổng lồ xuyên mục tiêu: đồng đội chạm hồi ít HP, địch nhận Damage; quay lại hồi HP chủ.
- Tăng trưởng: Mỗi 10 giây sống sót: lượng hồi HP +4% gốc; Damage +8% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Người Máy Đỉnh Cao Fu Di (fu_di)

- Đòn thường: Đánh cận chiến, có 20% bắn thêm laser thẳng; không còn tự đánh. Tỉ lệ laser và Damage tăng dần.
- Super: Bắn laser khổng lồ xuyên địch trong tầm 340, gây 210% Damage; không tự Burn.
- Tăng trưởng: Mỗi 10 giây sống sót: tỉ lệ hiệu ứng +2 điểm %; Damage +8% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Siêu Chiến Binh Wacom (wacom)

- Đòn thường: Đạn bay nhanh, gây 60% Damage, một lần nảy tường và tăng dần tối đa 5; hồi bắn dài hơn 30%, không gây sát thương đồng đội.
- Super: Bắn liên tục tám phát cách nhau 0,3 giây, mỗi phát 28% Damage; tạm dừng bắn thường trong chuỗi. Đạn nảy, không có phản đạn vào chủ.
- Tăng trưởng: Mỗi 10 giây sống sót: tốc độ đánh/tạo vùng +5% gốc; thêm 1 lần nảy mỗi 3 tầng, tối đa 5. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

### Skyrocket Dog (skyrocket)

- Đòn thường: Thả bóng bay 60% Damage, vùng nổ cơ sở 45 tăng dần; không gây sát thương chủ hoặc đồng đội.
- Super: Ba bóng tên lửa lớn 70% Damage mỗi quả, bán kính cơ sở 75, tự hướng về địch; nổ khi chạm hoặc hết hạn. Không gây sát thương đồng đội/chủ.
- Tăng trưởng: Mỗi 10 giây sống sót: Damage +8% gốc; vùng ảnh hưởng +3% gốc. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.

## Phạm vi ngoài combat

Giữ các thay đổi v25 về 729 đội đi ải, boss chỉ huy/hai quân hỗ trợ, phân tích 200 trận và bảo hiểm Pack Boss thứ 50. Xem [COMBAT_V25.md](COMBAT_V25.md) và [WEB_RELEASE_2026-10-22.1.md](WEB_RELEASE_2026-10-22.1.md). Số đo cân bằng hiện tại ghi trong TESTING.md; đây là mẫu mô phỏng offline, không phải win-rate người chơi thật.
