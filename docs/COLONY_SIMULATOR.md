# Mô phỏng đàn kiến

Menu → Tra cứu → Mô phỏng đàn kiến. Công cụ chạy Web Worker, không render trận, không thay hồ sơ/phần thưởng. Người dùng tự bấm Bắt đầu; rời trang hoặc Dừng sẽ kết thúc worker. Dừng chỉ giữ bản tiến độ gần nhất; kết quả đó chưa hoàn tất đánh giá.

Mỗi người giữ đội 3 nhân vật khác nhau, tối đa một trang bị/người và không trùng đồ giữa đội; Bí kỹ đúng nhân vật, tối đa một Truyền thừa. Có lựa chọn không đồ/không Bí kỹ. Tất cả cùng cấp cấu hình; mục tiêu hỗ trợ được chọn lại khi đội đổi. Thứ tự vị trí là một phần của đội hình.

Khởi đầu đều ngẫu nhiên. Mỗi thế hệ xáo trộn ghép cặp theo số lượt cấu hình. Một cặp đấu hai trận đổi bên cùng seed bằng engine thật. Thắng tích điểm cho nhân vật, đồ, Bí kỹ, build nhân vật/đồ/Bí kỹ và cặp nhân vật cùng đội. Hòa không thưởng. Điểm bay hơi mỗi thế hệ, chặn trong [0,1; 30]. Thưởng là tín hiệu liên hệ với thắng, không phải đóng góp nhân quả độc lập.

Theo xác suất đổi đội: giữ nguyên hoặc thử đội mới. Trong các lần đổi, 75% thay một vị trí và 25% dựng lại cả đội. Chọn theo điểm hấp dẫn kết hợp xác suất khám phá đều. Không bảo đảm một lần đổi phải tạo đội khác; UI ghi số lần đội thực sự đổi. Lịch sử ứng viên giới hạn khoảng 5.000 build để tránh tăng bộ nhớ vô hạn.

Chọn ứng viên từ lịch sử bằng (điểm + 2)/(số trận + 4). Vòng cuối độc lập với thưởng: mọi ứng viên đấu cùng seed mới và cùng tập đối thủ, một nửa ngẫu nhiên mới, một nửa đội học được (có thể gồm chính ứng viên để giữ cùng phân phối). Xếp cuối theo tỷ lệ thắng; hòa riêng; khi bằng dùng điểm thắng + nửa hòa. Đây là đội tốt nhất trong ứng viên/tập mẫu đã thử, không chứng minh tối ưu toàn cục. Hai trận đổi bên không độc lập.

UI chỉnh seed, quần thể, thế hệ, lượt ghép cặp, xác suất đổi, khám phá, bay hơi, cấp, số ứng viên và đối thủ đánh giá; hiển thị ước tính tổng trận, tốc độ, đa dạng quần thể, bảng đội/build, điểm hấp dẫn và xuất JSON gồm cấu hình của lượt chạy, engine và kết quả. Chưa có resume checkpoint hoặc phân phối nhiều máy. Một worker tính toán; tab nền có thể bị trình duyệt giảm tốc.

Kiểm thử: colony.test.ts dùng evaluator giả để xác minh luật, seed, điểm và tập đánh giá; colony-browser.ts chỉ chạy smoke 8 trận, kiểm tra nút dừng và UI mobile. Không tự chạy lượt tìm kiếm lớn thay người dùng.

## Bảng kết quả

Có năm nhóm: Đội, Nhân vật, Trang bị, Nhân vật × Trang bị, Nhân vật × Bí kỹ. Mỗi nhóm ghi số lần xuất hiện theo đội và số trận thắng/hòa/thua; không dùng điểm hấp dẫn làm tỷ lệ thắng. Thành phần lặp trong cùng đội (ví dụ không trang bị) chỉ được ghi một lần cho mỗi trận; xuất hiện ở hai bên ghi riêng. Nhóm Đội phân biệt đầy đủ build và vị trí. Các trận học ghi hai bên; đánh giá cuối chỉ ghi ứng viên để khớp bảng xếp hạng. Dữ liệu tách theo phase và xuất đủ trong JSON.

