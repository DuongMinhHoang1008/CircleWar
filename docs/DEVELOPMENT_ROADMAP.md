# Hướng phát triển tiếp theo cho CircleWar

Ngày đề xuất: 27/10/2026. Phạm vi: QoL, UX, nội dung giữ chân và thử thách hardcore.

Đây là đề xuất sản phẩm dựa trên việc đọc source hiện hành, chưa phải kế hoạch đã được triển khai. Chưa có dữ liệu hành vi người chơi hoặc kiểm thử UX trực tiếp; các vấn đề về trải nghiệm dưới đây là giả thuyết cần đo. Thứ tự phát hành quan trọng hơn mốc thời gian; chốt lịch sau khi chia nhỏ công việc.

## 1. Định hướng

Xây vòng lặp: **gặp một bài toán → chỉnh đội → xem kết quả → hiểu điểm cần sửa → thử lại → đạt mục tiêu mới**.

Giá trị dài hạn nên đến từ việc làm chủ đội hình, khám phá tương tác và chinh phục luật chơi mới. Sưu tập và lên cấp tiếp tục hỗ trợ hành trình đó. Trước mắt ưu tiên khai thác 33 nhân vật và 33 vật phẩm đang có; mỗi đợt content mới cần tạo thêm lựa chọn chiến thuật rõ ràng.

Ba nhóm người chơi cần có mục tiêu riêng:

| Nhóm | Câu hỏi game cần trả lời | Trải nghiệm chính |
| --- | --- | --- |
| Người mới | Tôi nên làm gì tiếp, và tại sao đội này hoạt động? | Hướng dẫn ngắn, đội mẫu, chương mở đầu |
| Người chơi thường xuyên | Hôm nay có bài toán gì đáng thử? | Mốc chinh phục, hành trình nhân vật, thử thách luân phiên |
| Hardcore | Tôi có thể thắng bằng quyết định tốt hơn không? | Cấp chuẩn hóa, luật giới hạn, nhiều seed, thành tích có thể đối chiếu |

## 2. Nền hiện có và khoảng trống

| Đã có trong source | Hướng phát triển tiếp |
| --- | --- |
| Đi ải với tối đa 729 tổ hợp có liên kết, tám lối đánh, boss mỗi 5 ải; đội phối hợp tốt hơn từ ải 31/61 | Tạo cấu trúc chương và mục tiêu đặc thù để người chơi cảm nhận được tiến trình |
| Kho đồ, luyện bài, trao đổi; mỗi đội tối đa ba nhân vật, mỗi nhân vật một vật phẩm | Preset, tìm/lọc trong kho, so sánh trang bị, khóa thẻ yêu thích |
| Pack thường/Boss, pity, mở nhiều pack, bỏ qua animation, xem lại kết quả; nhiệm vụ ngày và hòm thư | Bảo toàn thưởng khi đầy kho, mục tiêu chọn được, phần thưởng có ý nghĩa khi gần max |
| Tùy chọn VFX, damage, hồi phục/khiên, âm thanh, giảm hiệu ứng; đã có đánh dấu đội mình | Màn hình chiến đấu dễ đọc hơn, điều khiển xem lại, tóm tắt sau trận |
| Lưu 200 thống kê trận trên trình duyệt, gồm damage và hỗ trợ; có mô phỏng và báo cáo cân bằng | Biến số liệu thành gợi ý thử nghiệm; bổ sung dữ liệu cần thiết cho replay đầy đủ |
| Engine deterministic, version, seed, replay và server mô phỏng trận phòng | Tận dụng để làm encounter cố định và kiểm chứng thử thách; bổ sung xác thực tiến trình trước thi đấu công khai |

Điểm cụ thể cần giải quyết:

