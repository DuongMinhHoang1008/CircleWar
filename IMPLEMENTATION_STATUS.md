# Trạng thái triển khai

## Hiện hành — 2026.10.28.1 / engine v34

Đã hoàn tất bản local: Kho đồ tinh gọn; thử thách ngày với pool 9 nhân vật và đội tự lưu; viễn chinh roguelike 12 tầng, một lần thua mất run; tổng thưởng 150 pack + 15 Pack Boss + 1 Rương chọn Sử thi/ngày, pack dư vào Hòm thư; hành trình đủ 33 nhân vật và 99 Bí kỹ; Cộng hưởng liên kết. Qua 413 tests, TypeScript, build frontend/Worker dry-run và các luồng trình duyệt desktop/mobile. Thiết kế và giới hạn playtest tại [bản 28/10](docs/ADVENTURE_V2_2026-10-28.md). Trạng thái production được ghi tại [DEPLOYMENT.md](DEPLOYMENT.md).

## Hiện hành — 2026.10.27.4 / engine v32

Đã làm lại bố cục các chế độ chính và triển khai thưởng tuần/ngày/lần đầu, Rương chọn Sử thi và grant thưởng thi đấu được server kiểm chứng. Chi tiết tại [release 2026.10.27.4](docs/RELEASE_2026-10-27.4.md). Bản này chưa deploy production.

## Hiện hành — 2026.10.27.3 / engine v32

Đã triển khai MVP của các nhóm QoL, UX, content và hardcore trong [roadmap](docs/DEVELOPMENT_ROADMAP.md): preset/khóa/lọc/so sánh thẻ, thưởng chờ, campaign theo chương và huy chương, onboarding cho mượn, hậu trận/replay/tốc độ xem, so build, hành trình nhân vật, thử thách tuần/hợp đồng/bảng điểm do server tính, viễn chinh draft và event trải nghiệm trên thiết bị.

Chi tiết hành vi, giới hạn, migration và bài kiểm chứng tại [release 2026.10.27.3](docs/RELEASE_2026-10-27.3.md). Source này chưa deploy production. Hồ sơ collection/PvE cục bộ vẫn đồng bộ theo cơ chế tương thích; điểm thi đấu được xác thực và lưu độc lập. Các mục v5–v10 bên dưới là lịch sử, không dùng làm checklist của phiên bản hiện hành.

## Cập nhật v9 — hoa, Courage, vũ khí và hội bạn

- Pool 20 người, thêm Hoàng Tử Ngậm Hoa với nội tại, chiêu tự động, Super, mốc level 5, cặp P13 và bộ T09; không có bonus item chữ ký riêng.
- Đổi tên hiển thị thành Courage Nhút Nhát theo Courage, race Thú Nhân và Găng Chân Run Rẩy. Giữ ảnh gốc và cơ chế cũ.
- Có đúng mười ba hội người dùng đưa, tự cộng dồn tất cả đặc tính/hội/liên kết đủ điều kiện, mốc 2/3 khác nhau đang sống, proc/cooldown riêng theo từng hội/liên kết và serialize state. Đội hình tự mở mọi hiệu ứng đủ người; bản sao không tăng mốc.
- Thêm Imposter, Ạt tít, Cốt đơ, Full Combo và Tất cả quỳ xuống. Cốt đơ loại Sếp, Hộp Quà, Họa Sĩ, Cô Khui Tết; hội 36 bỏ Đùi Gió. Full Combo cần Hộp Quà + một Ạt tít + một Cốt đơ; đội thiếu nhánh dùng Ghép Đôi riêng; hội Sếp cần Sếp còn sống để chỉ đạo ATK/tốc đánh, loại Tím Mọng/Hiệp Sĩ. Anh có ý tưởng do Tím Mọng hoặc Hiệp Sĩ khởi xướng, tăng năng lượng/ATK đồng đội. Popup và lựa chọn hội ghi rõ hạt nhân.
- Built-in imagegen tạo atlas RGBA 20 mẫu vũ khí riêng. Đã gắn texture vào Pixi khi xoay, thẻ nhân vật và popup; PNG/prompt nằm trong workspace. Dùng chung hitbox với vũ khí gốc, giảm hiệu ứng không ẩn vũ khí.
- Engine `chaos-integer-v9`, protocol 3. `docs/character-pool/catalog-expansion.json` là nguồn tái tạo phần mới cùng catalog exporter. Tài liệu pool 19 người giữ làm lịch sử.

