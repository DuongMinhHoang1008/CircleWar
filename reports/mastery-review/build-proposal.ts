import assert from 'node:assert/strict';
import { writeFileSync, readFileSync } from 'node:fs';
import { MASTERIES } from '../../packages/shared/src/mastery';
import { character } from '../../packages/shared/src/catalog';
import { characterKit } from '../../packages/shared/src/character-kits';

// Design data only. This script never edits runtime mastery definitions.
type Proposal = [string, string, string]; // final design, benefit/limit, verification
const designs: Record<string, Proposal[]> = {
  char_01: [
    ['Giữ hồi Hướng Nội 0,8% HP/giây. Tích 25% HP thực mất do địch trong Hướng Nội, trần 6% HP gốc; cộng vào đòn thường trúng đầu tiên sau khi hết trạng thái. Không tiêu phần tích khi đánh trượt.', 'Thêm phản công mà không mất hồi. Phần tích không cộng dồn qua nhiều chu kỳ; phần chưa dùng hết hạn sau 6 giây.', 'Đo sát thương trả đòn và HP hồi; khi không bị đánh, hồi phải bằng bộ gốc.'],
    ['Giữ Hướng Nội đủ 2 giây. Khi vào trạng thái, giải một Frozen hoặc Paralyzed và miễn tái áp đúng loại vừa giải trong 1 giây; hồi riêng 8 giây.', 'Giữ trọn phòng thủ nền, thêm khả năng tiếp cận. Không giải Choáng, Burn hoặc DoT; không kéo dài miễn bằng làm mới Hướng Nội.', 'Đối chiếu thời gian bị chậm/tê, thời gian tiếp cận và sống sót; kiểm tra đối thủ không có khống chế.'],
    ['Giữ toàn bộ Super 180% và Hướng Nội. Sau Super, cấp khiên 6% HP gốc Hổ trong 3 giây cho một đồng đội khác yếu nhất; hồi 6 giây. Khi không có đồng đội sống, Hổ nhận khiên này.', 'Bỏ giảm 25% sát thương Super. Khiên một nguồn chỉ làm mới, không cộng tầng; giữ loại Truyền thừa.', 'Đo khiên thực hấp thụ, Super gây sát thương và khả năng cứu đồng đội; kiểm tra 1v1.'],
  ],
  char_02: [
    ['Giữ đòn thường. Mỗi đòn trúng thứ tư thêm vòng ôm bán kính 82: 40% ATK lên mục tiêu chính và tối đa hai địch khác.', 'Thêm sát thương sát người; vòng phụ không xét Tiểu Đường hoặc đếm chuỗi, không làm chậm nhịp nền.', 'So sát thương 1v1/ba địch gần; một chu kỳ chỉ tạo một vòng và giữ tần suất Tiểu Đường gốc.'],
    ['Giữ đòn thường. Mỗi 4 giây, khi có địch hợp lệ trong tầm 160 theo hướng đánh, phóng tay ôm 50% ATK, kéo lực 300 về phía Bé; không tiêu hồi nếu chưa phóng được.', 'Móc phụ giúp bắt mục tiêu, không thay đòn chạm. Chặn bởi đệ/khiên; không xuyên tường, không proc đòn thường.', 'Đo thời gian áp sát và sát thương; kiểm tra kéo sát tường và mục tiêu bị vật thể chắn.'],
    ['Giữ buff xoay và bảo đảm Tiểu Đường của Super gốc. Thêm ba gấu bông xoay 1 giây rồi đuổi địch, mỗi quả 15% ATK, chỉ chạm một địch một lần.', 'Thêm tối đa 45% ATK nếu cả ba trúng một người; gấu không gây Tiểu Đường hoặc nạp Super.', 'Đo tổng sát thương trong 3 giây Super, số gấu thực trúng và tần suất Tiểu Đường.'],
  ],
  char_03: [
    ['Giữ quả 90% ATK, nhịp và số nảy theo tăng trưởng. Mỗi quả thứ tư tách ba hạt 15% ATK khi lần đầu trúng địch; quả mẹ tiếp tục hành vi gốc.', 'Hạt là sát thương thêm, không tách tiếp; không trúng lại người vừa kích tách. Nếu quả mẹ hết tầm chưa trúng, không sinh hạt.', 'Đo sát thương quả/hạt riêng ở 0/30/60 giây; xác nhận quả mẹ vẫn nảy và tăng trưởng vẫn hữu ích.'],
    ['Giữ quả và nảy gốc. Mỗi lần bắn thứ năm thêm một quả hồi lưu: đi 45% ATK, về 30%, quay sau 0,6 giây, tối đa hai địch mỗi chiều.', 'Đòn phụ không khóa ném quả thường; tối đa một quả phụ đang bay, không tích lượt chờ để bắn dồn.', 'Đo sát thương và khoảng ngừng bắn; thử đứng sát tường, mất chủ và mục tiêu đổi hướng.'],
    ['Giữ rổ quả Super gốc. Tại điểm nổ đặt thêm năm hạt mìn 10% ATK, lên ngòi sau 0,6 giây, bán kính 55, tồn tại 3 giây.', 'Mỗi địch nhận tối đa 30% ATK từ cả nhóm hạt; hạt không nảy, không proc hoặc gây hại đồng đội.', 'Đo sát thương rổ gốc riêng và hạt riêng; kiểm tra năm mìn trùng vị trí vẫn giữ trần.'],
  ],
  char_04: [
    ['Giữ đòn chạm và lực đẩy gốc. Mỗi đòn trúng thứ tư phóng một lưỡi gió 45% ATK, tầm 200, xuyên tối đa hai địch.', 'Có sát thương nối tiếp sau cú đẩy; sóng không proc hoặc thêm lực đẩy, nhịp nền giữ nguyên.', 'Đo sát thương sau đẩy, hit sóng ở nhiều khoảng cách và lực đẩy nền.'],
    ['Giữ đòn gốc. Mỗi 4 giây phóng mặt gió 45% ATK tầm 140 vào địch hợp lệ, kèm lao ngắn 0,25 giây; chỉ lao khi địch ở ngoài tầm chạm.', 'Thêm tiếp cận, không tự lao xuyên đối thủ hoặc bỏ chạy khỏi mục tiêu đang chạm. Không có miễn sát thương.', 'Đo thời gian ngoài tầm đánh; thử địch ở sát thân, tường và góc sân để tránh lao bất lợi.'],
    ['Giữ tăng xoay/lực đẩy của Super. Thêm lốc đi theo chủ bán kính 100 trong 3 giây, gây 10% ATK/giây và hút lực bằng 25% lốc thường của Phonk.', 'Lốc hỗ trợ giữ địch, tối đa ba lần sát thương/người; lực hút chịu trần impulse hiện hành, không cộng thành khóa vị trí.', 'Đo thời gian địch trong tầm và sát thương Super; kiểm tra hút/đẩy không tạo dao động vô hạn.'],
  ],
  char_05: [
    ['Đạn chính giữ 100% ATK và nhịp gốc; nâng thành đạn khoan xuyên hai mục tiêu phụ, mỗi người phụ chịu 25% ATK.', 'Địch đầu tiên giữ proc Cận Thị; địch phụ không proc. Tổng ba người, cùng người chỉ trúng một lần/viên.', 'Đo sát thương đơn mục tiêu không giảm và sát thương tuyến sau; kiểm tra đệ chắn.'],
    ['Thay trụ đứng bằng một drone bám chủ, tồn tại 8 giây, HP bằng trụ gốc, mỗi giây bắn 55% ATK gốc chủ trong 220.', 'Cùng một ô triệu hồi Super, không gọi kèm trụ cũ. Tăng nhẹ hỏa lực và duy trì tầm; drone vẫn bị phá.', 'So số phát trúng, thời gian hoạt động, sát thương và hấp thụ đạn với trụ gốc trước đội cơ động/đứng gần.'],
    ['Một trụ ba nòng trong 8 giây, HP bằng trụ gốc, bắn mỗi giây: viên giữa 50% ATK gốc, hai viên bên 10% mỗi viên.', 'Một người nhận tối đa 60% ATK mỗi loạt; cùng ô trụ Super. Giữ tầm 220, không proc hoặc nạp Super từ trụ.', 'Đo hỏa lực khi chỉ viên giữa trúng và khi trúng cả loạt; không thấp hơn trụ gốc ở mục tiêu đứng giữa.'],
  ],
  char_06: [
    ['Giữ dải màu chính, nhịp, xuyên và tương tác đồng đội gốc. Mỗi dải thứ tư thêm hai dải bên 20% ATK mỗi dải.', 'Dải phụ có thể tiếp sức nhưng cùng một người chỉ nhận buff một lần mỗi loạt; chỉ dải chính proc Frozen.', 'Đo sát thương và thời gian buff cả đội; thử đồng đội chắn trước địch, không nhân buff ba lần.'],
    ['Giữ dải thường. Mỗi dải thứ năm thêm dải hồi lưu 35% ATK mỗi chiều, xuyên tối đa hai người/chiều và vẫn tiếp sức đồng đội.', 'Không chặn dải gốc; mỗi người nhận tiếp sức từ dải phụ tối đa một lần mỗi 2 giây; tối đa một dải phụ.', 'Đo số đồng đội được buff và sát thương, kiểm tra quay về không tạo buff vô hạn.'],
    ['Giữ tia chính 180% ATK, chiều dài 320 và bề rộng gốc. Thêm một tia vuông góc dài 260, 35% ATK và tiếp sức như gốc.', 'Người ở giao điểm nhận tối đa 215% ATK và một bộ buff/Super. Không có hai Super độc lập.', 'Đo sát thương ở trục chính, trục phụ, giao điểm; kiểm tra buff đồng đội không nhân đôi.'],
  ],
  char_07: [
    ['Giữ đòn thường và cơ chế né. Mỗi đòn trúng thứ tư thêm vành âm hồi lưu, 35% ATK mỗi chiều, tầm 170.', 'Không dừng đánh chạm trong lúc chờ; vành phụ không né thêm, không proc; tối đa một vành.', 'Đo sát thương và tỷ lệ né nền; thử vừa chạy tránh đòn vừa bắt vành.'],
    ['Giữ nhịp đánh gốc. Khi mất HP từ đòn trực tiếp của địch, đặt bẫy 65% ATK; lên ngòi 0,4 giây, tồn tại 3 giây, bán kính 55; hồi 6 giây.', 'Bỏ phạt nhịp 25%. Không kích từ mất khiên, DoT, tự hại hoặc đòn đã né; tối đa một bẫy/chủ.', 'Đo sát thương phản công, số lần bẫy trúng; kiểm tra né không kích bẫy và không hình thành chuỗi phản.'],
    ['Giữ tiếng hét Choáng/Paralyzed gốc. Thêm tám vành âm 8% ATK, nảy tối đa một lần.', 'Một địch nhận tối đa 24% ATK từ các vành của một Super; vành không gây thêm khống chế.', 'Đo thời gian khống chế gốc và sát thương cộng thêm; kiểm tra trần khi ép góc.'],
  ],
  char_08: [
    ['Giữ đòn thường và Bleeding. Mỗi đòn trúng thứ tư thêm hai đường nanh chữ thập tầm 90, 40% ATK, tối đa ba địch.', 'Mỗi người chỉ trúng một lần nhịp chữ thập; nhát phụ không proc Bleeding; bỏ thay toàn bộ nhịp đánh.', 'Đo sát thương đơn/đa mục tiêu và tỷ lệ Bleeding; kiểm tra hai trục cùng chạm một địch.'],
    ['Giữ đòn chạm. Mỗi đòn trúng thứ năm ném liềm tầm 190, 45% ATK lúc đi và 30% lúc về, xuyên hai địch/chiều.', 'Liềm không ngừng đánh chạm và không proc Bleeding thêm; chỉ một liềm, không tích lượt bắn dồn.', 'Đo sát thương truy đuổi và lượt về, so tần suất Bleeding với bộ gốc.'],
    ['Giữ Trăng máu cả buff lẫn rủi ro nhận thêm sát thương. Thêm hai sói săn trong 5 giây, mỗi sói 12% HP gốc chủ, cắn 10% ATK gốc mỗi 0,8 giây.', 'Tổng sát thương sói lên một địch tối đa 60% ATK gốc/mỗi Super; không proc Bleeding, không giữ round.', 'Đo lợi ích sói riêng và HP chủ; kiểm tra rủi ro Super vẫn đúng, sói không tính người sống.'],
  ],
  char_09: [
    ['Giữ deadline và proc gốc. Mỗi phát thứ năm thêm deadline hồi lưu 40% ATK mỗi chiều; quay sau 0,6 giây, hai địch/chiều.', 'Không làm chậm bắn thường, không thêm Paralyzed từ đạn phụ, tối đa một deadline phụ.', 'Đo sát thương, tần suất tê và số phát nền khi deadline chưa về.'],
    ['Giữ deadline thường. Mỗi phát thứ tư đặt thêm ghim tại điểm trúng hoặc hết tầm: 40% ATK, lên ngòi 0,4 giây, bán kính 55, tồn tại 3 giây.', 'Tối đa ba ghim/chủ, không sát thương đồng đội, không proc Paralyzed. Không thay đạn chính bằng mìn.', 'Đo sát thương và số lần ghim trúng; kiểm tra proc gốc không mất và đếm tối đa ba ghim.'],
    ['Giữ năm vùng deadline và hiệu ứng gốc. Khi Super kích hoạt, thêm một deadline chuyền tối đa ba địch, 15% ATK mỗi người, khoảng chuyền 140.', 'Không chuyền về người đã trúng, không khống chế thêm. Sát thương đồng đội của vùng gốc giảm 25% so với bộ gốc, không thêm friendly fire từ đạn chuyền.', 'Đo sát thương địch, friendly fire và thời gian áp lực; đường chuyền phải bay thật.'],
  ],
  char_10: [
    ['Giữ vũ khí và proc khiên gốc. Mỗi đòn trúng thứ tư quét vòng bán kính 78, 40% ATK lên tối đa ba địch.', 'Vòng phụ không tạo khiên thêm; không kéo dài nhịp đánh hoặc tạo thêm lượt khi chỉ đi sát địch.', 'Đo sát thương và khiên thực hấp thụ; kiểm tra đúng số lượt tạo khiên gốc.'],
    ['Giữ đòn chạm. Mỗi đòn trúng thứ năm thêm vành hồi lưu 40% ATK mỗi chiều, tầm 175, xuyên hai địch/chiều.', 'Không ngừng đòn chạm hoặc mất proc khiên; một vành phụ, không hồi HP khi bắt.', 'Đo sát thương, khiên và thời gian ngoài tầm; không dùng đòn phụ để kích khiên.'],
    ['Giữ cú lăn 2,5 giây và lực đẩy gốc. Thêm hai lốp nhỏ chạy 4 giây, mỗi lốp 12% HP gốc, húc 15% ATK gốc mỗi 0,8 giây, lực đẩy 150.', 'Một địch chịu tối đa 60% ATK gốc từ hai lốp/Super; giữ trần impulse, không bất tử cho chủ.', 'Đo quãng tiếp cận và sát thương; thử nhiều va chạm ở góc, giới hạn đệ và lượt húc.'],
  ],
  char_11: [
    ['Giữ hồi HP, Rage và bán kính cờ gốc. Đồng đội khác lần đầu vào cờ nhận khiên 3% HP gốc Cờ trong 3 giây, hồi 8 giây/người giữa mọi cờ.', 'Thêm chống dồn sát thương; bỏ mất hồi nền. Khiên cùng nguồn không cộng tầng.', 'Đo hồi thực và khiên thực hấp thụ; xác nhận chuyển qua nhiều cờ không bỏ qua hồi riêng.'],
    ['Giữ Frozen, hồi và bán kính cờ gốc. Địch vào vùng nhận thêm Paralyzed 15% trong 1 giây, hồi 5 giây/người.', 'Thêm cản nhịp đánh, không mất cản di chuyển; thời gian tê không kéo dài bởi nhiều cờ.', 'Đo thời gian Frozen và Paralyzed riêng; kiểm tra đối thủ ra/vào vùng liên tục.'],
    ['Giữ khiên Super 5% HP gốc Cờ cho mọi đồng đội như gốc; tăng riêng đồng đội khác yếu nhất lên 10%, không cộng thành 15%. Không có đồng đội khác thì bản thân tăng lên 10%.', 'Thêm bảo vệ đúng người, không bỏ khiên các thành viên còn lại; giữ Truyền thừa và hiệu ứng địch gốc.', 'Đo khiên hấp thụ từng người, thử đội 1/2/3 quân và mục tiêu chết ngay trước Super.'],
  ],
  char_12: [
    ['Giữ xoay/vũ khí gốc. Mỗi đòn trúng thứ tư thêm chữ thập tầm 105, 40% ATK lên tối đa ba địch.', 'Bỏ thay toàn bộ đòn chạm. Một người chỉ nhận một nhát phụ, chỉ đòn gốc proc/đếm chuỗi.', 'Đo sát thương theo tốc độ xoay và trận nhiều địch; phát hiện double-hit hai trục.'],
    ['Giữ nhát chém gốc. Mỗi đòn trúng thứ ba để vệt chém báo trước; sau 0,3 giây chém lại 45% ATK, dài 95, theo vị trí/hướng ban đầu.', 'Không giảm sát thương hoặc kéo dài nhịp nhát đầu. Nhát lặp né được, tối đa ba địch, không proc.', 'Đo tỷ lệ nhát lặp trúng và sát thương sau mỗi ba đòn; xác nhận vệt không bám mục tiêu.'],
    ['Giữ cú lao và tăng xoay Super gốc. Cuối cú lao phóng tám phi kiếm 10% ATK, mỗi kiếm nảy một lần.', 'Một địch nhận tối đa 30% ATK từ nhóm kiếm; điều chỉnh lại nhánh hiện có điểm mẫu cao để tránh ghép nguyên 12 kiếm 45% với buff gốc.', 'Đo sát thương cả cửa sổ Super, trần khi sát tường và khả năng áp sát gốc.'],
  ],
  char_13: [
    ['Giữ 100% hồi quả thường. Chuyển 30% hồi dư sau giảm hồi thành khiên, trần 4% HP gốc Mâm Quả, 3 giây, hồi 6 giây/người.', 'Bỏ giảm hồi trực tiếp 20%; chỉ chuyển hồi dư thực, không chuyển khiên hoặc hồi bị giảm thành khiên.', 'Đo hồi thực và khiên hấp thụ ở đội đầy máu/bị thương/giảm hồi; không ghi hồi dư là hồi hữu dụng.'],
    ['Giữ xuyên ba người và hồi/buff gốc. Quả giải một Frozen hoặc Paralyzed trước hồi, hồi 8 giây/người; nếu vừa giải thành công, người đó miễn tái áp đúng loại trong 0,75 giây.', 'Không phạt khi đối thủ không có khống chế; không giải Choáng/DoT và không nhân giải theo nhiều quả cùng tick.', 'Đo thời gian giải khống chế, xuyên đủ ba người và đóng góp trong kèo không có trạng thái cần giải.'],
    ['Giữ tám vùng quả, sát thương/buff gốc. Tăng hồi mỗi nhịp lên 125% gốc; khi tạo, tối đa hai vùng được dời tới hai đồng đội bị thương gần nhất trong 240, phần còn lại rải như cũ.', 'Giữ Truyền thừa. Vùng trùng không nhân nhịp hồi; nếu không có đồng đội bị thương, rải đủ tám vùng gốc.', 'Đo hồi thực và tỷ lệ đồng đội được tiếp tế, xác nhận đủ tám vùng và không nhân hồi khi trùng.'],
  ],
  char_14: [
    ['Giữ tối đa hai đệ nhỏ. Đệ có 115% HP và 100% Damage so với đệ gốc; một đệ ưu tiên chắn trước chủ, đệ còn lại giữ hành vi tấn công gốc.', 'Bỏ việc mất một đệ. Không dùng lại hệ số 220% HP/150% Damage cho cả hai; một hộ vệ, một đệ thường.', 'Đo sát thương đệ, HP đệ thực hấp thụ và sát thương chủ nhận; kiểm tra hai vai trò khi một đệ chết.'],
    ['Giữ hai đệ và 100% HP/Damage gốc. Một đệ nhận thêm vai trò tiếp tế: trong 60 đơn vị hồi đồng đội khác yếu nhất 1,5% HP gốc chủ mỗi 2 giây, trần 20 HP/lần; tấn công khi có địch chạm.', 'Chỉ một đệ chữa trị/chủ. Khi đệ này bị địch phá, khiên 3% HP gốc chủ cho một đồng đội trong 120, hồi chung 8 giây; không kích khi hết hạn.', 'Đo sát thương đệ không sụt mạnh vì đi cứu người, hồi thực và khiên khi bị phá; thử không có đồng đội.'],
    ['Giữ Damage và thời gian 10 giây của đệ khổng lồ. Cho chọn đồng đội để hộ tống, tăng HP đệ lên 110% gốc; nếu không có mục tiêu hợp lệ thì bảo vệ chủ.', 'Đệ chặn bằng thân và đánh khi địch ở gần, không tự đổi thành bất tử/chuyển sát thương. Không phạt Damage hoặc lifetime; giữ Truyền thừa.', 'Đo HP người được bảo vệ và sát thương đệ; kiểm tra mục tiêu chết, chủ chết và thời hạn còn lại.'],
  ],
  char_15: [
    ['Giữ kiếm, cú chạm khiên và hitbox chặn đạn gốc. Mỗi 4 giây, khi có địch trong 180, phóng một bản sao khiên: 40% ATK mỗi chiều, hai địch/chiều.', 'Không tháo khiên thật, không dừng cận chiến; một bản sao đang bay, không proc hoặc chặn đạn bằng bản sao.', 'Đo tỷ lệ chặn đạn, sát thương và tính độc lập của khiên thật khi bản sao đang bay.'],
    ['Giữ nhịp đánh gốc. Sau HP thực mất từ địch, bắn ba mảnh theo hướng nguồn đánh, mỗi mảnh 25% ATK, hồi 6 giây.', 'Một địch nhận tối đa 50% ATK mỗi lần phản. Không phản từ mất khiên, DoT, tự hại; không proc chuỗi.', 'Đo sát thương phản, kiểm tra giới hạn shotgun và nhịp kiếm/khiên nền.'],
    ['Giữ tám mảnh xương Super gốc. Thêm một hộ vệ 20% HP gốc chủ trong 4 giây, theo đồng đội yếu nhất hoặc chủ, chỉ chắn bằng thân.', 'Hộ vệ không đánh, không cấp khiên hay nạp Super; tối đa một hộ vệ cộng thêm/chủ.', 'Đo sát thương Super không mất và HP hộ vệ thực chặn; kiểm tra đường đạn có thực sự va vào thân.'],
  ],
  char_16: [
    ['Giữ viên mực và nhịp gốc. Mỗi viên thứ tư tách ba nét con 15% ATK tại lần trúng đầu hoặc hết tầm, không thay sát thương viên mẹ.', 'Không trúng lại người vừa làm tách; nét con không Frozen/proc/tách tiếp; chỉ tách một lần.', 'Đo viên mẹ/nét con riêng và tần suất Frozen; kiểm tra hết tầm và bị đệ chặn.'],
    ['Giữ đạn mực gốc. Mỗi viên thứ tư thêm nét sóng 45% ATK, xuyên hai địch, biên độ lượn tối đa 10 đơn vị.', 'Không làm lệch viên chính hoặc chậm bắn; sóng không Frozen/proc; tránh mất sát thương ở đường giữa.', 'Đo tỷ lệ trúng đường giữa và hai bên, sát thương đơn/đa mục tiêu.'],
    ['Giữ vũng mực gốc bán kính 150, 4 giây. Thêm hai ô mực bán kính 45 ở hai bên, tồn tại 3 giây, gây 10% ATK/giây và Frozen như vùng gốc.', 'Vùng phụ có báo trước 0,5 giây, dùng chung nhịp gây sát thương với vùng gốc; chỗ trùng lấy mạnh nhất.', 'Đo vùng phủ và thời gian gây sát thương thực; không tăng damage một người bằng chồng ba vùng.'],
  ],
  char_17: [
    ['Giữ cận chiến nhanh và nhịp gốc. Mỗi đòn trúng thứ tư phóng kiện hàng đâm thẳng tầm 125, 45% ATK, xuyên tối đa hai địch.', 'Đòn phụ không tự đánh thêm vào đồng đội hoặc kích trang bị; không cắt mất đòn chạm.', 'Đo DPS và số đòn theo tốc độ, thử đối thủ né ngang hoặc đứng sau đệ.'],
    ['Giữ đòn chạm. Mỗi đòn trúng thứ năm ném kiện hồi lưu tầm 195, 45% ATK lúc đi và 30% lúc về.', 'Một kiện phụ, không khóa cận chiến; bắt kiện không hồi HP hoặc reset nhịp.', 'Đo sát thương cả hai chiều và thời gian đánh liên tục khi di chuyển nhanh.'],
    ['Giữ tăng tốc và né đòn trực tiếp 1,4 giây của Super. Thêm một đệ tiếp tế 18% HP gốc chủ trong 5 giây, hồi đồng đội khác 1,5% HP gốc chủ mỗi 1,5 giây trong tầm 60, trần 20 HP/lần.', 'Tối đa một đệ, không đánh địch; DoT trên chủ vẫn chạy, không truyền né cho người được hồi.', 'Đo né, sát thương/di chuyển chủ và hồi đệ; kiểm tra đệ đến được đồng đội trước hết hạn.'],
  ],
  char_18: [
    ['Giữ đòn muôi và Burn gốc. Mỗi đòn trúng thứ tư thêm quạt 45% ATK, tầm 90, tối đa ba địch phía trước.', 'Đòn phụ không Burn thêm hoặc kích chuỗi; nhịp gốc giữ nguyên.', 'Đo sát thương đơn/nhóm và Burn; kiểm tra địch sau lưng không trúng quạt.'],
    ['Giữ đòn muôi. Mỗi đòn trúng thứ năm ném nắp nồi 40% ATK mỗi chiều, tầm 175, xuyên hai địch/chiều.', 'Không mất Burn hoặc cận chiến trong khi nắp bay; nắp phụ không xét Burn.', 'Đo sát thương, tần suất Burn và số đòn chạm khi nắp đang bay.'],
    ['Giữ vùng lẩu theo chủ và tự hồi Super gốc. Thêm một bếp 20% HP gốc chủ trong 4 giây; mỗi 1,5 giây bắn đạn nổ 12% ATK gốc chủ, bán kính 55.', 'Tối đa một bếp; không Burn thêm, không hồi đồng đội, không nổ trúng chủ/đồng đội.', 'Đo tự hồi không mất, sát thương bếp riêng, số phát thật trước khi bếp bị phá.'],
  ],
  char_19: [
    ['Giữ đòn chạm và lì xì gốc. Mỗi đòn trúng thứ tư thêm ba phong bao: giữa 20% ATK, hai bên 10%, tầm 180; có thể trao buff gốc khi chạm đồng đội.', 'Mỗi người nhận tối đa một buff/loạt, dùng chung hồi lì xì cặp 1 giây; đạn phụ không thêm debuff ngẫu nhiên lên địch.', 'Đo sát thương và thời gian buff; kiểm tra đạn phụ không bỏ qua hồi cặp.'],
    ['Giữ cận chiến/lì xì chạm. Mỗi đòn trúng thứ năm ném bao hồi lưu 35% ATK mỗi chiều, tầm 190; có thể tiếp sức đồng đội.', 'Không khóa đánh chạm; cùng người nhận buff từ bao phụ tối đa một lần mỗi 2 giây; không thêm debuff lên địch.', 'Đo buff hữu dụng và sát thương; kiểm tra lượt đi/về không nhân buff hoặc debuff.'],
    ['Giữ tám lì xì Super gốc. Thêm sạp tiếp tế 15% HP gốc chủ trong 4 giây cạnh đồng đội yếu nhất; mỗi 2 giây bắn một quả hồi 1% HP gốc chủ, trần 15 HP/lần, trong 220.', 'Quả mới tự đuổi đúng đồng đội, chỉ hồi HP, không kèm Rage/Blessing/debuff; tối đa một sạp. Sạp đứng yên theo tên cũ, mô tả phải nói rõ.', 'Đo tám bao gốc vẫn đủ, đạn tiếp tế có tới mục tiêu đang di chuyển, không tạo buff ngoài ngân sách.'],
  ],
  char_20: [
    ['Giữ bốn hoa thường và chức năng gốc. Nối tối đa ba cặp hoa gần nhất trong 100; đồng đội cắt dây nhận khiên 2% HP gốc Hoàng Tử trong 3 giây, hồi 6 giây/người.', 'Một nguồn khiên không cộng tầng; không tạo dây từ hoa Super, không thêm hồi khi đi qua nhiều dây.', 'Đo hồi và khiên thực, kiểm tra bốn hoa còn đủ và số dây không vượt ba.'],
    ['Giữ tối đa bốn hoa. Hoa trúng đồng đội đầu tiên bám 2 giây rồi cắm tại vị trí cuối để sống hết thời gian gốc; giữ Rage/hồi và Frozen trên địch trong vùng.', 'Tối đa hai hoa đang bám; vùng trùng lấy mạnh nhất; không cộng thời gian sống sau khi rơi.', 'Đo thời gian buff và hồi khi đồng đội di chuyển, kiểm tra đủ chức năng sau khi hoa rơi.'],
    ['Giữ sáu hoa Super, Frozen và lifetime gốc. Mỗi hoa chặn một viên đạn địch nhưng sau chặn vẫn tồn tại để hỗ trợ; mỗi hoa chỉ chặn một lần.', 'Tối đa sáu lượt chặn/Super; không chặn tia/vùng/va chạm; giữ Truyền thừa.', 'Đo số đạn chặn và hỗ trợ sau chặn; thử đạn xuyên, tia và nhiều đạn cùng tick.'],
  ],
  char_21: [
    ['Giữ viên khí chính 100% ATK, lực đẩy và nhịp gốc. Mỗi phát thứ tư thêm bốn viên bên 10% ATK mỗi viên.', 'Đạn bên không đẩy/proc; một người nhận tối đa 30% ATK sát thương phụ/loạt. Viên giữa luôn theo hướng ngắm gốc.', 'Đo sát thương tầm xa không hụt đường giữa, sát thương sát thân và lực đẩy chính.'],
    ['Giữ viên khí chính 100% ATK và lực đẩy. Đạn xuyên hai địch phụ, mỗi người phụ 25% ATK và 25% lực đẩy gốc; nhịp gốc.', 'Không tăng damage người đầu; tối đa ba mục tiêu, lực đẩy không vượt trần engine.', 'Đo DPS người đầu và tuyến sau; thử xếp hàng sát tường và vật thể chắn.'],
    ['Giữ tám phát và khiên 12% HP của Super. Thêm ba vệ tinh 10% ATK xoay 0,6 giây rồi đuổi địch.', 'Không cấp thêm khiên từ vệ tinh; mỗi vệ tinh trúng một địch một lần, tổng tối đa 30% ATK/người.', 'Đo khiên hấp thụ, tám phát gốc và vệ tinh riêng, thử triệu hồi sát biên.'],
  ],
  char_22: [
    ['Cho chọn đồng đội làm tâm aura phụ bán kính 80% bán kính gốc; đồng thời giữ aura quanh chủ bán kính gốc. Tâm phụ mất thì chỉ tắt phần phụ.', 'Hai vùng cùng nguồn không cộng buff; không giảm hiệu lực hay phạm vi quanh chủ. Một tâm phụ, giữ điều kiện chủ còn sống.', 'Đo thời gian buff của từng đồng đội; kiểm tra hai vùng chồng không tăng gấp đôi Damage.'],
    ['Giữ hiệu lực aura 100% gốc. Khi rời vùng, buff lưu thêm 1,5 giây; hồi riêng 6 giây/người cho lần kéo dài mới.', 'Không mất 20% buff; nguồn bị hạ thì buff tắt ngay. Ra/vào liên tục không kéo dài vô hạn.', 'Đo thời gian buff và sát thương đồng đội, thử nguồn chết và ra/vào trong hồi.'],
    ['Giữ Rage, Blessing và tăng nhịp Super gốc. Thêm 6 năng lượng cho mỗi đồng đội khác, hồi 8 giây/người.', 'Không tự nạp hoặc tràn qua 100; phần năng lượng này không kích hồi năng lượng từ hiệu ứng khác; giữ Truyền thừa.', 'Đo thời điểm Super tiếp theo của đồng đội và năng lượng thực nhận; kiểm tra đội hai nguồn cấp năng lượng không tạo vòng.'],
  ],
  char_23: [
    ['Giữ kiếm xoay, tăng trưởng tầm và cơ chế lướt va chạm gốc. Mỗi đòn trúng thứ tư phóng xung kiếm 45% ATK tầm 135, xuyên hai địch.', 'Xung phụ không tự bỏ giáp/khiên hoặc proc; không thay kiếm chạm bằng đạn.', 'Đo sát thương, va chạm kiếm, tăng trưởng và khả năng chạm mục tiêu sau đệ.'],
    ['Giữ kiếm gốc. Mỗi đòn trúng thứ tư thêm chữ thập tầm 110, 40% ATK lên tối đa ba địch.', 'Một địch trúng tối đa một lần/nhịp phụ; không tự kích thêm lượt lướt va chạm.', 'Đo DPS và số nhát ở giao điểm hai trục, giữ hành vi kiếm Super.'],
    ['Giữ kiếm khổng lồ 4 giây và bỏ va chạm vũ khí gốc. Khi Super kết thúc, phóng kiếm nhỏ 25% ATK; khi chạm đầu tách bốn mảnh 8% ATK mỗi mảnh.', 'Người bị kiếm mẹ trúng không trúng mảnh; không xuyên giáp/khiên. Chỉ một lần tách, không phóng nếu chủ đã chết.', 'Đo sát thương cửa sổ kiếm gốc và phần kết thúc; kiểm tra chết trước lúc kết thúc và checkpoint đúng thời điểm.'],
  ],
  char_24: [
    ['Giữ nét mực chính, nhịp và debuff gốc. Mỗi phát thứ tư thêm hai nét bên 20% ATK mỗi nét.', 'Chỉ nét chính xét debuff, hai nét phụ không phát thêm trạng thái hoặc chuỗi.', 'Đo sát thương và số debuff, kiểm tra ba nét cùng trúng không nhân proc.'],
    ['Giữ sát thương 100% ATK và nhịp bắn gốc; mỗi nét thứ ba được tự đuổi mục tiêu đã chọn, đời đạn tăng tối đa 20%.', 'Không xuyên; chỉ một lượt proc debuff trên một viên. Mục tiêu chết thì chọn địch gần nhất trong tầm sống còn lại.', 'Đo tỷ lệ trúng đối thủ cơ động và debuff; thử mất mục tiêu, đệ/khiên chắn.'],
    ['Giữ mười hai nét mực Super và proc gốc. Thêm bốn nét vuông góc dài 260, 8% ATK mỗi nét; một nét ưu tiên hướng tới địch gần nhất.', 'Một địch chịu tối đa 16% ATK từ các nét phụ; nét phụ không debuff, không nạp Super.', 'Đo sát thương và debuff gốc, trần sát thương ở giao điểm bốn nét.'],
  ],
  char_25: [
    ['Giữ đòn chạm và giao dịch gốc. Mỗi 3 giây tạo hai xu xoay bán kính 65 trong 1,5 giây, mỗi xu gây 20% ATK/địch một lần.', 'Xu không chặn đánh thường, không proc/giao dịch hoặc bắn dồn; tối đa hai xu phụ/chủ.', 'Đo DPS và tần suất giao dịch, thử địch sát thân và đứng ngoài quỹ đạo.'],
    ['Giữ đòn chạm. Mỗi đòn trúng thứ tư búng xu tầm 170, 45% ATK, xuyên tối đa hai địch.', 'Không thay toàn bộ cận chiến; không thay rủi ro giao dịch, không sinh tài sản từ xu phụ.', 'Đo sát thương ở các khoảng cách, kiểm tra tài sản/HP mất do thua lỗ không đổi luật.'],
    ['Giữ bốn giao dịch chắc lãi và Rage Super. Thêm quỹ có 15% HP gốc chủ trong 4 giây; mỗi 1,5 giây bắn ba xu 5% ATK gốc/viên.', 'Một người nhận tối đa 30% ATK gốc từ quỹ/Super; quỹ không tự giao dịch hoặc tạo máu ảo cho chủ.', 'Đo số giao dịch gốc, khiên tài sản, sát thương quỹ riêng; thử quỹ bị phá sớm.'],
  ],
  char_26: [
    ['Giữ đòn chạm, bẻ hướng và đẩy gốc. Mỗi đòn trúng thứ tư thêm lưỡi Bass 40% ATK tầm 200, xuyên hai địch.', 'Sóng không đẩy/proc; giới hạn biên độ lượn 10 để không bỏ trống hoàn toàn đường giữa.', 'Đo sát thương sau đẩy và tỷ lệ sóng trúng, kiểm tra chuyển động bẻ hướng gốc.'],
    ['Giữ đòn gốc. Mỗi đòn trúng thứ tư thêm vòng quét bán kính 75, 35% ATK lên tối đa ba địch; địch phụ nhận đẩy lực 100.', 'Mục tiêu chính không nhận thêm lượt đẩy từ vòng. Không nhân đẩy theo ba địch hoặc bỏ qua trần impulse.', 'Đo sát thương, vị trí và tổng lực đẩy, thử sát tường và nhiều địch cùng vòng.'],
    ['Giữ lốc gốc bán kính 160 trong 4 giây. Thêm hai mắt bão bán kính 45 ở hai bên, lệch tâm 160, 3 giây, 8% ATK/giây, hút bằng 25% lực lốc chính.', 'Cùng người trong nhiều vùng lấy nhịp và sát thương mạnh nhất; tổng lực hút vẫn chịu trần, không cộng ba lực đầy đủ.', 'Đo vùng phủ và thời gian kiểm soát; so sát thương ở tâm không thấp hơn gốc, kiểm tra vùng chồng.'],
  ],
  char_27: [
    ['Giữ đòn chạm và Burn gốc. Mỗi đòn trúng thứ tư thêm luồng nhiệt 40% ATK tầm 150, xuyên hai địch.', 'Luồng phụ không Burn thêm hoặc tăng số lần xét đốt mạnh; nhịp nền giữ nguyên.', 'Đo Damage/Burn riêng và tăng trưởng tỷ lệ đốt mạnh.'],
    ['Giữ đòn chạm. Mỗi đòn trúng thứ năm thêm dao nhiệt hồi lưu tầm 180, 40% ATK mỗi chiều, hai địch/chiều.', 'Không dừng cận chiến, không tạo Burn/proc từ dao phụ; một dao đang bay.', 'Đo sát thương và uptime Burn, kiểm tra lượt về không thêm một lần đốt mạnh.'],
    ['Giữ buff Damage/di chuyển/nhịp đánh và tự Burn của Super. Thêm ba lõi nhiệt 10% ATK, xoay 1 giây rồi đuổi địch.', 'Mỗi lõi chỉ trúng một địch, không Burn thêm; tổng 30% ATK/người. Không cộng nguyên ba lõi 65% hiện có vào buff gốc.', 'Đo sát thương tổng, tốc độ và HP mất do tự Burn; kiểm tra hệ số Super chỉ tính một lần.'],
  ],
  char_28: [
    ['Giữ đòn thường và rủi ro tự đánh gốc. Mỗi 4 giây phóng nắm đấm phụ 50% ATK tầm 145; chỉ lao ngắn khi mục tiêu ngoài tầm chạm.', 'Nắm đấm phụ không xét tự đánh lần nữa. Lao 0,25 giây, không miễn sát thương hoặc xuyên tường.', 'Đo DPS, thời gian tiếp cận, số lần tự đánh trên cùng số đòn nền.'],
    ['Giữ cận chiến. Mỗi đòn trúng thứ năm thêm đĩa cưa hồi lưu tầm 190, 40% ATK mỗi chiều.', 'Đĩa phụ không khóa cận chiến, không tăng số lần xét tự đánh; tối đa một đĩa, hai địch/chiều.', 'Đo sát thương và HP tự mất, thử cả dạng cơ bản và khi gắn item_28.'],
    ['Thay hình tia Super bằng tia giữa 210% ATK, dài 300, rộng bằng tia gốc, kèm hai tia bên 15% ATK dài 260. Giữ tự Burn như Super gốc.', 'Địch trúng nhiều tia nhận tối đa 230% ATK/Super; đây là một lần Super, không proc hoặc nhân hệ số ba lần.', 'Đo mục tiêu giữa, bên và giao tia; kiểm tra dạng item_28 và HP tự Burn.'],
  ],
  char_29: [
    ['Giữ đạn chính 55% ATK, nhịp và luật friendly fire gốc. Mỗi viên thứ tư tách ba điểm ảnh 10% ATK sau va chạm đầu/hết tầm.', 'Điểm ảnh không trúng lại người vừa kích tách, không gây hại đồng đội/chủ, không tách tiếp hoặc proc.', 'Đo sát thương địch và friendly fire, thử dạng item_29 có xuyên/nảy riêng.'],
    ['Giữ đạn chính 55% ATK và nhịp gốc; mỗi viên thứ ba được thêm hai lần nảy tường. Người đã trúng có thể trúng lại sau nảy, hồi 0,4 giây/người.', 'Sau nảy, sát thương địch bằng 50% đạn ban đầu; sát thương đồng đội không được nhân thêm, vẫn theo hệ số rủi ro tăng trưởng.', 'Đo sát thương từ lần nảy và friendly fire; xác nhận cùng người không bị hit hai lần trong 0,4 giây.'],
    ['Thay chuỗi tám phát bằng một lần quét: tia giữa 340% ATK, dài 300, hai tia bên 20% ATK, dài 260; không phản vào chủ hoặc đánh đồng đội.', 'Một địch nhận tối đa 360% ATK. Super gốc có tám phát 40% ATK ở dạng cơ bản; dạng item_29 phải có cấu hình riêng tối thiểu bằng tổng chuỗi gốc cùng dạng ×1,05 trước khi xét độ rộng.', 'So sát thương mục tiêu giữa/di động, HP tự mất và thời gian gây sát thương; kiểm tra cả hai dạng vũ khí, tránh nhân hệ số Super.'],
  ],
  char_30: [
    ['Giữ bóng mẹ và nhịp gốc. Mỗi bóng thứ tư khi nổ sinh ba mảnh 15% ATK hướng về ba làn; giảm 10% sát thương bóng mẹ gây cho chủ/đồng đội so với gốc.', 'Mảnh không gây friendly fire hoặc nổ/tách tiếp; không trúng lại mục tiêu chính của vụ nổ mẹ. Rủi ro nền vẫn tăng trưởng theo luật gốc.', 'Đo sát thương địch, tự hại và friendly fire; kiểm tra nổ do hết giờ, chạm địch, chạm chủ và item_30.'],
    ['Giữ bóng bay gốc. Mỗi lần thả thứ tư tạo thêm một bóng neo ở hướng mục tiêu cách 80, lên ngòi 0,6 giây, tồn tại 3 giây, bán kính 55, 45% ATK.', 'Bóng neo phụ chỉ hại địch, không thay bóng chính; tối đa hai bóng neo phụ/chủ, vẫn chịu trần vật thể.', 'Đo sát thương và tỷ lệ mìn được kích; xác nhận đòn nền không bị giới hạn phụ chiếm hết chỗ.'],
    ['Thay loạt bóng Super bằng tám bóng hộ tống, mỗi bóng giữ hệ số sát thương địch của bóng Super gốc; xoay 0,5 giây rồi đuổi địch, không gây sát thương chủ/đồng đội.', 'Mỗi bóng chỉ trúng một người, không nổ toàn vùng; cùng địch nhận tối đa ba bóng/Super, phân phối lại mục tiêu khi đã đủ ba.', 'So tổng sát thương địch và HP đội giữ được trước đội tụ/cơ động, 1v1 và item_30; không coi bỏ tự hại tự động bù đủ mất AoE.'],
  ],
  char_31: [
    ['Giữ rocket 100% ATK, nhịp và proc Phóng xạ gốc. Mỗi rocket thứ tư tách ba đầu phụ 15% ATK tại lần trúng đầu/hết tầm.', 'Đầu phụ không trúng lại người kích tách, không Phóng xạ, không tách tiếp; rocket mẹ giữ nguyên phần trúng gốc.', 'Đo sát thương và số tầng Phóng xạ, thử vật thể chắn và hết tầm.'],
    ['Giữ sát thương 100% ATK, nhịp và proc gốc; mỗi rocket thứ ba tự đuổi mục tiêu đã chọn, thời gian sống tăng tối đa 20%.', 'Không xuyên, không nổ AoE mới hoặc thêm lần proc; khi mục tiêu chết chỉ tìm địch trong tầm đời đạn còn lại.', 'Đo tỷ lệ trúng đội cơ động và DoT; thử khiên/đệ chắn, mất mục tiêu.'],
    ['Giữ tên lửa Super gốc, giảm 20% sát thương nó gây cho chủ/đồng đội so với gốc. Thêm hai ụ pháo 12% HP gốc chủ trong 3 giây, mỗi 1,5 giây bắn đạn nổ 10% ATK gốc, bán kính 55.', 'Ụ không Phóng xạ/Burn hoặc friendly fire; tối đa 40% ATK gốc/người từ hai ụ/Super; không dùng nguyên ba ụ cũ kèm tên lửa.', 'Đo sát thương toàn bản đồ gốc, tự hại và damage ụ riêng; giới hạn bắn ở tick cuối lifetime.'],
  ],
  char_32: [
    ['Giữ dép gốc và vùng Frozen. Mỗi phát thứ năm thêm dép hồi lưu 35% ATK mỗi chiều, xuyên hai địch/chiều.', 'Dép phụ để tối đa một vùng Frozen gốc khi lần đầu trúng địch, dùng chung trần ba vùng và không xóa vùng còn sống chỉ để đặt lại; không khóa ném thường.', 'Đo Damage/uptime Frozen, kiểm tra vùng thêm không làm mất vùng gốc hiệu quả hơn.'],
    ['Giữ dép chính theo đường giữa và nhịp gốc. Mỗi phát thứ tư thêm một dép phụ lệch 11,25 độ luân phiên trái/phải, 35% ATK.', 'Dép phụ có thể tạo vùng theo luật gốc, dùng chung trần ba vùng; khi đã đủ vùng, bỏ tạo vùng phụ. Chỉ dép chính proc.', 'Đo hit đường giữa, Damage và thời gian Frozen; kiểm tra luân phiên hướng qua checkpoint.'],
    ['Giữ đại trận gốc bán kính 175 và 4 giây. Thêm ba góc dép bán kính 35, tâm ở rìa đại trận thành tam giác, 3 giây, 8% ATK/giây và Frozen gốc.', 'Báo trước 0,5 giây; vùng trùng lấy sát thương/khống chế mạnh nhất theo nguồn, không cộng tick.', 'Đo vùng phủ thật và thời gian khống chế, giữ damage tại tâm bằng gốc.'],
  ],
  char_33: [
    ['Giữ cả dĩa/đùi gà và proc ném gà gốc. Mỗi đòn trúng thứ tư phóng dĩa 40% ATK, tầm 170, xuyên hai địch.', 'Hai phía vũ khí dùng chung một bộ đếm; dĩa phụ không đếm chuỗi hoặc kích thêm gà.', 'Đo damage hai phía, tần suất gà và sát thương dĩa riêng; kiểm tra khác biệt mô tả/engine về hệ số đùi gà.'],
    ['Giữ hai phía vũ khí. Mỗi đòn trúng thứ tư thêm vòng quét đùi gà bán kính 85, 40% ATK, tối đa ba địch.', 'Vòng phụ không kích gà/proc; mỗi địch một hit/vòng, không mất phía dĩa.', 'Đo đơn/đa mục tiêu và số boomerang gốc, tránh hai mặt vũ khí làm tăng đôi bộ đếm.'],
    ['Thay đùi Super đơn bằng một đùi giữa giữ 125% ATK mỗi chiều, bán kính và hồi HP gốc; thêm hai đùi bên 15% ATK mỗi chiều, không hồi HP riêng.', 'Cả ba có thể tồn tại đồng thời, tách chỗ cho ba đùi Super khỏi hai đạn gà thường nhưng vẫn chịu trần chung. Mỗi địch nhận tối đa 40% ATK phụ từ hai đùi bên/Super; buff hồi đồng đội của đùi giữa giữ nguyên.', 'Kiểm tra phát đủ ba đùi khi đang có hai gà thường; đo damage/hồi gốc, trần sát thương phụ và bắt đủ đùi.'],
  ],
};

