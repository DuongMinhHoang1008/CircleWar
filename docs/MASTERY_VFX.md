# VFX Bí kỹ · 2026.10.29.3

Đủ 33 nhân vật và 99 nhánh Bí kỹ. Chỉ thay cách hiển thị; combat engine giữ v36, không thêm sự kiện hoặc thay đổi trạng thái dùng tính hash.

## Bộ hình

`apps/web/src/rendering/mastery-vfx-themes.ts` định nghĩa 33 biểu tượng vector riêng và ánh xạ cả 99 Bí kỹ vào kiểu hoạt ảnh. Biểu tượng dựa trên nhân vật: móng hổ, trái tim, chùm nho, lông gió, kính ngắm, lăng kính, sonar, trăng, deadline, lốp, cờ, katana, trái cây, quà, khiên, cọ, kiện hàng, lẩu, lì xì, hoa hồng, khí nén, tinh thể aura, vương miện, thư pháp, xu, equalizer, lửa, phế liệu, pixel, bóng bay, phóng xạ, tổ ong và đùi gà.

Mỗi nhánh có tám khung hoạt ảnh, tổng 792 khung. Hình học theo cơ chế: làn tỏa quạt, cung hồi lưu, vết chém, mũi xuyên, vòng mìn/neo, hoa hồi phục, bệ triệu hồi, dây gai và quỹ đạo. Có thêm 99 hình thân đạn; đường viền thể hiện dạng tách, hồi lưu, quỹ đạo, mìn, xuyên, tự đuổi và móc.

Chạy `npm run build:mastery-fx` để tái tạo từ SVG bằng Sharp. `build:fx` cũng gọi bước này. Đầu ra trong `apps/web/public/effects/mastery/` và manifest `mastery-vfx.json`. Ba atlas hoạt ảnh có kích thước 640×2640, nhỏ hơn giới hạn texture 4096; atlas thân đạn là 880×720. WebP lossless giữ kênh alpha. Các SVG nguồn và bản xem tổng nằm cùng repo; không tải ảnh từ dịch vụ bên ngoài.

## Trong trận

`MasteryVfxLayer` đọc các sự kiện có sẵn: kích hoạt Bí kỹ/Super, trúng đòn, hồi máu, khiên, tích Hướng Nội, triệu hồi và boomerang quay về. Nén Bão có chớp tích khi thực sự nhận sát thương HP lúc Hướng Nội. Các đệ mới xuất hiện có dấu triệu hồi tại vị trí đệ; hồi/khiên cho đồng đội có tia nối và điểm sáng di chuyển. Đạn có lịch sử vệt bay, hạt pixel/cánh nhỏ, dấu hồi lưu và cảnh báo mìn. Các đệ sống có vòng chân; đệ y tế/tiếp tế có dấu cộng nổi.

Arena dùng hình đạn riêng cho các vật thể mang metadata Bí kỹ và bộ đạn của 18 nhánh gốc. Vệt chém trễ và hình đánh giữ vị trí/kích thước của engine; màu lấy theo nhân vật. Không dùng hình VFX để xét hitbox. Trận thường, replay và Sân thử dùng chung lớp hiển thị.

Texture nguồn được cache, chỉ tải trang cần cho các Bí kỹ đang lắp; không tạo texture trong vòng lặp render. Pool tối đa 40 sprite hoạt ảnh, chế độ giảm hiệu ứng còn 12. Vệt đạn giữ tối đa bảy điểm mỗi đạn, xóa khi đạn biến mất. Chế độ giảm hiệu ứng bỏ vệt phụ/vòng chân/tia nối; tắt hiệu ứng ẩn toàn bộ lớp trang trí mới, vẫn giữ thân đạn để đọc trận. Tua ngược xóa lịch sử và khởi tạo lại lớp VFX.

## Kiểm tra

- `tests/deterministic/mastery-vfx.test.ts`: đủ 99 ID và 33 biểu tượng riêng, alpha/kích thước atlas, cả 99 hàng có chuyển động; nhận sự kiện thật của 81 biến thể; vị trí, hướng, lọc/dedup và không thay hash/state.
- `tests/integration/mastery-vfx-browser.ts`: mở cả 99 nhánh trong Sân thử; tải đủ bốn atlas; render WebGL cả 99 bộ hình; kiểm tra mobile 360/390, giới hạn 40/12, tắt VFX, tua ngược và trạng thái combat nguyên vẹn dưới tải 60 nhân vật/240 đạn/64 đệ.
- `reports/mastery-vfx/`: ảnh xem tổng, ảnh WebGL, ảnh trận desktop/mobile và báo cáo trình duyệt. Thời gian render trong báo cáo là mẫu Chrome headless trên máy kiểm tra, không phải cam kết FPS trên mọi thiết bị.

Bản này đã deploy ngày 29/10/2026 lên https://riseon-ultimate-battle.pages.dev, cùng Worker engine v36. Metadata và kiểm tra production xem `DEPLOYMENT.md`.

## Cập nhật local 30/10/2026 — engine v38

Pattern hình ảnh đọc từ mastery-upgrades thay cho form cũ. Tạo lại 792 frame và 99 sprite; bổ sung silhouette vật thể triệu hồi (drone, pháo, sói, lốp, hộ vệ, medic, sạp, quỹ, bếp, ụ pháo). Lớp hiển thị có pool 64 sprite thân triệu hồi, vẫn đọc được khi giảm hiệu ứng; tắt VFX ẩn pool. Vùng phụ có đường viền và vòng báo trước theo start tick; kiếm trễ, tia quét và vùng cánh có hình cast mới. Atlas dùng khóa cache v38. Thay đổi chỉ ở renderer/assets, không đổi combat. Chưa deploy bản này.
