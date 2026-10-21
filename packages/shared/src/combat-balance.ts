import type { Stats } from "./balance";

export type CombatRole =
  "tank" | "fighter" | "controller" | "ranger" | "support" | "assassin";
export interface CharacterBalance {
  role: CombatRole;
  stats: Partial<Stats>;
  passive: number;
}

// All values below use the T1 power budget. Printed rarity never changes identity.
const unit = (
  role: CombatRole,
  hp: number,
  attack: number,
  defense: number,
  speed: number,
  cooldown: number,
  reach: number,
  crit: number,
  charge: number,
  passive: number,
  mass = 100,
): CharacterBalance => ({
  role,
  passive,
  stats: {
    hp,
    attack,
    defense,
    speed,
    cooldown,
    reach,
    crit,
    charge,
    mass,
    critPower: role === "assassin" ? 175 : 150,
    superPower: 100,
    shield: 0,
  },
});

export const CHARACTER_BALANCE: Record<string, CharacterBalance> = {
  char_01: unit("tank", 285, 15, 12, 365, 29, 6400, 5, 100, 5, 170),
  char_02: unit("fighter", 250, 18, 7, 445, 25, 6500, 8, 100, 18),
  char_03: unit("controller", 220, 16, 5, 425, 27, 5100, 7, 105, 12),
  char_04: unit("fighter", 235, 19, 5, 495, 24, 5900, 10, 95, 16),
  char_05: unit("ranger", 210, 17, 4, 455, 25, 4700, 14, 95, 3),
  char_06: unit("support", 255, 19, 7, 435, 23, 6200, 6, 110, 5),
  char_07: unit("controller", 225, 15, 6, 445, 26, 4900, 8, 100, 14),
  char_08: unit("fighter", 250, 18, 6, 425, 27, 6100, 11, 100, 20),
  char_09: unit("controller", 215, 17, 5, 410, 29, 5200, 6, 115, 13),
  char_10: unit("tank", 310, 15, 10, 380, 29, 6100, 4, 100, 6, 190),
  char_11: unit("support", 260, 17, 9, 405, 27, 6400, 5, 115, 6, 125),
  char_12: unit("fighter", 240, 18, 6, 455, 26, 6800, 12, 95, 16),
  char_13: unit("support", 210, 12, 5, 430, 32, 4800, 7, 110, 5),
  char_14: unit("controller", 230, 17, 4, 395, 30, 5000, 8, 110, 12),
  char_15: unit("tank", 280, 15, 13, 395, 29, 6500, 5, 95, 5, 155),
  char_16: unit("controller", 210, 16, 4, 465, 26, 5300, 9, 105, 11),
  char_17: unit("assassin", 215, 20, 4, 570, 21, 5700, 18, 95, 22, 85),
  char_18: unit("fighter", 260, 19, 7, 390, 29, 6200, 6, 105, 18, 130),
  char_19: unit("support", 240, 19, 6, 445, 24, 6300, 8, 105, 4),
  char_20: unit("support", 245, 19, 6, 460, 23, 6300, 9, 105, 4),
  char_21: unit("tank", 300, 14, 14, 345, 31, 6700, 4, 110, 6, 180),
  char_22: unit("controller", 220, 16, 6, 435, 27, 5400, 8, 110, 12),
  char_23: unit("fighter", 245, 18, 7, 435, 27, 6600, 10, 100, 18),
  char_24: unit("ranger", 215, 18, 4, 430, 27, 4900, 12, 100, 3),
  char_25: unit("tank", 295, 16, 11, 385, 28, 6800, 6, 105, 5, 160),
  char_26: unit("assassin", 215, 18, 4, 570, 21, 5700, 18, 95, 12, 85),
  char_27: unit("fighter", 250, 18, 7, 420, 26, 6000, 8, 100, 14),
  char_28: unit("tank", 195, 13, 3, 360, 31, 5600, 4, 100, 5, 120),
  char_29: unit("ranger", 185, 14, 3, 390, 28, 5000, 9, 105, 5, 90),
  char_30: unit("fighter", 205, 14, 4, 430, 28, 5900, 6, 100, 5, 80),
};