const audit = JSON.parse(readFileSync('reports/mastery-review/baseline.json', 'utf8'));
const entries = [];
for (let n = 1; n <= 33; n++) {
  const id = `char_${String(n).padStart(2, '0')}`;
  const skills = MASTERIES.filter(s => s.characterId === id).sort((a,b) => a.goal-b.goal);
  assert.equal(skills.length, 3, id);
  assert.equal(designs[id]?.length, 3, id);
  skills.forEach((skill, i) => {
    const context = audit.rows.find((r: any) => r.characterId === id).contexts;
    const scores = context.map((c: any) => c.skills.find((s: any) => s.id === skill.id).score);
    assert.ok(designs[id][i].every(s => s.length > 35));
    entries.push({ number: entries.length+1, id: skill.id, characterId: id, characterName: character(id)?.name,
      name: skill.name, goal: skill.goal, legacy: skill.legacy, targeted: skill.targeted,
      currentDescription: skill.description, currentTradeoff: skill.tradeoff, currentForm: skill.form,
      baselineScores: scores, meanBaselineScore: scores.reduce((a: number,b: number)=>a+b,0)/scores.length,
      proposed: designs[id][i][0], benefitAndLimits: designs[id][i][1], verification: designs[id][i][2] });
  });
}
assert.equal(entries.length, 99);
assert.equal(new Set(entries.map(e=>e.id)).size, 99);
assert.deepEqual(new Set(entries.map(e=>e.id)), new Set(MASTERIES.map(e=>e.id)));
writeFileSync('reports/mastery-review/proposal-99.json', JSON.stringify({status:'proposal-only-awaiting-user-review', date:'2026-10-30', sourceEngine:audit.engine, entries},null,2));