- Đổi đội hiện thao tác trực tiếp lên một đội đang dùng; bỏ quân khỏi đội xóa cấu hình trang bị của quân đó. Preset giúp thử nhiều cách phối hợp mà không phải dựng lại.
- Luyện bài có preview EXP/cấp và bảo vệ thẻ đang trong đội hoặc đang gắn, nhưng chưa có khóa yêu thích độc lập. Cần bảo vệ cả thẻ có giá trị nằm ngoài đội.
- Thưởng đi ải bị giới hạn bằng sức chứa pack thường; popup báo phần vượt nhưng chưa giữ lại phần đó. Hiện sức chứa là 150 và pack tự hồi mỗi phút, tương đương đầy sau 2,5 giờ từ kho rỗng nếu không mở hoặc nhận thêm. Đây là điểm cần kiểm tra về áp lực quay lại và cảm giác mất thưởng.
- Đi ải hiện tập trung vào ải kế tiếp; sau khi cấp đạt trần 10, số ải lớn hơn cần thêm mục tiêu và luật chơi có bản sắc.
- Thất bại đưa người chơi về thông báo chỉnh team rồi thử lại, chưa có luồng xem nhanh số liệu và đổi build tại chỗ.
- Các tài liệu README/IMPLEMENTATION_STATUS và một phần GAME_DESIGN còn mô tả phiên bản cũ. Cần cập nhật nguồn mô tả sản phẩm trước khi dùng để lập backlog.

## 3. Ưu tiên 1 — Giảm thao tác và giữ an toàn cho bộ sưu tập

### Preset đội hình

- MVP có năm preset, đặt tên, sao chép, đổi tên và lưu cả ba quân cùng trang bị.
- Chuyển preset ngay tại màn hình trước ải; xem liên kết/hội được kích hoạt và vật phẩm còn thiếu.
- Preset chỉ tham chiếu thẻ sở hữu. Khi thẻ bị trao đổi hoặc luyện mất, đánh dấu thiếu và cho chọn thay thế; không tự đổi quân hoặc đồ.
- Áp dụng cả preset trong một giao dịch; mỗi vật phẩm vẫn chỉ gắn một nhân vật. Khóa thay đổi đội đang tham gia trận.
- Có thao tác khôi phục build vừa dùng trước khi đổi preset.

**Nghiệm thu:** đổi giữa hai đội đầy đủ bằng tối đa hai thao tác từ màn hình trước trận; reload giữ đúng đội và trang bị; preset thiếu thẻ không làm mất cấu hình đã lưu.

### Kho đồ và luyện bài

- Tìm theo tên; lọc theo vai trò, cơ chế như giảm hồi phục/khống chế, cấp, rarity gốc và trạng thái trang bị.
- Phân biệt rõ rarity khi rơi với bậc tiến hóa hiện tại.
- Khóa yêu thích dùng chung cho luyện và trao đổi. Thẻ thuộc preset có cảnh báo khi chọn làm nguyên liệu.
- So sánh đồ đang gắn và đồ mới: chỉ số thay đổi, hợp cạ, khả năng biến hình và vật phẩm đang được ai dùng.
- Trước khi luyện, hiện danh sách thẻ mất, EXP hữu ích và EXP vượt trần; chỉ xác nhận thêm ở thao tác phá hủy này.
- Điện thoại có nút thêm/thay/tháo rõ ràng; mọi thao tác đều thực hiện được bằng chạm.

**Nghiệm thu:** không thể hy sinh hoặc trao đổi thẻ đã khóa; người chơi thấy phần EXP bị dư trước khi xác nhận.

### Phần thưởng và trạng thái đồng bộ

- Giữ một giới hạn riêng cho pack tự hồi; phần thưởng đã kiếm được chuyển vào kho thưởng chờ hoặc thư hệ thống khi đầy.
- MVP tận dụng hòm thư: cho nhận phần vừa sức chứa, lưu số còn lại và định danh thưởng để reload/retry không nhận trùng.
- Phân biệt trạng thái đã lưu trên máy, đang đồng bộ, đã đồng bộ, cần thử lại bằng thông báo ngắn tại nơi liên quan.
- Điều chỉnh thời gian tích pack sau khi đo độ dài phiên và nhịp quay lại. Thử nghiệm sức chứa đủ một khoảng nghỉ dài, thay vì thêm nhắc nhở liên tục.