## Cập nhật catalog v5

- Catalog có 19 avatar, class/race, category/tier vũ khí, nội tại/chiêu tự động/Super, mốc skill level 5 và món hợp cạ. Engine chạy 19 bộ chiêu riêng, không cộng chồng nội tại sáu lớp cũ.
- Shop có 19 món mới: 7 phụ kiện/12 tiêu hao, item hooks theo tick/hit/va chạm/Super/ngưỡng HP, đủ 19 bonus hợp cạ, khiên có hạn, DoT và nạp năng lượng theo ngân sách tick.
- Server xác thực nhân vật, thành phần hiệu ứng tự bật, đặc tính/hội/liên kết đồng thời và slot đại diện bản sao, nâng vũ khí II/III, trang bị/tháo đồ. Snapshot lưu lượt proc/hồi riêng theo từng hội/liên kết, buff và đòn chờ.
- Cẩm nang 19+19, ô đội hình, shop/túi/phần thưởng và nhân vật trên sân đều mở popup. Native dialog có Escape, focus, cuộn; hồ sơ có đủ chỉ số, skill, vũ khí, liên kết, bonus item và luật cộng dồn. Xem thông tin độc lập với khóa giao dịch.
- Arena có crop mặt, màu đội, thanh skill/HP/Super, vùng bẫy/mực, báo trước, khiên/hồi phục và tên chiêu/liên kết. Phòng tập cho thử đội, trang bị và phối hợp miễn phí. Xem trạng thái trận là ảnh chụp lúc bấm, trận vẫn chạy phía sau.
- Engine `chaos-integer-v5`, HTTP protocol 2. Legacy item/class chỉ giữ để đọc dữ liệu/kiểm thử tương thích, không vào pool shop mới. Chưa tự di trú trận v4 đang giao tranh; cần tạo phòng mới.
- Trước gameplay v10, hình vật phẩm dùng biểu tượng và chưa có bộ sprite riêng; các hiệu ứng hình ảnh phong phú vẫn là hạng mục polish.

Các milestone phía dưới mô tả nền triển khai ban đầu; mục này cập nhật gameplay/UI v5.

Triển khai theo `writing-block.md`, giữ web monorepo độc lập vì repository ban đầu trống. Đây là bản chơi được local có backend thật; **chưa hoàn thành toàn bộ Definition of Done ở mức production**.

## Cập nhật gameplay v10 — shop, bench và hiệu ứng

- Mỗi người chơi mới vào phòng với một nhân vật level 1. Cài đặt số nhân vật/người đã bị bỏ khỏi lobby; lựa chọn starter vẫn được giữ.
- Shop mỗi vòng có 5 ô hàng, pha trộn quân T1/T2 với vật phẩm; reroll tốn 2G. Quân giá 3G/4G, mua vào bench tối đa 5; túi vật phẩm giới hạn 8 món.
- Nâng giới hạn đội hình được mua độc lập với shop: 1→2 quân giá 5G, 2→3 quân giá 10G. Chỉ quân trên sân tham chiến.
- Kéo quân cùng CharacterId và cùng level chồng lên nhau để hợp nhất, tối đa level 10. Trang bị của quân bị tiêu thụ được trả về túi; không hợp nhất nếu túi không còn sức chứa. Level gốc chuyển sang 1, mỗi level sau level 1 cộng +18 HP/+2 ATK.
- Thêm Bàn cờ tướng cho Hoàng Tử Ngậm Hoa: +12 khiên khởi đầu, hợp cạ +8 khiên nữa; Super cấp thêm 8 khiên cho đồng minh yếu máu nhất trong tầm.
- Có 20 SVG sprite vật phẩm; Arena dùng tranh vector cho đòn chém/va chạm, khiên, hồi máu, Super, vùng kỹ năng và đạn. Hạ gục làm vỡ thành mảnh và rung sân; VFX chỉ ảnh hưởng render.
- Protocol 4 và engine `chaos-integer-v10`; replay luật engine cũ cần phát bằng client/engine tương ứng. Room đang lưu được bổ sung bench rỗng và suy ra sức chứa theo đội hiện có để giữ dữ liệu cũ.
- Chưa deploy production. Typecheck, `npm run build` và `npm test` đã pass sau khi cập nhật các kiểm thử để khớp với luật một nhân vật khởi đầu và catalog 20 vật phẩm.