const intro = `# Đề xuất tổng thể 99 Bí kỹ — bản duyệt ngày 30/10/2026

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

## Danh sách duyệt đủ 99 Bí kỹ
`;
let md=intro.replace('## Danh sách duyệt đủ 99 Bí kỹ', '## Mục lục duyệt theo nhân vật');
md+='\n| Nhân vật | Số Bí kỹ | Ba lựa chọn |\n| --- | --- | --- |\n';
for(let n=1;n<=33;n++) {
  const id=`char_${String(n).padStart(2,'0')}`;
  const group=entries.filter(e=>e.characterId===id);
  md+=`| [${n}. ${character(id)?.name}](#${id}) | ${String(group[0].number).padStart(2,'0')}–${String(group[2].number).padStart(2,'0')} | ${group.map(e=>e.name).join(' · ')} |\n`;
}
md+='\n## Danh sách duyệt đủ 99 Bí kỹ\n';
for(let n=1;n<=33;n++) {
  const id=`char_${String(n).padStart(2,'0')}`;
  const kit=characterKit(id);
  md+=`\n<a id="${id}"></a>\n\n### ${n}. ${character(id)?.name}\n\n**Bộ gốc theo mô tả:** ${kit?.normal}\n\n**Super gốc theo mô tả:** ${kit?.super}\n`;
  for(const e of entries.filter(e=>e.characterId===id)) {
    const pct=(v:number)=>(v*100).toLocaleString('vi-VN',{maximumFractionDigits:2})+'%';
    md+=`\n#### ${String(e.number).padStart(2,'0')}. ${e.name} · mốc ${e.goal}${e.legacy?' · Truyền thừa':''}\n\nID: \`${e.id}\`. Điểm mẫu cũ: **${pct(e.meanBaselineScore)}** (${e.baselineScores.map(pct).join(' / ')} ở hai đội hình).\n\n- **Hiện tại:** ${e.currentDescription} Đánh đổi: ${e.currentTradeoff}\n- **Đề xuất:** ${e.proposed}\n- **Lợi ích và giới hạn:** ${e.benefitAndLimits}\n- **Kiểm chứng riêng:** ${e.verification}\n`;
  }
}
md+=`\n## Điều kiện nghiệm thu sau khi duyệt\n\n1. **Đủ 99/99:** mỗi nhánh có kiểm thử cơ chế và kết quả so bộ gốc riêng; không dùng trung bình cả bộ để che nhánh làm yếu nhân vật. Chỉ gắn trạng thái “đạt” sau thực nghiệm.\n2. **Bộ thử cơ chế có đối chứng:** cố định mục tiêu/HP/vị trí khi cần đo đóng góp; thử điều kiện có/không xuất hiện, bị đệ/khiên chặn, chủ chết, hết lifetime, đầy trần vật thể, hai mặt vũ khí, vùng chồng và mục tiêu đổi/đã chết. Phân tách sát thương nền/phụ, hồi thực, hấp thụ khiên, thời gian khống chế/hỗ trợ và friendly fire.\n3. **Mô phỏng nhiều cấu hình:** cùng seed, vị trí và hai bên để đối chiếu bộ gốc với nhánh mới; tối thiểu bốn kiểu đối thủ (cận chiến, xạ thủ cơ động, chống chịu/hồi phục, khống chế), hai đội đồng minh phù hợp vai trò; Lv.1/10/20 hoặc mức tối đa được game cho phép, trang bị trống và trang bị phù hợp. Thử 1v1 với nhánh có ý nghĩa trong 1v1; 3v3 cho mọi nhánh; kiểm tra giảm hồi trong viễn chinh và boss.\n4. **Seed độc lập để xác nhận:** bắt đầu ít nhất 32 seed/cấu hình ưu tiên, mỗi seed đổi bên; tăng mẫu nếu kết quả còn bất định. Tách seed chỉnh thông số khỏi seed xác nhận. Báo khoảng tin cậy theo cụm seed, không coi các lượt dùng chung seed là độc lập. Số mẫu không tự bảo đảm đạt.\n5. **Lợi ích ròng:** nhánh tấn công cần chứng minh tăng sát thương hữu dụng trong vai trò mục tiêu; nhánh hỗ trợ cần chứng minh tăng hiệu quả hữu dụng và không làm đội tệ đi do mất công dụng nền. Đặt biên không suy giảm kết quả đội tối đa 3 điểm phần trăm trên nhóm cấu hình đại diện; nếu chưa đủ độ chắc để kết luận thì ghi “chưa đủ dữ liệu”, không coi là đạt. Mức +10–20%/+15–25% là đích điều chỉnh, không bắt mọi kèo đều tăng đúng tỷ lệ.\n6. **Kèo không thuận lợi:** nhánh tình huống phải giữ được năng lực nền khi không gặp điều kiện kích hoạt; thêm đạn/đệ không được vô tình chặn đồng đội, thay đổi hình học làm mất sát thương nhiều hơn phần lợi. Nếu có suy giảm lặp lại, sửa hành vi rồi mới tăng chỉ số.\n7. **Chống vượt ngân sách:** kiểm tra đội có ba Bí kỹ cùng hoạt động, ghép trang bị/cộng hưởng, trận dài 30/60/120 giây, ép góc, spam đạn và chuỗi năng lượng. Nhánh có lợi ích quá lớn so với hai lựa chọn còn lại phải cân lại hệ số phụ, không phạt bộ gốc vô điều kiện.\n8. **Tương thích và giao diện:** giữ ID/tiến độ/cấu hình đang lắp; giữ giới hạn Truyền thừa. Đổi phiên bản engine khi đổi luật; checkpoint/replay cùng phiên bản phải xác định. Cập nhật mô tả, VFX và sân thử theo đúng luật mới; thêm chỉ số so bộ gốc để người chơi thấy lợi ích thực.\n\n## Phạm vi bạn có thể duyệt\n\nCó thể duyệt toàn bộ định hướng, duyệt từng nhân vật bằng số 1–33, hoặc từng Bí kỹ bằng số 01–99. Việc duyệt bản này cho phép triển khai thiết kế và kiểm thử; con số cần điều chỉnh nếu không đạt các tiêu chí trên phải được ghi lại rõ ràng. Đây chưa phải xác nhận bản mới đã cân bằng hoặc lệnh phát hành production.\n\nDữ liệu cấu trúc: [proposal-99.json](../reports/mastery-review/proposal-99.json). Báo cáo trước thay đổi: [baseline.json](../reports/mastery-review/baseline.json). Công cụ tạo tài liệu: [build-proposal.ts](../reports/mastery-review/build-proposal.ts).\n`;
writeFileSync('docs/MASTERY_99_PROPOSAL_2026-10-30.md',md);
console.log(JSON.stringify({characters:Object.keys(designs).length,masteries:entries.length,document:'docs/MASTERY_99_PROPOSAL_2026-10-30.md',status:'proposal-only'}));