**Nghiệm thu:** thắng boss khi đầy kho vẫn giữ đủ toàn bộ thưởng; nhận một phần rồi tải lại giữ đúng số dư; lỗi mạng có đường khôi phục rõ ràng.

## 4. Ưu tiên 2 — Giúp người chơi hiểu và sửa đội

### Luồng trước và sau trận

Màn hình trước ải đặt đội mình và đội địch cạnh nhau, có đổi preset, sửa đồ và bắt đầu ngay tại chỗ. Trình bày cơ chế nổi bật của địch, liên kết đang bật và luật boss được cường hóa. Các trường hợp như thiếu vật phẩm được cảnh báo nhưng vẫn cho thử.

Sau trận có ba hành động chính: **thử lại → sửa đội → đi tiếp**. Tóm tắt ngay trên màn hình: ai bị hạ đầu tiên, ai sống lâu nhất, damage thực, hồi phục thực, khiên hấp thụ và số lần liên kết kích hoạt. Cho mở Phân tích số liệu để xem chi tiết.

Gợi ý cần dựa vào sự kiện đã ghi: “chủ lực bị hạ trước lần Super đầu” hoặc “liên kết không kích hoạt”. Một trận đơn lẻ chưa chứng minh nguyên nhân thua; gợi ý là cách thử tiếp. Các nhận xét cần dữ liệu mới, như thời điểm Super đầu tiên, phải bổ sung recorder trước khi hiển thị.

**Nghiệm thu:** từ màn hình thua có thể thay một vật phẩm và thử lại mà không phải qua menu chính.

### Onboarding và điều hướng

- Ba bài tập ngắn bằng quân cho mượn: trang bị hợp cạ, bật một liên kết, đổi build để vượt một đội có cơ chế rõ ràng.
- Mỗi bài chỉ giới thiệu một quyết định; cho bỏ qua và xem lại.
- Trang chính đưa ra mục tiêu tiếp theo: ải đang dở, boss gần nhất, thử thách tuần hoặc mốc nhân vật.
- Đưa Chơi, Đội hình và Bộ sưu tập lên luồng chính; giữ mô phỏng, báo cáo cân bằng và tùy chỉnh sâu trong khu vực phụ.
- Hỗ trợ bàn phím, focus rõ, nhãn văn bản cho trạng thái và tín hiệu phân biệt đội ngoài màu sắc. Vẫn giữ các tùy chọn giảm hiệu ứng hiện có.

### Xem lại và mô phỏng

- Ưu tiên tốc độ 1×/2× cho PvE cục bộ, pause và xem chậm trong mô phỏng/replay đã kết thúc.
- Bảng kết quả cho phép thử thay một quân hoặc một món đồ rồi so trên cùng bộ seed; luôn kèm bộ seed khác để kiểm tra độ ổn định.
- Thống kê 200 trận hiện là bản tóm tắt, chưa bảo đảm có đủ dữ liệu phát lại. Replay cần cấu hình đầu trận, phiên bản engine/content, seed hoặc frame phù hợp và chính sách lưu trữ riêng.
- Tăng tốc hiển thị multiplayer không thay đồng hồ, kết toán hoặc kết quả chính thức của phòng.

## 5. Ưu tiên 3 — Nội dung tạo lý do quay lại

### Campaign theo chương

MVP tổ chức lại 30 ải đầu thành ba chương, mỗi chương 10 ải, tái sử dụng encounter hiện có và giữ tiến trình đã đạt. Mỗi chương giới thiệu một nhóm cơ chế, có mốc boss và phần thưởng lần đầu rõ ràng. Cho xem lại ải đã vượt để luyện đội; thưởng lặp lại tách khỏi thưởng lần đầu.

Thêm huy chương phụ tự chọn, tối đa một mục tiêu mỗi encounter: thắng với ít nhất một quân cho mượn được chỉ định, thắng bằng đội có hai vai trò khác nhau, hoặc thắng khi không dùng vật phẩm hợp cạ. Mỗi mục tiêu cần được mô phỏng trước để bảo đảm có lời giải khả thi. Qua ải bình thường không bắt buộc làm huy chương.

