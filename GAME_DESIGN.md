# Thiết kế gameplay hiện hành

## Mô hình thẻ bài và trận đấu hiện hành

Mỗi phòng chơi một trận quyết định. Người chơi tạo phòng PvP, chọn đội từ bộ sưu tập, sẵn sàng và bắt đầu; trận kết thúc khi còn một đội sống. Chế độ đi ải cho phép một người đấu với đội đối thủ do máy tạo, độ khó tăng theo số ải đã chơi. Cả hai chế độ dùng chung đấu trường hình tròn, nhân vật, vật phẩm, kỹ năng, vật lý và replay của battle engine.

Hồ sơ người chơi được lưu độc lập với room trong Durable Object; thanh điều hướng chính có Mở pack, Kho đồ, Đi ải cạnh Đấu trường tập, Mô phỏng và Multiplayer. Người chơi mới bắt đầu sở hữu Hổ Hướng Nội và có 10 pack. Pack tự hồi một pack mỗi phút trong hàng chờ tối đa 10, không cần nhận thủ công. Mở pack có hiệu ứng và luôn rút đúng một thẻ nhân vật hoặc vật phẩm. Trùng thẻ cộng 50 EXP; mỗi 100 EXP tăng một cấp đến tối đa cấp 10. Cả thẻ nhân vật và vật phẩm lưu level/EXP thay vì số lượng bản sao. Một nhân vật chỉ trang bị một vật phẩm, mỗi thẻ vật phẩm chỉ trang bị cho một nhân vật; vật phẩm được giữ trong bộ sưu tập sau trận. Tier hiển thị từ T1 đến T4, ánh xạ rarity vật phẩm và tier nhân vật; tỷ lệ pack: T1 55%, T2 28%, T3 13%, T4 4%.

Thắng PvP nhận ba pack; thắng ải nhận một pack. Nhiệm vụ bộ sưu tập gồm bóc ba thẻ, thắng một trận PvP và thắng một ải; mỗi nhiệm vụ chỉ nhận thưởng một lần và cho một pack. Mọi pack thưởng chịu giới hạn kho 10 pack. Người chơi thua PvP hoặc ải không nhận pack trận.

## Luồng auto chess cũ

Các mục Shop, Gold, bench, nâng giới hạn sân và vòng loại bên dưới là thiết kế của nhánh auto chess trước đây và không còn là giao diện gameplay hiện hành. Trận mới không dùng vòng shop hay round loại người; phần chi tiết chiến đấu và item trong tài liệu vẫn mô tả các nội tại/hiệu ứng của battle engine được tái sử dụng.

## Vòng đấu

2–20 người. Mỗi người chọn đúng một nhân vật khởi đầu trong lobby; không còn cài đặt số quân ban đầu. Người chơi bắt đầu với 100 Player HP và 10 Gold. Chỉ nhân vật đã triển khai ra sân mới tham chiến; quân dự bị nằm trong bench. HP nhân vật phục hồi ở đầu mỗi vòng qua snapshot mới, level và trang bị tồn tại giữa vòng. Class HP và Player HP độc lập.

Sẵn sàng khi chuẩn bị sẽ khóa giao dịch của riêng người đó. Hết deadline dùng loadout hợp lệ cuối cùng. Server precompute, client replay, server kết toán một lần. HP người chơi về zero bị loại, vẫn xem được. Lần lượt bị loại cùng vòng giữ thứ hạng deterministic. Người cuối còn HP thắng. Chủ phòng có thể mở rematch sau FINISHED.

## Chiến đấu

Pool hiện hành có 20 nhân vật với nội tại, chiêu tự động và Super riêng; catalog và bộ chiêu tại CHARACTER_POOL_DESIGN.md, phân loại/liên kết tại TEAM_SYNERGY_DESIGN.md. Class hiển thị và race là nhãn đội hình, không cộng thêm nội tại khung engine cũ. Level 5 áp dụng một nâng kỹ năng của hồ sơ. Super tự dùng ở 100 năng lượng; năng lượng từ damage/đồ/liên kết cùng chịu trần 12 mỗi nhân vật mỗi tick. Super kéo dài 120 tick trừ các hiệu ứng tức thời được mô tả riêng. Sức mạnh Super nhân damage, hồi HP, khiên và hiệu quả xuyên của chiêu tương ứng; không tăng thời gian, số lượt hoặc buff tốc độ. Kỹ năng đo theo tick, không theo FPS.

Không friendly fire. Đồng đội va chạm vật lý. Vũ khí là capsule xoay theo 32 hướng; cooldown từng weapon–target. Đạn tối đa 240, TTL 90 tick, ra ngoài tường bị hủy, swept collision, một đạn không trúng cùng người hai lần. Nguồn chết dừng gây damage, kể cả đạn/DoT/vùng đã tạo trong bản này. Thorns là phản damage có trần, không phản dây chuyền.

