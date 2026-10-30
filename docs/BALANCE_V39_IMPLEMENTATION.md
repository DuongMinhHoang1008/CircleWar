# Cân bằng v39 — 30/10/2026

Đã triển khai toàn bộ gói BALANCE_RARITY_AFFINITY_PROPOSAL_2026-10-30.md theo phê duyệt người dùng. Không chạy mô phỏng đàn kiến sau sửa.

- Engine chaos-integer-v39; release 2026.10.30.2. Giữ dữ liệu báo cáo v38 làm đối chứng.
- Rarity gốc áp một lần lên HP/ATK nền: RAC .94, T1 .98, T2 1, T3 1.04, T4 1.08; giữ tiến hóa. Không sửa hệ số rarity dùng chung của đồ.
- Hợp cạ: hệ số phần có lợi 1.12, chủ thêm 2% HP/ATK nền trước đồ, một lần. Không tăng mặt phạt speed âm; cooldown âm vẫn là lợi ích.
- Chỉnh 12 nền nhân vật theo bảng đề xuất. Chó ATK16; Anh Tết ATK19/cooldown21; các nền yếu/hiếm cao tăng đúng bảng.
- Bóng hộ tống: thường65/cap195, Skyrocket70/cap210, giữ tám bóng. Scan: thường310/cap330, Wacom320/cap340. Super scale tính một lần; giữ trần chung theo mỗi cast.
- Đúng chủ: giant Hộp Quà thêm 6% HP nền chủ, cap25 lúc gọi; Phonk lốc chính thêm8% damage (không mắt bão); Bang Chủ vùng dép thêm8% damage (không thêm tick/Frozen/số vùng). Áp cả damage lên fighter và construct.
- Cập nhật mô tả hợp cạ, hai Bí kỹ và patch notes. Các con số mục tiêu win-rate chưa được xác minh; người dùng tự chạy mô phỏng để kiểm chứng.

Kiểm tra kỹ thuật: TypeScript, build Vite; test công thức tất cả 33 nhân vật ở bốn mốc cấp, item penalty, bóng/cap scan theo dạng, giant và field scope; kiểm thử deterministic/checkpoint hiện có. Kết quả đầy đủ lưu reports/balance-review/tests-v39-verified.log.
