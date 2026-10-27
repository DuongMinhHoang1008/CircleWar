import React from "react";

export const PATCH_NOTES = [{
  version: "2026.10.27.2",
  date: "2026-10-27",
  title: "Cân bằng nhân vật và số liệu chiến đấu",
  summary: "Điều chỉnh sức mạnh 33 nhân vật, thêm thống kê hỗ trợ và tùy chỉnh hiển thị. Bo tăng nhịp chiến đấu, không tự trừ HP.",
  sections: [
    { title: "Cân bằng nhân vật", entries: ["Giảm khả năng tự chống chịu của Hổ, thời gian né của Ship Nhanh, laser Fu Di và áp lực diện rộng của Jake, Ủn, Skyrocket. Tăng chỉ số, tầm đánh và nhịp đánh cho các quân cận chiến yếu.", "Đệ Hộp Quà ra sớm hơn, bền và đánh tốt hơn; giữ chuyển động bi-a và trụ đứng yên. Mâm Quả hồi máu thực cho đồng đội, Cờ tăng khả năng buff/bảo vệ; Wacom biến hình xuyên hai mục tiêu nhưng ngừng nảy sau khi trúng người.", "Thêm báo cáo Cân bằng nhân vật: kết quả trước/sau cùng bộ mẫu, thắng/thua, sống tới cuối, damage và hỗ trợ; mặc định mở đấu đội Lv.10. Đã kiểm tra 15.312 trận mô phỏng, gồm bộ seed kiểm chứng riêng, không có trận quá giới hạn 180 giây."] },
    { title: "Thống kê hỗ trợ và hiệu ứng", entries: ["Lưu lượng hồi máu, tạo khiên, khiên thực hấp thụ, số lượt buff/debuff, thời gian khống chế và thời gian buff đồng đội. Tách hỗ trợ đồng đội khỏi tự hồi/tự buff; không tính phần hồi dư.", "Lịch sử từng trận có số lượt và thời gian từng hiệu ứng đã gây; thống kê sống tới cuối độc lập với thắng đội. Dữ liệu theo replay thực và có trong JSON xuất; lịch sử cũ thiếu trường mới hiển thị —."] },
    { title: "Hiển thị và số liệu", entries: ["Thêm Cài đặt cho hiệu ứng, số damage, hồi phục/khiên, giảm hiệu ứng và âm thanh; tự lưu trên trình duyệt. Số damage mặc định tắt và có thể bật riêng khi VFX tắt.", "Số damage dùng màu và nhãn riêng cho đòn đánh, Burn, Poison, Bleeding và phóng xạ; các nguồn khác nhau không gộp chung. Tên trạng thái hiện tại mục tiêu khi hiệu ứng được áp dụng.", "Hồi phục hiện HP +… xanh ngọc, khiên +… xanh dương và máu ảo +… tím; tính đúng lượng thực nhận, không hiện phần hồi dư. Có công tắc riêng cho số hồi phục/khiên.", "Hiện sát thương gây/nhận dưới từng nhân vật và lưu trong Phân tích số liệu, gồm tổng, trung bình và lịch sử từng trận. Sát thương tính theo HP thực tế; lịch sử cũ chưa có dữ liệu hiển thị dấu —."] },
    { title: "Nhịp cuối trận", entries: ["Bỏ hoàn toàn việc bo tự trừ HP. Khi bo thu, tăng dần sát thương, di chuyển, nhịp đánh/bắn, tốc độ xoay và nạp Super; chỉ giao tranh mới hạ được đối thủ.", "Tăng trần bổ sung do bo: di chuyển +60%, nhịp đánh/xoay +150%, nạp Super +100%. Giữ giảm hồi phục sau khi bo khép; hồi máu từ đồng đội còn tối thiểu 35% hệ số nhịp trận, vẫn chịu giảm hồi phục từ trạng thái. Sau bo, nếu không có sát thương trong 15 giây, điều chỉnh nhỏ góc chuyển động gần ngang/dọc để tránh hai quân chạy song song mãi. Trận mới dùng engine v31."] },
  ],
}, {
  version: "2026.10.27.1",
  date: "2026-10-27",
  title: "Hòm thư và quà hệ thống",
  summary: "Nhận quà tân thủ và quà cập nhật trong Hòm thư khi hàng chờ pack còn đủ chỗ.",
  sections: [
    { title: "Quà trong Hòm thư", entries: ["Quà tân thủ và quà cập nhật được gửi thành thư, không cộng thẳng vào hàng chờ pack. Nhận toàn bộ quà của một thư khi còn đủ chỗ; quà tiếp tục được giữ nếu hàng chờ chưa đủ.", "Thư đã nhận được lưu trong lịch sử, không thể nhận lại. Quà đã phát trước khi có Hòm thư không được phát thêm lần nữa."] },
    { title: "Mở thẻ", entries: ["Kết quả mở pack sắp xếp và tô màu theo rarity gốc. Thẻ đã tiến hóa trong kho có dấu riêng ghi bậc hiện tại, không làm thay đổi rarity của lần mở."] },
    { title: "Đội hình đi ải", entries: ["Đội địch luân phiên tám lối đánh: áp sát, trụ và đệ, khống chế, sát thương theo thời gian, giảm hồi phục, hỗ trợ chủ lực, đẩy kéo và biến hình. Giữ hạt nhân lối đánh khi đi đội một hoặc hai người.", "Trang bị được đưa vào từng bước; từ ải 31 tăng yêu cầu phối hợp, từ ải 61 cả ba quân cùng phục vụ lối đánh của đội. Các ải cao ưu tiên liên kết và cách phối trang bị tốt hơn, không tăng chỉ số ẩn ở ải thường.", "Giữ giới hạn Lv.10, một vật phẩm mỗi nhân vật, boss mỗi năm ải, phần thưởng và thông tin trước ải."] },
    { title: "Quyết đấu cuối trận", entries: ["Từ lúc tường bo bắt đầu thu, mọi bộ kỹ năng đều tăng dần sát thương, tốc độ di chuyển, tốc độ đánh và tốc độ xoay. Các hiệu ứng này chỉ áp dụng trong trận hiện tại.", "Sau khi bo khép, hồi máu và khiên mới giảm 10% mỗi giây, về 0 sau 10 giây; áp dụng cả hồi phục định kỳ như Hướng Nội.", "Nếu trận còn kéo dài sau khi bo khép 3 giây, áp lực bo gây mất HP theo phần trăm HP tối đa mỗi giây, xuyên giáp và khiên, tăng dần từ 3% lên tối đa 15%. Đấu trường hiển thị rõ giai đoạn quyết đấu và áp lực bo."] },
    { title: "Đấu trường", entries: ["Đệ nhỏ và đệ khổng lồ của Hộp Quà Nghiêm Túc có khung hình tròn, viền màu đội và thanh máu rõ ràng. Đệ chuyển động bi-a theo quán tính, không truy đuổi. Tăng HP, sát thương và tốc độ cho cả đệ nhỏ lẫn đệ lớn để bù việc bỏ truy đuổi.", "Đệ và trụ có collider, bị vũ khí đánh và được xạ thủ chọn làm mục tiêu. Đệ nảy khi va chạm; trụ hình tròn luôn đứng yên, chỉ làm thực thể khác bật ra. Vật thể phía trước có thể chắn đạn cho vật thể phía sau.", "Clash đảo chiều quay ngay tại điểm chạm, không lật vũ khí 180°. Trận mới dùng engine v29."] },
  ],
}, {
  version: "2026.10.26.2",
  date: "2026-10-26",
  title: "36 bộ chiến đấu riêng",
  summary: "Làm lại đòn thường, Super và hai hướng tăng trưởng cho 33 nhân vật cùng ba dạng biến hình; giữ nguyên class và race.",
  sections: [
    { title: "Nhân vật và trạng thái", entries: ["Mỗi nhân vật có cơ chế riêng: đạn nảy, trụ súng, đệ có HP, cờ, vườn hồng, boomerang, cổ phiếu và aura. Đòn xa vẫn cần vũ khí hướng đúng mục tiêu.", "Hướng Nội chỉ Hổ tự nhận: giảm 25% sát thương trực tiếp, hồi 1% HP mỗi giây và giảm 15% di chuyển. Tiểu Đường giảm hồi phục, Cận Thị giảm tầm bắn, Bleeding mất HP khi di chuyển; Choáng khóa đánh và Super ngắn, không dừng quán tính.", "Mỗi 10 giây sống sót chỉ tăng hai chỉ số riêng của bộ chiến đấu, tối đa 12 tầng. Liên kết và hợp cạ kích hoạt qua Super, thay kỹ năng tự động 7 giây cũ."] },
    { title: "Cân bằng và rủi ro", entries: ["Giảm sức mạnh Siêu Chiến Binh Wacom: đạn thường còn 60% Damage, hồi bắn dài hơn 30%; Super tám phát 28% Damage, không bắn thường chồng lên chuỗi.", "Super Ủn Đại Ca nổ toàn bản đồ: 220% Damage trong bán kính 130 và 80% ngoài vùng tâm. Phóng xạ/Burn ảnh hưởng cả chủ và đồng đội; sát thương phe mình bằng 50% tương ứng.", "Wacom hỏng và bóng bay thường có sát thương đồng đội; Skyrocket không gây sát thương phe mình. Trụ/đệ bị phá được, không kéo dài trận khi chủ chết; vùng chồng cùng chủ không nhân tick sát thương.", "Đạn, vùng hiệu ứng, trụ và đệ tiếp tục hoạt động sau khi chủ chết đến hết lifetime hoặc bị phá. Hộp Quà tự gọi đệ nhỏ mỗi 4 giây, không cần tấn công.", "Thêm 36 sprite vũ khí, 20 sprite đạn/vật thể, 8 sprite trụ/đệ/vùng và sáu bộ VFX hoạt ảnh mới; giữ chân dung hiện tại.", "Replay và checkpoint dùng engine v26; hãy tạo trận mới để dùng bộ kỹ năng mới."] },
  ],
}, {
  version: "2026.10.26.1",
  date: "2026-10-26",
  title: "Nền combat theo trạng thái và hướng xoay",
  summary: "Sáu trạng thái dùng chung, đòn xa theo hướng vũ khí; đồng bộ đi ải, phân tích số liệu và bảo hiểm Pack Boss.",
  sections: [
    { title: "Combat", entries: ["Năm chỉ số chính: HP, Damage, Super Bar Progress, Speed và Spin Speed. Super đầy ở 100; đòn xa chỉ bắn khi vũ khí xoay quét qua mục tiêu và hồi bắn đã sẵn sàng.", "Burn không cộng tầng; Poison tối đa 5 tầng riêng biệt. Frozen giảm di chuyển, Paralyzed giảm nhịp đòn và xoay. Blessing hồi HP theo thời gian; Rage tăng sát thương. Hiệu ứng có trần và thời hạn, không cộng dồn vô hạn.", "Mỗi 10 giây sống sót tăng sát thương, tốc độ, nhịp đòn, xoay và nạp Super từ chỉ số gốc; có trần, không tăng HP. Engine v25 yêu cầu trận mới; bộ chiêu riêng từng nhân vật sẽ được điều chỉnh ở đợt sau."] },
    { title: "Ngoài combat", entries: ["Đồng bộ các thay đổi của bản web 2026.10.22.1: 729 đội hình đi ải có liên kết, ưu tiên phối hợp từ ải 31; boss có một chỉ huy và hai quân hỗ trợ dùng chỉ số thường.", "Thêm Phân tích số liệu: 200 trận hoàn tất gần nhất, lọc chế độ/nhân vật, lịch sử hạ gục, trang bị, liên kết/hội và xuất JSON. Lưu trên trình duyệt hiện tại.", "Pack Boss có bảo hiểm Huyền thoại ở pack thứ 50; chỉ Huyền thoại đặt lại bộ đếm. Dùng chung luật client/server; nếu không còn Huyền thoại chưa max thì giữ pack bảo hiểm."] },
  ],
}, {
  version: "2026.10.22.1",
  date: "2026-10-22",
  title: "Đi ải đa dạng, theo dõi đội hình",
  summary: "Đội địch có nhiều cách phối hợp hơn, màn hình trước ải gọn hơn và thêm Phân tích số liệu.",
  sections: [
    { title: "Đi ải", entries: ["Thay vòng lặp 12 đội bằng 729 tổ hợp có liên kết. Từ ải 31 ưu tiên đội có nhiều liên kết hoặc hội đủ ba người; trang bị thay đổi trong giới hạn thông thường.", "Trước trận chỉ hiện đội địch và một câu mô tả. Boss có chỉ huy được cường hóa và hai quân hỗ trợ dùng chỉ số thường."] },
    { title: "Phân tích số liệu", entries: ["Lưu 200 trận hoàn tất gần nhất trên trình duyệt: ai hạ ai, tỉ lệ thắng, cấp và trang bị từng trận, số lần liên kết/hội kích hoạt. Có lọc theo chế độ, nhân vật và xuất JSON."] },
    { title: "Pack Boss", entries: ["Sau 49 Pack Boss liên tiếp chưa ra Huyền thoại, pack thứ 50 bảo đảm Huyền thoại. Sử thi không đặt lại bộ đếm; bảo hiểm pack thường độc lập."] },
  ],
}, {
  version: "2026.10.21.4",
  date: "2026-10-21",
  title: "Nội tại riêng, Huyền thoại đúng vai trò",
  summary: "Làm lại nội tại của toàn bộ 33 nhân vật, bộ chiêu của 5 Huyền thoại và popup nhận thưởng.",
  sections: [
    { title: "Popup và phần thưởng", entries: ["Căn giữa popup cập nhật, quà tân thủ và thưởng trận trên desktop, điện thoại và màn hình ngang; dùng animation riêng để giữ đúng tâm màn hình.", "Thắng đi ải hoặc multiplayer hiện popup số pack thường và Pack Boss thực nhận. Báo rõ phần vượt kho đầy; lưu thưởng trước khi hiển thị, đóng popup hoặc tải lại không nhận trùng."] },
    { title: "33 nội tại khác nhau", entries: ["Mỗi nhân vật cũ và mới có cơ chế riêng: đánh dấu, combo cùng mục tiêu, bẫy, nảy tường, giải chậm, hỗ trợ theo vị trí hoặc tiếp tế. Cùng class vẫn có cách build và vai trò khác nhau.", "Hiệu ứng chạy trong chiến đấu, có điều kiện, thời gian và giới hạn rõ ràng; mô tả trong kho đồ khớp cơ chế thực tế."] },
    { title: "Năm Huyền thoại", entries: ["Đẳng Cấp Aura là hỗ trợ phát aura cho đồng đội; rời tầm hoặc hạ nguồn thì mất buff. King Of RiseOn là đấu sĩ nối dài tầm vũ khí bằng aura trong thời gian ngắn.", "Ủn Đại Ca là xạ thủ phóng xạ, tối đa 3 tầng và giảm hồi máu tối đa 24%; đạn cần trúng và vẫn bị khiên, giáp, chặn đạn khắc chế.", "Bang Chủ Cái Bang đặt đại trận rộng, cố định, báo trước 0,5 giây và chỉ giữ một vùng chiêu. Sóc Jake là hộ vệ ném đồ ăn tấn công, đồng thời chia phần hồi phục."] },
    { title: "Hình ảnh và cân bằng", entries: ["Cập nhật ảnh Ủn Đại Ca mới; xoay vũ khí của Ủn, Bang Chủ và Jake sang chiều dọc, đầu vũ khí khớp hướng đánh.", "Thêm VFX aura, kiếm vươn xa, phóng xạ, đại trận và đồ ăn. Điều chỉnh chỉ số và proc qua đấu đơn, đấu đội, build hợp cạ và các ải thường; mỗi card đều có counter trong mẫu mô phỏng."] },
  ],
}, {
  version: "2026.10.21.3",
  date: "2026-10-21",
  title: "Đi ải chiến thuật, hợp cạ có bản sắc",
  summary: "33 nhân vật, 33 vật phẩm; Pack Boss và đội hình địch có chiến thuật rõ ràng.",
  sections: [
    { title: "Đi ải", entries: ["Bỏ scale HP/ATK ẩn ở ải thường. Địch dùng đúng level và trang bị hiển thị, tối đa Lv.10; 12 đội hình có hội bạn, liên kết và gợi ý khắc chế.", "Boss mỗi 5 ải nhận 1 Pack Boss; boss khó mỗi 10 ải nhận 3 Pack Boss, ngoài phần thưởng pack thường."] },
    { title: "Card và hội bạn", entries: ["Thêm Ủn Đại Ca, Bang Chủ Cái Bang và Sóc Jake (Huyền thoại), cùng Bút Chì Bạc, Dép Tổ Ong và Huy Hiệu HB; thêm vũ khí, VFX, mô tả và liên kết.", "Tất cả quỳ xuống hoạt động khi có Sếp Chốt Đơn hoặc Đẳng Cấp Aura; hai hạt nhân dùng chung giới hạn lượt và hồi chiêu.", "Bổ sung hội cho các nhân vật #26–30 và ba nhân vật mới. Điều chỉnh card cũ và mới qua mô phỏng đấu đơn và đấu đội.", "Rarity chỉ tăng 4% sức mạnh mỗi bậc và tối đa 2% trong bậc, giảm chênh lệch chỉ số để chiến thuật counter có tác dụng."] },
    { title: "Hợp cạ", entries: ["Cả 33 vật phẩm đều có hiệu ứng bổ sung khi gắn đúng người: giải chậm, khiên, hồi máu, năng lượng hoặc cường hóa đòn đánh. Hiệu ứng có hồi chiêu và giới hạn lượt, tăng theo cấp vật phẩm.", "Giữ biến hình Fu Di, Wacom và Skyrocket Dog; mô tả hợp cạ hiển thị giá trị đúng cấp vật phẩm."] },
    { title: "Pack và tỉ lệ", entries: ["Pack Boss dùng hình Sóc Jake, nằm dưới pack thường; chỉ nhận từ boss, không tự hồi.", "Hiển thị bảng tỉ lệ theo rarity cho cả hai loại: thường 84% / 14% / 1,7% / 0,3%; Boss 66% / 14% / 17% / 3% (Thường / Hiếm / Sử thi / Huyền thoại).", "Pack Boss không ảnh hưởng bảo hiểm pack thường. Lưu số lượng và kết quả trước animation; card đạt tối đa không tiếp tục rơi."] },
  ],
}, {
  version: "2026.10.21.2",
  date: "2026-10-21",
  title: "Mở pack sống động, chiến đấu rõ nét",
  summary: "Cải thiện cảm giác mở thẻ, thử đội hình và chinh phục các mốc boss.",
  sections: [
    { title: "Mở pack", entries: [
      "Pack xếp thành các lớp 3D. Camera tiến liên tục qua chồng pack; từng pack xé miệng khi camera đi tới.",
      "Ánh sáng rarity tỏa mềm từ bên trong miệng pack, có quầng sáng và hạt lấp lánh. Pack đã mở tiếp tục trôi qua khung hình.",
      "Tăng tốc khi mở nhiều pack: 10 pack khoảng 2,4 giây, 100 pack khoảng 7,5 giây. Có thể bỏ qua animation để xem kết quả.",
      "Giới hạn tối đa 15 lớp pack trong khung nhìn khi mở 100 pack, giảm số hạt và lớp blur để tránh quá tải.",
      "Lưu toàn bộ thẻ, EXP và số pack trước animation. Hồ sơ chờ đồng bộ được khôi phục sau reload; có thể xem lại kết quả lần mở gần nhất.",
    ] },
    { title: "Đi ải & boss", entries: [
      "Mỗi 5 ải có một boss lớn hơn khoảng 65%, có thêm máu, sát thương và khối lượng; thanh máu và nhãn BOSS được làm rõ.",
      "Đội hình địch thay đổi theo từng ải và trải rộng trên toàn bộ nhân vật. Sức mạnh vẫn theo cùng một đường chỉ số; boss được tính theo số nhân vật đi ải.",
      "Thắng ải nhận 5 pack, hạ boss nhận 15 pack. Client và server dùng chung cách tạo ải và tính thưởng.",
    ] },
    { title: "Mô phỏng", entries: [
      "Có thể chọn vật phẩm cho từng nhân vật của tất cả các đội ngay trong phần đội hình.",
      "Vật phẩm hợp cạ được đưa lên đầu danh sách. Biến hình và hiệu ứng trang bị hoạt động trong trận mô phỏng.",
      "Điều chỉnh riêng cấp nhân vật và cấp vật phẩm từ 1–10 cho từng slot của mọi đội.",
    ] },
    { title: "Vũ khí & VFX", entries: [
      "Phóng lớn phần hình vũ khí của 5 nhân vật mới; vũ khí cận chiến có bề ngang rõ hơn và bớt khoảng trống quanh sprite.",
      "Thêm animation kỹ năng và Super riêng: sóng nhạc Phonk, lò lửa cơ khí, vuốt máy, nét vẽ số và bóng bay tên lửa.",
      "Mỗi nhân vật tầm xa có sprite đạn và màu vệt bay riêng, áp dụng cho cả đòn thường, kỹ năng và Super.",
    ] },
    { title: "Giao diện", entries: ["Gom điều hướng vào thanh bên phải đóng/mở bằng nút Menu, cùng phía với nút mở menu.", "Bố cục một cột và các nút chọn đội hình phù hợp màn hình điện thoại.", "Thêm trang Patch notes và liên kết từ popup thông báo cập nhật."] },
  ],
}] as const;

export const CURRENT_RELEASE_VERSION = PATCH_NOTES[0].version;

export function PatchNotesPage() {
  return <section className="profile-screen patch-notes-page" aria-label="Patch notes">
    <div className="panel-title"><h2>Nhật ký cập nhật</h2><span className="release-badge">v{CURRENT_RELEASE_VERSION}</span></div>
    {PATCH_NOTES.map((release, index) => <article className="patch-release" key={release.version}>
      <div className="patch-release-meta"><b>{index === 0 ? "BẢN MỚI NHẤT" : `v${release.version}`}</b><time dateTime={release.date}>{release.date.split("-").reverse().join("/")}</time></div>
      <h3>{release.title}</h3><p className="muted">{release.summary}</p>
      <div className="patch-sections">{release.sections.map(section => <section className="patch-section" key={section.title}><h4>{section.title}</h4><ul>{section.entries.map(entry => <li key={entry}>{entry}</li>)}</ul></section>)}</div>
    </article>)}
  </section>;
}
