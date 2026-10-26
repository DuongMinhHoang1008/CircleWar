# Nền combat v25 và đồng bộ ngoài combat

Source release: **2026.10.26.1**. Engine: **chaos-integer-v25**.

## Kiến trúc

- `Fighter` giữ chỉ số gốc, trạng thái runtime và thanh Super 0–100; không sửa loadout khi trận diễn ra.
- `CombatStatus` là hợp đồng dữ liệu chung: loại hiệu ứng, cường độ, thời điểm hết hạn, nguồn và phần dư fixed-point.
- `statuses.ts` cung cấp `applyStatus`, `clearStatus`, `statusPower`, `tickStatuses`, `attackCooldown`, `statusDamage`. Không phụ thuộc renderer, React hoặc Worker.
- Vòng tick: tăng nhịp từ baseline → cập nhật kit/synergy → xử lý trạng thái → di chuyển/va chạm → xoay/đánh → xác định đội còn sống.
- `weapons.ts` kiểm tra mục tiêu nằm trên hướng vũ khí quét qua; `character-combat.ts` chỉ tạo đạn nếu cooldown đã sẵn sàng.
- Replay giữ trạng thái, chỉ số combat và góc vũ khí do server tính. Renderer chỉ phát lại.
- `battleAnalytics.ts` thu sự kiện và tạo summary; `BattleAnalyticsPage.tsx` trình bày dữ liệu. Arena phát callback khi trận hoàn tất, App lưu lịch sử.

Đây là nền dùng chung cho lần chỉnh bộ chiêu riêng sau. Không thay hàng loạt nội tại hoặc gán sáu trạng thái cho mọi nhân vật.

## Chỉ số chính

| Hiển thị           | Trường runtime                      | Ý nghĩa                                                                  |
| ------------------ | ----------------------------------- | ------------------------------------------------------------------------ |
| HP                 | `hp`, `stats.hp`                    | Máu hiện tại và tối đa                                                   |
| Damage             | `stats.attack`                      | Sát thương cơ sở trước Rage, hệ số skill, chí mạng và phòng thủ          |
| Super Bar Progress | `energy`                            | 0–100; dùng Super khi đầy và đủ điều kiện cast                           |
| Speed              | `stats.speed`                       | Tốc độ thân bi-a, 100 đơn vị engine bằng một đơn vị hiển thị             |
| Spin Speed         | `stats.rotation`, `memory.spinRate` | Bước góc trên tick nhân hệ số tăng nhịp/trạng thái; mỗi vòng có 32 hướng |

Giữ giáp, khối lượng, tầm, chí mạng, tốc độ nạp và hồi đòn làm chỉ số phụ để tương thích trang bị/skill. Cooldown bắn dùng cooldown đòn hiện có, có hạn chót `nextAttack` riêng; không tạo hai nguồn cân bằng trùng nhau.

## Trạng thái và giới hạn cân bằng

Mọi thời lượng giới hạn tối đa 300 tick (10 giây) mỗi lần áp dụng. Có thể làm mới bằng lần áp dụng hợp lệ tiếp theo. Buff chỉ áp dụng cùng đội; debuff chỉ áp dụng khác đội. Hiệu ứng yếu hơn không kéo dài hiệu ứng mạnh hơn.

| Trạng thái | Mặc định                          | Trần                                    | Cộng dồn                                                                                               |
| ---------- | --------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Burn       | 4 HP/s, 3 giây                    | 30 HP/s và tối đa 3% HP gốc/s           | Một hiệu ứng mạnh nhất                                                                                 |
| Poison     | 2 HP/s/tầng, 4 giây               | 15 HP/s/tầng và tối đa 1% HP gốc/s/tầng | Tối đa 5 tầng; mỗi tầng có thời hạn riêng, đủ tầng thì làm mới tầng hết hạn sớm nhất nếu không yếu hơn |
| Frozen     | Giảm 25% di chuyển, 2 giây        | 40%                                     | Một hiệu ứng mạnh nhất                                                                                 |
| Paralyzed  | Giảm 25% nhịp đòn và xoay, 2 giây | 40%                                     | Một hiệu ứng mạnh nhất                                                                                 |
| Blessing   | 4 HP/s, 3 giây                    | 30 HP/s và tối đa 2% HP gốc/s           | Một hiệu ứng mạnh nhất                                                                                 |
| Rage       | Tăng 20% sát thương, 3 giây       | 50%                                     | Một hiệu ứng mạnh nhất                                                                                 |

- HP theo thời gian được tích lũy mỗi tick bằng số nguyên fixed-point, không mất phần lẻ khi checkpoint. Cường độ kit/item có thể khác mặc định ở bảng.
- Burn/Poison trừ HP trực tiếp, không bị giáp/khiên hấp thụ, không kích hoạt lại item/passive/hút máu/nạp Super để tránh chuỗi proc.
- Burn/Poison còn hiệu lực sau khi nguồn chết; vẫn ghi damage và kill cho nguồn. Không hồi sinh bằng Blessing.
- Blessing chịu hiệu ứng giảm hồi phục phóng xạ hiện tại. Giảm hồi phục được tính trước khi quy đổi phần dư thành HP nguyên.
- Rage tăng sát thương trực tiếp trước giáp/khiên, không nhân thêm DoT đã áp dụng.
- Paralyzed điều chỉnh cả cooldown đang chờ và đòn tiếp theo; hết hạn thì tốc độ trở lại bình thường. Không giảm nhịp cast skill/Super.
- Frozen làm chậm bước di chuyển; không làm đổi vector gốc và quy luật nảy. Tẩy chậm/miễn chậm hiện tại dùng được với Frozen.
- Spin tích lũy phần dư số nguyên để mức chậm 25% hoặc tăng xoay 4% có tác dụng, dù bảng hướng chỉ có 32 bước.

