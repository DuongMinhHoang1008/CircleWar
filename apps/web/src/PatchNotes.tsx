import React from "react";

export const PATCH_NOTES = [{
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