### Hành trình nhân vật

- Mỗi đợt chọn một nhóm nhỏ, thí dụ sáu nhân vật, có ba nhiệm vụ chiến thuật riêng từng người.
- Mục tiêu thể hiện bản sắc: hấp thụ khiên cho đồng đội, kích hoạt liên kết, thắng một encounter khắc chế bằng cách đổi trang bị.
- Thưởng chân dung, danh hiệu, khung hoặc câu chuyện ngắn. Cho tiến độ ở nhiều chế độ phù hợp; không buộc farm một ải hàng trăm lần.
- Khi bộ sưu tập gần max, thành tựu và cosmetic vẫn là mục tiêu có giá trị. Chỉ thêm hệ thống chuyển đổi pack dư sau khi mô phỏng nguồn/cầu; hạn chế phát sinh tiền tệ mới ở MVP.

### Nội dung luân phiên

Bắt đầu bằng một thử thách tuần gồm ba encounter có chủ đề, có quân cho mượn và chơi được bất kỳ lúc nào trong tuần. Nhiệm vụ ngày hiện có được mở rộng bằng lựa chọn mục tiêu PvE/PvP tương đương, tránh bắt buộc thắng PvP khi ít người online. Hiện rõ thời điểm reset theo giờ địa phương; không cần duy trì chuỗi đăng nhập để giữ tiến độ.

Mỗi đợt content nên có một đội địch có bản sắc, một luật giới hạn hoặc một tương tác đáng học. Đo mức sử dụng và khám phá roster trước khi quyết định thêm nhiều card mới.

## 6. Ưu tiên 4 — Hardcore bằng chiều sâu quyết định

### A. Thử thách tuần chuẩn hóa — làm đầu tiên

- Mọi người dùng chung pool cho mượn, nhân vật và vật phẩm chuẩn Lv.10; thành tích tách khỏi sức mạnh bộ sưu tập.
- Ba đội địch cố định theo tuần, mỗi đội kiểm tra qua ba seed. Một lượt đánh giá gồm đủ chín trận, lưu tiến độ để có thể tiếp tục.
- Bộ seed luyện tập công khai khác bộ seed đánh giá. Công bố luật, đội địch, pool và phiên bản; chỉ công bố seed đánh giá khi đợt thi đấu đóng.
- MVP chỉ có huy chương cá nhân và chia sẻ build. Thưởng nhận một lần mỗi mốc, không farm pack vô hạn.
- Khi mở leaderboard: chấm số trận thắng trước; đồng điểm chia sẻ hạng. Chưa dùng DPS hoặc thời gian làm tiêu chí phụ vì dễ làm lệch giá trị của đội hỗ trợ.
- Leaderboard dự kiến tối đa ba lượt đánh giá trọn bộ mỗi tuần, lấy lượt tốt nhất; luyện tập không giới hạn. Không chọn riêng kết quả đẹp của từng seed để ghép thành một lượt.
- Mỗi tuần khảo sát nhiều đội khả thi, tỷ lệ sử dụng và độ lệch giữa seed. Mục tiêu là có nhiều lời giải, không thành bài toán tìm đúng một đội bí mật.

### B. Hợp đồng thử thách — mở rộng cùng hệ thống

Sau khi thử thách chuẩn hóa vận hành tốt, cho chọn từ một đến ba điều kiện tăng khó và nhận huy hiệu tương ứng:

- Chỉ dùng card có rarity gốc tối đa Hiếm; cho mượn đủ quân hợp lệ.
- Không dùng vật phẩm hợp cạ, áp dụng theo luật encounter công khai.
- Giảm hiệu quả hồi phục cho cả hai phía; hiển thị hệ số trước trận.

Mỗi hợp đồng có phiên bản và thành tích riêng. Mô phỏng cả tổ hợp điều kiện; loại các tổ hợp không có lời giải thực tế. Cường hóa chỉ số boss phải hiện rõ. Không tăng trần level để thay thế thử thách chiến thuật.