| Milestone           | Trạng thái                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Foundation       | Có npm workspace, TypeScript, React/Vite/PixiJS, Worker SQLite DO, schema và test config; build đã chạy                                           |
| 2. Battle engine    | Có fixed integer/tick, seeded RNG riêng, grid/impulse/capsule, sáu lớp, đạn, skill/Super, bo, serialization và result                             |
| 3. Offline playable | Có canvas 2–60 nhân vật, seed replay, weapon/HP/Super, bảng lớp, âm thanh/mute, giảm hiệu ứng và debug FPS                                        |
| 4. Meta             | Có đội hình, Gold/Player HP, shop/túi/trang bị/consumable, upgrade, reward, comeback và nhiều vòng                                                |
| 5. Multiplayer      | Có tạo/vào/rời phòng, host migration khi LEAVE, session, exact team size, config/ready, hibernating WebSocket, persistence/Alarm                  |
| 6. Authority        | Có freeze snapshot, server batch simulation, checkpoint restart, replay/hash và settlement idempotent; phục hồi divergence hiện về final snapshot |
| 7. Production       | Có origin/schema/auth/rate limit session, error/reconnect, tests, benchmark, CI/deploy docs; còn các hạng mục dưới đây                            |

## Chưa hoàn tất hoặc chưa kiểm chứng

1. Chưa deploy GitHub Pages/Cloudflare, chưa kiểm thử tài khoản/quota thật; cần tài khoản người dùng và repository remote. Không có kết quả CPU trên Cloudflare production để cam kết Free chịu được bao nhiêu phòng.
2. Chưa có edge rate limit cho create/join, chống spam cấp IP/account, moderation hoặc kiểm thử bảo mật độc lập. Session rate limit không chặn việc tạo vô hạn phòng mới.
3. Broadcast hiện là invalidation nhỏ rồi fetch snapshot riêng; chưa event delta theo trường như thiết kế tối ưu yêu cầu.
4. Divergence hiện phục hồi final snapshot; chưa replay chuẩn theo frame hoặc checkpoint trung gian để tiếp tục xem mượt. Clock offset dùng RTT midpoint, chưa lọc nhiều sample.
5. Giao diện chưa có camera follow riêng cho đội mình, toggle số damage, breakdown MVP/nhân vật nổi bật đầy đủ; animation/visual effects ở mức cơ bản. Arena toàn cảnh đã có.
6. Stat pipeline data-driven đã có; skill upgrade hiện gộp level tăng HP/attack, chưa có nhánh nâng cấp kỹ năng riêng. Tỉ lệ rarity và ngưỡng comeback nằm trong code config/hàm; chưa là room setting có thể tùy biến.
7. Broad phase grid được dùng và báo số cặp; chưa benchmark thời gian vs naive đủ phân bố. Projectile/vũ khí vẫn có các vòng duyệt mục tiêu có giới hạn, chưa tối ưu mọi interaction qua grid.
8. Solver ba pass có thể còn penetration nhỏ khi đám đông quá dày. Chưa continuous collision cho weapon quay; capsule kiểm tra theo tick/32 hướng. Cần stress/fuzz để khẳng định mọi trường hợp không xuyên nhau.
9. Chưa lưu toàn bộ lịch sử replay nhiều vòng/MVP; chỉ giữ replay gần nhất và tổng damage, kết quả từng vòng mới nhất. Export chưa là full provider migration.
10. Chưa 20 browser thật qua WAN, mobile GPU thật, soak test nhiều phòng, fault injection quota/storage failure, hoặc kiểm tra engine migration đang có phòng sống.

## Thứ tự tiếp tục

Edge abuse controls → production staging metrics → checkpoint replay recovery → multi-room load/soak và collision fuzz → delta protocol → hoàn thiện UI/camera/MVP/skill upgrades → balance nhiều seed → rollout public.

Các báo cáo máy chạy thực tế nằm trong `reports/*.json`; screenshot desktop/mobile từ Playwright. Không có placeholder giả server result và không tin kết quả client.

## Cập nhật 2026.10.27.5

Kho đồ dùng đội hình hàng ngang, kéo thả quân/trang bị bằng chuột và cảm ứng, cấu hình riêng thay Catalog. Mở bài là màn mặc định. 18 Bí kỹ có runtime v33, mở theo tiến trình 3/8/15 hiện có; chưa thêm bộ bài thử thách cố định của thiết kế dài hạn. Chi tiết và kiểm tra tại `docs/RELEASE_2026-10-27.5.md`.