Các cột tên/số trận/thắng/hòa/thua/tỷ lệ thắng/điểm đều sort hai chiều, dùng giá trị số chưa làm tròn. Có tìm kiếm, lọc số trận tối thiểu và phân trang 25 dòng. Vòng đánh giá hiện tại có thể thiếu nhân vật/trang bị không nằm trong ứng viên; chuyển Các trận học để xem phạm vi quần thể. Tỷ lệ thắng của nhân vật/build là kết quả đội có lựa chọn đó, không phải đánh giá nhân quả riêng. Cần lượt mô phỏng mới để thu thập thống kê mới. Worker gửi cập nhật tối đa khoảng hai lần/giây giữa các chuyển phase để giảm chi phí sao chép dữ liệu.

## Hiển thị toàn bộ dữ liệu

Mặc định bảng là Toàn bộ dữ liệu đã ghi, cộng số đếm trận học và phía ứng viên đánh giá cuối theo từng ID; không giới hạn ở finalists hay archive dùng để học. Nhóm Đội giữ mọi đội trong statistics, kể cả đội đã bị loại khỏi archive tìm kiếm. Các phase gốc vẫn giữ riêng trong JSON; allStatistics là bảng cộng hoàn chỉnh.

Các bảng thành phần luôn chứa đủ 33 nhân vật, 33 trang bị + không trang bị, 33 × 34 tổ hợp nhân vật/trang bị và 99 Bí kỹ hợp lệ + 33 trường hợp không Bí kỹ. Mục chưa có quan sát giữ số đếm 0 và tỷ lệ —, không gán thắng 0%; sort tỷ lệ đặt mục chưa có dữ liệu cuối cả hai chiều. Phân trang không cắt dữ liệu; JSON chứa đủ mọi dòng. Có thể áp dụng cho snapshot cũ đã có trường statistics mà không cần chạy lại.

## Seed từng trận — colony v2

Thay thế mô tả seed chung ở trên: mỗi cặp đổi bên dùng hai seed khác nhau, sinh từ dòng giả ngẫu nhiên của phiên. Vòng đánh giá giữ cùng đối thủ nhưng cấp seed mới cho từng ứng viên/lượt đấu. Danh sách đối thủ học được xoay lần lượt qua toàn bộ ứng viên, đã sửa lỗi chỉ chọn các hạng chẵn.

UI mặc định bật seed phiên ngẫu nhiên (crypto.getRandomValues khi bấm Bắt đầu). Seed gốc thực dùng được hiển thị và ghi trong config JSON, kèm algorithm colony-v2-per-battle-seeds. Tắt lựa chọn này và nhập seed gốc để tái hiện cùng cấu hình/phiên bản thuật toán/engine. Không thể tái hiện báo cáo thuật toán cũ bằng luật seed mới.

Cấu hình đề xuất ở Lv10: 128 người, 60 thế hệ, 4 lượt, đổi .75, khám phá .50, bay hơi .15, 16 ứng viên, 128 đối thủ: tối đa 34.816 trận. Cấu hình sâu: 256 người, 100 thế hệ, 4 lượt, đổi .75, khám phá .50, bay hơi .15, 32 ứng viên, 256 đối thủ: 118.784 trận. Không cấu hình nào bảo đảm duyệt hết đội hình/trang bị/Bí kỹ/seed; cần nhiều phiên độc lập và kiểm tra số tổ hợp có quan sát, phân biệt với dòng catalog 0 trận.

## Truy cập công cụ

Từ bản deploy v39, công cụ ẩn mặc định. Vào Cài đặt → Mã truy cập → nhập 1824 → Mở công cụ. Mở khóa chỉ trong phiên giao diện hiện tại; reload khóa lại. Đây là chốt hiển thị phía client, không phải phân quyền server. Module công cụ được tải lazy sau khi mở. Kiểm thử colony-access-browser.ts không chạy trận hay tìm kiếm.