### C. Viễn chinh draft — làm sau khi chứng minh được vòng lặp

Một run sáu trận: chọn một trong ba quân/đồ ở các chặng, thấy trước loại đối thủ, có hai điểm rẽ giữa đường an toàn và đường khó. Nội dung trong run tách khỏi bộ sưu tập; thưởng chủ yếu là mốc hoàn thành và cosmetic.

MVP hồi đầy HP mỗi trận và giới hạn số lần thất bại. HP tồn dư, tài nguyên hồi phục và boss nhiều phase để ở bước sau vì cần thiết kế state qua nhiều trận và thêm kiểm thử engine. Thử độ dài phiên với người chơi trước khi tăng số encounter.

### Điều kiện trước khi mở thi đấu công khai

Luồng SAVE hồ sơ hiện kiểm tra cấu trúc rồi nhận nhiều dữ liệu tiến trình từ client; đi ải cục bộ cũng tự kết toán thưởng ở client. Đây là giới hạn cần xử lý trước leaderboard hoặc phần thưởng thi đấu có giá trị.

- Server xác thực thao tác thay vì nhận tùy ý toàn bộ trạng thái tiến trình.
- Server phát encounter/lượt dự thi, khóa loadout, seed và phiên bản; tính hoặc xác minh kết quả bằng engine.
- Kết toán dùng định danh lượt để retry không nhân thưởng; lưu được lượt đang dở và xử lý mất kết nối.
- Leaderboard có hồ sơ ổn định, giới hạn lượt, quy tắc hòa điểm và chính sách khi bản cân bằng đổi giữa tuần.
- Thành tích không kiểm chứng được giữ ở khu vực cá nhân. Có thể phát hành thử thách PvE cá nhân trước khi hoàn thành phần thi đấu công khai.

## 7. Thứ tự phát hành

| Đợt | Kết quả người chơi nhận được | Phạm vi MVP | Điều kiện chuyển bước |
| --- | --- | --- | --- |
| 1 | Đổi build nhanh, bộ sưu tập an toàn, không mất thưởng đã kiếm | Preset + lọc kho + khóa thẻ + thưởng chờ + trạng thái đồng bộ | Hoàn thành các tiêu chí nghiệm thu QoL; kiểm tra reload/mất mạng/đầy kho |
| 2 | Hiểu trận đấu và sửa đội ngay sau khi thua | Trước/sau trận + ba bài hướng dẫn + tốc độ PvE + đường dẫn đến số liệu | Người mới tự trang bị, bật liên kết và thử lại trong bài kiểm tra UX |
| 3 | Có hành trình dài và bài toán mới mỗi tuần | Ba chương đầu + một thử thách tuần chuẩn hóa + huy chương cá nhân | Có nhiều build khả thi; tỷ lệ quay lại/thử build tăng so với baseline |
| 4 | Có nơi chứng minh trình độ | Xác thực tiến trình/kết quả + leaderboard thử thách tuần + hợp đồng | Kết quả tái kiểm chứng được, không nhân thưởng khi retry, đủ người tham gia |
| 5 | Có nhiều kiểu phiên chơi để lựa chọn | Hành trình nhân vật + viễn chinh draft; đánh giá PvP chuẩn hóa | Người chơi chủ động chơi lại; pipeline encounter đáp ứng được nhịp ra nội dung |

PvP xếp hạng là bước cân nhắc sau: cần đủ lượng người cùng online, cấp chuẩn hóa và cơ chế ghép trận. Trước đó, thử thách bất đồng bộ tận dụng tốt hơn quy mô cộng đồng nhỏ.

## 8. Đo hiệu quả

Các chỉ số dưới đây là kế hoạch đo, chưa có baseline và chưa phải cam kết tăng trưởng.