// Stat + triggered-effect budget for a T1 item; scale both with current rarity.
export const ITEM_BALANCE: Record<string, Partial<Stats>> = {
  item_01: { charge: 18 },
  item_02: { hp: 20 },
  item_03: { hp: 42 },
  item_04: { hp: 20, attack: 2 },
  item_05: { hp: 55, mass: 30, speed: -20 },
  item_06: { hp: 10, speed: 25, defense: 5 },
  item_07: { attack: 2 },
  item_08: { superPower: 14 },
  item_09: { attack: 2, cooldown: -1 },
  item_10: { speed: 25, charge: 12 },
  item_11: { defense: 6, mass: 25 },
  item_12: { hp: 12 },
  item_13: { attack: 3 },
  item_14: { attack: 2 },
  item_15: { hp: 24 },
  item_16: { attack: 2, cooldown: -1 },
  item_17: { hp: 24, defense: 3 },
  item_18: { crit: 7 },
  item_19: { hp: 25 },
  item_20: { shield: 10 },
  item_21: { charge: 16, cooldown: -1 },
  item_22: { hp: 20, speed: 15, stability: 35, shield: 8 },
  item_23: { defense: 4, superPower: 10 },
  item_24: { hp: 20, thorns: 2 },
  item_25: { attack: 1, shield: 10, burn: 2 },
  item_26: { charge: 18 },
  item_27: { burn: 2, attack: 1 },
  item_28: { speed: 24 },
  item_29: { attack: 3 },
  item_30: { speed: 28 },
};

export const ITEM_EFFECT_TEXT: Record<string, string> = {
  item_01: "Mỗi 10 giây nhận {5} năng lượng, tối đa 6 lần mỗi trận.",
  item_02:
    "Một lần mỗi trận, còn sống dưới 40% HP: nhận {28} khiên trong 3 giây.",
  item_03: "Tăng máu tối đa; không có hiệu ứng ngẫu nhiên.",
  item_04: "Tăng máu và ATK, phù hợp nhân vật áp sát.",
  item_05: "Tăng độ bền và khối lượng, đổi lại giảm tốc độ di chuyển.",
  item_06: "Tăng tốc độ và giáp giảm sát thương.",
  item_07: "Mỗi 4 đòn trúng làm chậm {15}% trong 1 giây; hồi 3 giây.",
  item_08: "Sau Super, đòn thường kế tiếp thêm {25}% ATK trong tối đa 4 giây.",
  item_09:
    "Sau Super, tăng {8}% ATK trong 3 giây. Các nguồn khác nhau cộng dồn.",
  item_10: "Tăng tốc độ và tốc độ tích năng lượng Super.",
  item_11: "Va chạm thân làm chậm {12}% trong 1 giây; hồi 4 giây.",
  item_12: "Nhận {30} khiên đầu trận, tồn tại tối đa 10 giây.",
  item_13: "Hạ gục đối thủ hồi {12} HP; không vượt máu tối đa.",
  item_14:
    "Mỗi 3 đòn trúng gây {2} sát thương mỗi giây trong 3 giây; hồi 5 giây. Cùng nguồn làm mới thời gian.",
  item_15:
    "Một lần mỗi trận, xóa làm chậm và miễn chậm trong {30} tick (30 tick = 1 giây).",
  item_16: "Mỗi 4 đòn trúng, đòn kế tiếp thêm {18}% ATK.",
  item_17: "Một lần mỗi trận, còn sống dưới 30% HP: hồi {16} HP.",
  item_18:
    "Một lần mỗi trận, còn sống dưới 25% HP: nhận {28} khiên và {8}% tốc độ trong 2 giây.",
  item_19: "Mỗi 5 giây hồi {4} HP, tối đa 4 lần mỗi trận.",
  item_20:
    "Sau Super, đồng minh yếu nhất trong 180 nhận {8} khiên trong 3 giây.",
  item_21:
    "Mỗi lần tung Super hoàn lại {6} năng lượng. Không tự kích hoạt Super liên tiếp.",
  item_22:
    "Kháng đẩy tăng lực ổn định; tốc độ và khiên đầu trận tăng theo cấp thẻ.",
  item_23: "Sau Super, nhận {8} khiên trong 3 giây.",
  item_24:
    "Sau khi sống sót trước đòn thường, phản sát thương theo chỉ số Phản đòn. Không tạo chuỗi phản đòn.",
  item_25:
    "Đòn thường gây đốt theo chỉ số Đốt trong 2 giây; cùng nguồn làm mới thời gian, khác nguồn cộng dồn.",
  item_26: "Tăng tốc độ nạp năng lượng Super.",
  item_27: "Tăng nhẹ sát thương và sức mạnh hiệu ứng Đốt.",
  item_28: "Tăng {24} tốc độ di chuyển.",
  item_29: "Tăng {3} sát thương mỗi đòn.",
  item_30: "Tăng {28} tốc độ di chuyển.",
};

