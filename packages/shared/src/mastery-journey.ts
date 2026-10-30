import { ROSTER } from "./catalog";

export interface JourneyObjective {
  kind:
    | "winOrSignature"
    | "effect"
    | "damage"
    | "control"
    | "healing"
    | "allyHealing"
    | "shielding"
    | "allyShielding"
    | "buff"
    | "buffTime"
    | "endure"
    | "bond";
  text: string;
  amount: number;
  effect?: string;
}
const effect = (id: string, label: string, amount = 1): JourneyObjective => ({
  kind: "effect",
  effect: id,
  amount,
  text: `Áp ${label} ít nhất ${amount} lần trong trận.`,
});
const damage = (amount = 25): JourneyObjective => ({
  kind: "damage",
  amount,
  text: `Gây sát thương lên địch ít nhất bằng ${amount}% HP tối đa của bản thân.`,
});
const control = (amount = 30): JourneyObjective => ({
  kind: "control",
  amount,
  text: `Tích lũy ${amount / 30} giây khống chế địch trong trận.`,
});
const recovery = (
  kind: "healing" | "allyHealing" | "shielding" | "allyShielding",
  amount = 1,
): JourneyObjective => ({
  kind,
  amount,
  text: `${kind.includes("Healing") || kind === "healing" ? "Hồi HP thực" : "Tạo khiên"}${kind.startsWith("ally") ? " cho đồng đội khác" : " cho bản thân hoặc đồng đội"} ít nhất ${amount} HP trong trận.`,
});
const buff = (amount = 1): JourneyObjective => ({
  kind: "buff",
  amount,
  text: `Áp buff cho đồng đội khác ít nhất ${amount} lần trong trận.`,
});
const buffTime = (amount: number): JourneyObjective => ({
  kind: "buffTime",
  amount,
  text: `Tích lũy ${amount / 30} giây buff cho đồng đội khác trong trận.`,
});
const endure: JourneyObjective = {
  kind: "endure",
  amount: 15,
  text: "Sống ít nhất 15 giây và nhận sát thương HP trong trận.",
};
const bond: JourneyObjective = {
  kind: "bond",
  amount: 1,
  text: "Đội kích hoạt ít nhất một liên kết hoặc hội trong trận.",
};

// Stage 2 teaches the signature; stage 3 asks for a different contribution or
// a sustained use of it. One completed battle can advance at most one step.
const journeys: Record<
  string,
  readonly [string, JourneyObjective, JourneyObjective]
> = {
  char_01: [
    "Bình tĩnh giữa hỗn loạn",
    effect("introvert", "Hướng Nội"),
    endure,
  ],
  char_02: ["Ôm trọn cơn bão", effect("diabetes", "Tiểu Đường"), damage(50)],
  char_03: ["Mùa quả nảy", damage(), damage(60)],
  char_04: ["Vũ điệu gió lốc", damage(), endure],
  char_05: [
    "Nhìn thấu điểm mù",
    effect("myopia", "Cận Thị"),
    effect("myopia", "Cận Thị", 2),
  ],
  char_06: ["Người phối màu", buff(), control(60)],
  char_07: ["Can đảm từng nhịp", control(), endure],
  char_08: ["Dưới trăng máu", effect("bleeding", "Bleeding"), damage(60)],
  char_09: [
    "Nghệ thuật chốt hạn",
    effect("paralyzed", "Paralyzed"),
    control(90),
  ],
  char_10: ["Lăn qua giông gió", recovery("shielding"), endure],
  char_11: ["Người truyền cảm hứng", recovery("allyShielding"), buff(3)],
  char_12: ["Nhịp kiếm vô thường", damage(), damage(75)],
  char_13: ["Tiếp tế không ngừng", recovery("allyHealing"), buff(3)],
  char_14: ["Đạo quân quà tặng", damage(), endure],
  char_15: ["Lời thề không lùi", endure, damage(50)],
  char_16: ["Nét mực chuyển dòng", effect("frozen", "Frozen"), control(90)],
  char_17: ["Chuyến giao cuối cùng", damage(), endure],
  char_18: ["Giữ lửa bàn tiệc", effect("burn", "Burn"), recovery("healing")],
  char_19: ["Lộc đến đúng người", buff(), control(30)],
  char_20: ["Hoa nở trong giao tranh", bond, buff(3)],
  char_21: ["Áp suất đột phá", recovery("shielding"), damage(60)],
  char_22: ["Hào quang đồng đội", buff(), buffTime(120)],
  char_23: ["Đường kiếm xưng vương", damage(), damage(75)],
  char_24: ["Mực viết thành trận", control(15), damage(50)],
  char_25: ["Tài sản giữa chiến trường", recovery("shielding"), endure],
  char_26: ["Giữ nhịp tâm bão", damage(), damage(60)],
  char_27: ["Nhiệt huyết lõi đỏ", effect("burn", "Burn"), damage(60)],
  char_28: ["Khởi động lõi mới", damage(), endure],
  char_29: ["Sửa từng điểm ảnh", damage(), damage(60)],
  char_30: ["Bóng bay vượt sóng", damage(), endure],
  char_31: ["Kiểm soát phản ứng", effect("radiation", "Phóng xạ"), damage(60)],
  char_32: ["Dấu dép thành trận", effect("frozen", "Frozen"), control(90)],
  char_33: ["Bữa tiệc boomerang", recovery("healing"), damage(50)],
};
export const CHARACTER_JOURNEYS = ROSTER.map((c) => {
  const [title, signature, finale] = journeys[c.id];
  return {
    id: c.id,
    title,
    text: signature.text,
    objectives: [
      {
        kind: "winOrSignature",
        amount: 1,
        text: `Thắng trận hoặc: ${signature.text}`,
      } as JourneyObjective,
      signature,
      finale,
    ],
  };
});
export function journeyStage(count: number) {
  return count < 3 ? 0 : count < 8 ? 1 : 2;
}
export function journeyObjective(id: string, count: number) {
  return CHARACTER_JOURNEYS.find((j) => j.id === id)!.objectives[
    journeyStage(count)
  ];
}