| Mục tiêu | Cách đo | Tiêu chí thử nghiệm ban đầu |
| --- | --- | --- |
| Giảm thao tác | Thời gian từ trước ải → đổi build → bắt đầu | Đổi preset tối đa hai thao tác; so sánh thời gian thực hiện trước/sau |
| Dễ hiểu | Bài thử với tám người chưa biết game | Ít nhất sáu người tự gắn đồ, bật liên kết và sửa đội sau thua mà không cần hướng dẫn ngoài game |
| Sẵn sàng thử lại | Tỷ lệ thua → sửa đội → bắt đầu lại trong cùng phiên | Tăng so với cohort trước phát hành; đo riêng người mới và lâu năm |
| Giữ chân | D1/D7 theo ngày lịch địa phương của cohort người chơi mới | Chốt mức cải thiện sau khi có baseline; đo cùng tỷ lệ hoàn thành trận đầu |
| Khuyến khích khám phá | Số preset/build khác nhau thực sự được đem vào trận mỗi tuần | Tăng độ đa dạng mà không làm tăng bỏ cuộc ở màn hình chuẩn bị |
| Hardcore lành mạnh | Lượt hoàn thành, phân bố huy chương, đội lọt top, chênh lệch theo seed | Nhiều đội có kết quả cạnh tranh; kiểm tra riêng đội hỗ trợ và đội sát thương |
| Tin cậy | Thưởng bị mất, kết toán trùng, lỗi đồng bộ, trận chưa kết thúc | Thưởng mất/trùng bằng 0 trong kiểm thử; theo dõi lỗi thực tế sau phát hành |

Event tối thiểu: bắt đầu/kết thúc trận, xem kết quả, mở/sửa/áp preset, đổi trang bị, bắt đầu lại sau thua, thưởng chờ/nhận thưởng, vào/hoàn thành thử thách. Dùng định danh giả danh ổn định và phiên bản content để so cohort; tổng hợp lỗi, tránh thu nội dung trao đổi hoặc token.

## 9. Điểm chạm kỹ thuật và nguồn đối chiếu

- `apps/web/src/main.tsx`: kho đồ, đội đang dùng, luyện, nhiệm vụ ngày, đi ải, thưởng và điều hướng. Khi triển khai nên tách dần theo tính năng ngay tại phần được sửa, giữ logic giao dịch có thể kiểm thử riêng.
- `packages/shared/src/progression.ts`, `packs.ts`, `campaign.ts`, `campaign-tactics.ts`: cấp/EXP, sức chứa 150, luật pack, thưởng, tạo encounter và tám lối đánh. Dùng chung schema/rules có version cho mode mới.
- `apps/web/src/rendering/Arena.tsx`: nhịp hiển thị, xem trận và điều khiển playback; tách thời gian hiển thị khỏi kết quả engine khi thêm tốc độ.
- `apps/web/src/battleAnalytics.ts`, `BattleAnalyticsPage.tsx`: nền số liệu sau trận; cần schema mới nếu thêm timeline Super hoặc replay đầy đủ.
- `apps/web/src/profileStorage.ts`, `apps/worker/src/index.ts`, `packages/shared/src/mailbox.ts`: lưu/đồng bộ, hồ sơ, trao đổi, thưởng chờ và thao tác server.
- `apps/web/src/gameSettings.ts`, `SettingsPage.tsx`: giữ và mở rộng tùy chọn hiện có khi làm UX trận đấu.
- `apps/web/src/PatchNotes.tsx`, `reports/roster-balance-v31.md`: đối chiếu phiên bản hiện hành. Báo cáo mô phỏng là bằng chứng về mẫu đã chạy, chưa thay thế dữ liệu người chơi thật.

Kiểm thử triển khai tập trung vào các bất biến có tác động: trang bị không trùng chủ, preset không làm mất đồ, thẻ khóa không bị tiêu thụ, EXP và thưởng đúng, reload/retry không nhân kết toán, playback không đổi kết quả, cùng encounter/version/loadout/seed cho cùng kết quả. Mọi modifier mới cần audit nhiều đội và seed trước phát hành.

**Backlog nên bắt đầu bằng preset đội hình, bảo toàn thưởng đầy kho, bảo vệ thẻ và luồng sửa đội sau thua.** Đây là nền để người chơi tận dụng được content và thử thách ở các đợt tiếp theo.