export const ROLE_TEXT: Record<
  CombatRole,
  { passive: string; skill: string; super: string }
> = {
  tank: {
    passive: "Mỗi 4 đòn trúng nhận khiên cá nhân; hồi nội tại 3 giây.",
    skill:
      "Mỗi 7 giây đánh 110% ATK trong tầm vũ khí và tạo khiên bằng 3% máu tối đa.",
    super: "Đánh 150% ATK trong tầm vũ khí và nhận khiên bằng 12% máu tối đa.",
  },
  fighter: {
    passive: "Mỗi 4 đòn trúng tăng sát thương đòn kế tiếp; hồi nội tại 3 giây.",
    skill: "Mỗi 7 giây đánh 130% ATK trong tầm vũ khí.",
    super: "Đánh 280% ATK trong tầm vũ khí. Sức mạnh Super tăng sát thương.",
  },
  assassin: {
    passive: "Mỗi 4 đòn trúng cường hóa đòn kế tiếp; hồi nội tại 3 giây.",
    skill: "Mỗi 7 giây đánh 150% ATK trong tầm vũ khí.",
    super: "Đánh 320% ATK trong tầm vũ khí. Đổi độ bền lấy tốc độ và chí mạng.",
  },
  controller: {
    passive: "Mỗi 4 đòn trúng làm chậm mục tiêu 1 giây; hồi nội tại 3 giây.",
    skill:
      "Mỗi 7 giây bắn đạn 120% ATK, tầm 260; đạn chạm làm chậm 15% trong 1 giây.",
    super: "Bắn đạn 240% ATK, tầm 300; làm chậm 20% trong 1,5 giây khi chạm.",
  },
  ranger: {
    passive: "Mỗi 4 đòn trúng nhận thêm năng lượng; hồi nội tại 3 giây.",
    skill: "Mỗi 7 giây bắn đạn 140% ATK, tầm 260. Có thể né hoặc chặn đạn.",
    super: "Bắn đạn 300% ATK, tầm 300. Sức mạnh Super tăng sát thương.",
  },
  support: {
    passive:
      "Mỗi 4 đòn trúng hồi máu cho đồng minh yếu nhất trong 160; hồi nội tại 3 giây.",
    skill:
      "Mỗi 7 giây tạo khiên 100% ATK cho đồng minh yếu nhất trong 180 (3 giây); đánh 80% ATK nếu có địch trong tầm. Đòn xa có đạn.",
    super:
      "Hồi 10% máu tối đa và tạo khiên 50% ATK cho đồng minh yếu nhất trong 180; đánh 160% ATK nếu có địch trong tầm. Đòn xa có đạn.",
  },
};