Ánh xạ kit cũ: `burnDot`/`soupDot` → Burn; `dot` → Poison; làm chậm → Frozen; buff công cá nhân → Rage. Buff công synergy giữ đường tính riêng. Skill controller thường thêm Paralyzed 20% trong 2 giây khi trúng; skill support thường thêm Blessing trong 3 giây. Mô tả catalog được cập nhật tương ứng. Radiation vẫn là cơ chế riêng hiện có.

## Đòn xa

- Đòn thường ranger/frost chỉ bắn khi tia vũ khí đi qua một mục tiêu sống trong tầm 240 và cooldown đã sẵn sàng.
- Kiểm tra các hướng trung gian đã quét trong tick để tốc độ xoay cao không bỏ qua mục tiêu nhỏ.
- Đạn giữ hướng vũ khí tại lúc quét, không tự đuổi mục tiêu; chỉ gây sát thương khi va chạm.
- Tối đa một lần bắn thường mỗi cooldown, tối thiểu 8 tick (khoảng 0,27 giây). Paralyzed làm tăng khoảng chờ này.
- Skill/Super giữ cách chọn mục tiêu hiện có trong đợt nền; việc đổi chi tiết kit từng nhân vật thuộc đợt sau.

## Tăng nhịp sống sót

Mỗi 300 tick (10 giây), tối đa 20 tầng:

| Chỉ số         | Mỗi tầng      | Trần bổ sung                                            |
| -------------- | ------------- | ------------------------------------------------------- |
| Sát thương     | +12% baseline | 300 ATK                                                 |
| Di chuyển      | +5% baseline  | 900 đơn vị engine/tick                                  |
| Nhịp đòn       | +8%           | Cooldown gốc / hệ số nhịp, tối thiểu 8 tick             |
| Nạp Super      | +5% baseline  | 300%                                                    |
| Sức mạnh Super | +10% baseline | 300%; hồi máu/khiên Super vẫn chịu giới hạn phục hồi cũ |
| Tốc độ xoay    | +4%           | 180% tốc độ xoay gốc                                    |

Không tăng HP/giáp theo thời gian. Tính lại từ baseline để không nhân chồng theo tick; reset khi tạo trận mới. Các mức tăng cũ được giữ, bổ sung tốc độ xoay để hạn chế phạm vi thay đổi trước đợt thiết kế kit.

## Đồng bộ ngoài combat từ bản web .22.1

- Đi ải có 729 bộ ba khác nhau lấy từ tổ hợp thực sự mở liên kết/hội. Tạo pool một lần, lấy mẫu phủ roster; từ ải 31 ưu tiên nhiều liên kết hoặc hội ba người. Retry cùng ải cho cùng đội/trang bị.
- Trang bị tối đa một món/đơn vị, level tối đa 10, có biến thể hợp cạ hoặc vật phẩm khác. Ải thường và quân hỗ trợ dùng chỉ số card/trang bị hiển thị.
- Boss luôn có một chỉ huy (slot 0, bán kính 2800) và hai hỗ trợ (bán kính 1700). Chỉ chỉ huy tăng HP 12–22%, ATK 8%, giáp tối đa thêm 2, mass 50%; boss khó thêm HP 12%/ATK 6%. Không nhân HP theo số lượng cả đội như boss đơn cũ. Cấp hỗ trợ thấp hơn một cấp nền, đều hiển thị.
- Preview chỉ giữ đội địch và một câu mô tả phối hợp, bỏ gợi ý counter.
- Thống kê: tối đa 200 trận, chống trùng ID, lọc chế độ/nhân vật, tỉ lệ thắng theo lượt ra sân, cặp kết liễu, snapshot level/đồ, số lần liên kết/hội, xuất JSON và lưu qua reload. Không coi kết quả đội là thắng đối đầu.
- Thu sự kiện theo từng tick offline; multiplayer dùng frame server, đọc đủ chunk khi hoàn tất kể cả vào muộn. Thiếu chunk thì báo không lưu thống kê đầy đủ, không ghi thành lịch sử hoàn chỉnh.
- Event feed giữ các kill/liên kết/hội có số lượt hữu hạn cùng 120 event hình ảnh gần nhất để burst VFX không làm mất kết quả.
- Pack Boss: pack thứ 50 sau 49 lần không có Huyền thoại bảo đảm T4. Sử thi không reset. Client và room dùng `packDrawPool`/`nextBossPity`; không còn T4 chưa max thì không tiêu pack bảo hiểm. Batch chỉ trừ số pack thực mở. Worker bổ sung, chuẩn hóa và kiểm tra trường `bossPacksSinceHighRarity`.
- Khắc phục TS7022 trong deployment smoke test. Patch notes ghi cả mốc .22.1 và bản source mới .26.1.
- Bản production thiếu `VITE_API_URL` dùng API Cloudflare hiện tại làm mặc định; khi chạy HTTPS mà cấu hình lưu cũ trỏ localhost HTTP, chuyển về API mặc định để tránh mixed content. Vẫn ưu tiên `VITE_API_URL` nếu được cấu hình.

## Giới hạn triển khai

Đây là triển khai lại từ bản ghi và source hiện có, không khẳng định công thức đi ải/boss giống từng byte với bundle .22.1. Giới hạn trạng thái và boss nêu trên là lựa chọn cân bằng mới, cần tiếp tục đo lại khi có đặc tả từng kit. Báo cáo mẫu mô phỏng không thay thế win rate người chơi thật.

Engine v25 không nhận checkpoint/replay engine cũ. Source đã cập nhật; chưa push hoặc deploy. Khi phát hành cần cập nhật Worker và frontend cùng nhau, xử lý phòng cũ theo chính sách migration của dự án.
