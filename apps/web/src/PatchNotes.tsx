import React from "react";

export const PATCH_NOTES = [{
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