Spawn shuffle 60 ô bằng seed riêng, không trùng. Arena cố định 1200×720 world units. **Không giới hạn thời gian chiến đấu**: chỉ kết thúc khi còn tối đa một đội sống; không xếp thắng thua vì hết giờ. Cấu hình `shrinkSeconds` chỉ điều khiển tường: bắt đầu ở một nửa mốc này (tối đa giây 30). Một phần ba đầu của giai đoạn thu chỉ thu cạnh dài để tạo hình vuông nội tiếp; sau đó thu đều bốn cạnh, dừng ở hình vuông có cạnh bằng 40% cạnh ngắn ban đầu. Mặc định: giây 30 bắt đầu, giây 40 thành vuông 720×720, giây 60 dừng ở vuông 288×288 world units, luôn nằm giữa sân. Bo là tường cứng: giữ toàn bộ bán kính nhân vật bên trong và phản xạ vận tốc, không gây sát thương. Đạn chạm bo bị hủy như khi chạm tường ngoài. Đội còn sống xếp trên các đội đã bị loại, sau đó theo elimination tick, HP, damage và ID ổn định để phân xử cùng tick.

**Tăng nhịp trong round:** mỗi 10 giây thêm một mốc, tối đa 20 mốc (giây 200). Tính cộng tuyến tính từ chỉ số đầu round sau level/trang bị: ATK +12%/mốc (trần 300), speed +5%/mốc (trần 900), tốc độ đánh +8%/mốc (cooldown = floor(cooldown gốc / (1 + 0,08 × mốc)), tối thiểu 8 tick), charge +5%/mốc (trần 300), superPower +10%/mốc (trần 300). Mốc giây 30 tương ứng +36% ATK, +15% speed và +24% tốc độ đánh trước làm tròn/trần. Vận tốc đang chạy và cooldown cận chiến còn lại được điều chỉnh theo chỉ số mới. HP, giáp, tầm đánh và khối lượng không tăng theo thời gian. `baseStats` lưu riêng trong snapshot để không nhân chồng hoặc lệch checkpoint. Sang round mới tạo snapshot từ loadout/level/trang bị, mọi tăng nhịp reset về 0; không tăng level hoặc sửa đồ của người chơi. HUD hiển thị mức ATK/speed tăng theo thời gian, mức thực tế còn chịu trần chỉ số.

## Kinh tế và vật phẩm

Thứ hạng tương đối `(rank−1)/(count−1)` quyết định: ≤.11 nhận 12G/mất 0HP; ≤.27:10G/2HP; ≤.48:8G/4HP; ≤.74:7G/7HP; còn lại:6G/10HP. Với hai người, người thắng 12G/0HP, người thua 6G/10HP. Người bị loại không nhận các vòng sau. Không cược, thanh toán, nạp hoặc rút tiền.

Shop có 20 vật phẩm, gồm 8 phụ kiện và 12 tiêu hao, cùng nhân vật T1/T2. Mỗi round có 5 ô hàng; mỗi ô có xác suất 52% là nhân vật và 48% là vật phẩm. Nhân vật T1 giá 3G, T2 giá 4G. Reroll giá 2G hoặc dùng lượt reroll miễn phí khi comeback. Bàn cờ tướng (item_20) hợp cạ Hoàng Tử Ngậm Hoa: +12 khiên đầu trận, thêm 8 khiên đầu trận khi đúng chủ; mỗi lần Hoàng Tử tung Super, đồng minh yếu máu nhất trong tầm nhận thêm 8 khiên.

Mỗi người có bench tối đa 5 nhân vật và túi vật phẩm tối đa 8 món. Mua nhân vật đưa thẳng vào bench; kéo bản sao cùng nhân vật và cùng level chồng lên nhau để hợp nhất, giới hạn level 10. Vật phẩm mua vào túi, rồi trang bị lên quân đang ra sân; trang bị của bản sao bị tiêu thụ khi hợp nhất được trả về túi. Khi túi không còn chỗ, thao tác hợp nhất sẽ bị từ chối để không làm mất đồ.

Giới hạn quân ra sân bắt đầu ở 1. Nâng lên 2 quân giá 5G; nâng lên 3 quân giá 10G. Nút nâng giới hạn luôn nằm ngoài shop và không bị thay khi reroll. Chỉ quân trên sân được tính vào chiến đấu và synergy. Người chơi bắt đầu với 10G, nhận thêm Gold theo thứ hạng sau từng round theo bảng thưởng bên dưới.

Mỗi người có hai ô phụ kiện và một ô tiêu hao; không mang hai phụ kiện cùng ID. Vũ khí định danh theo nhân vật, nâng II ở level ≥3 giá 8G (+2 ATK), III ở level ≥6 giá thêm 12G (tổng +4 ATK/+10 sức mạnh Super). Trang bị thay/tháo trở về túi. Consumable bị tiêu thụ đúng một lần khi kết toán. Level 1 là chỉ số gốc; mỗi level hợp nhất trên level 1 thêm +18 HP/+2 ATK. Chỉ số từ đồ/affinity/bậc vũ khí vào baseline trước tăng nhịp. Một đặc tính và một liên kết đôi hoặc bộ ba mỗi đội, khóa trong snapshot; không kích dây chuyền hoặc nhân thưởng theo bản sao. Base → level → equipment/weapon/affinity/trait đầu round → tăng nhịp → buff động → clamp. Legacy item không xuất hiện trong pool mới.

Sau mỗi vòng sống sót, chọn một trong ba offer; HP<60 có bốn offer, HP<35 có thêm một reroll miễn phí, HP<15 có một khiên cứu trợ một lần mỗi trận. Comeback có thể tắt trong lobby. Không chọn reward trước khi sẵn sàng sẽ bỏ lượt chọn đó khi vòng mới được sinh. Các tham số rarity và comeback hiện tập trung trong các hàm offers/prepare; chưa có giao diện tùy biến toàn bộ balance.
