import type { Stats } from "./balance";

export type CombatRole =
  "tank" | "fighter" | "controller" | "ranger" | "support" | "assassin";
export interface CharacterBalance {
  role: CombatRole;
  stats: Partial<Stats>;
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
  mass = 100,
): CharacterBalance => ({
  role,
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
  char_01: unit("tank", 265, 14, 10, 365, 29, 6400, 5, 100, 170),
  char_02: unit("fighter", 265, 21, 8, 460, 24, 6600, 8, 100),
  char_03: unit("controller", 205, 13, 4, 425, 30, 5100, 7, 105),
  char_04: unit("fighter", 245, 21, 6, 495, 23, 6800, 10, 95),
  char_05: unit("ranger", 185, 15, 4, 455, 30, 4700, 14, 95),
  char_06: unit("support", 205, 12, 4, 435, 30, 6200, 6, 110),
  char_07: unit("controller", 245, 19, 7, 500, 23, 6500, 8, 100),
  char_08: unit("fighter", 265, 21, 7, 445, 25, 6500, 11, 100),
  char_09: unit("controller", 210, 15, 4, 410, 31, 5200, 6, 115),
  char_10: unit("tank", 310, 15, 10, 380, 29, 6100, 4, 100, 190),
  char_11: unit("support", 235, 15, 7, 405, 29, 6400, 5, 115, 125),
  char_12: unit("fighter", 240, 18, 6, 455, 26, 6600, 12, 95),
  char_13: unit("support", 230, 13, 5, 435, 29, 4800, 7, 120),
  char_14: unit("controller", 220, 18, 6, 395, 30, 6000, 8, 120),
  char_15: unit("tank", 275, 14, 10, 395, 30, 6500, 5, 100, 155),
  char_16: unit("controller", 200, 15, 4, 465, 29, 5300, 9, 100),
  char_17: unit("assassin", 210, 20, 6, 570, 20, 6300, 17, 95, 85),
  char_18: unit("fighter", 240, 20, 6, 420, 28, 6500, 6, 105, 130),
  char_19: unit("support", 240, 19, 6, 445, 24, 6300, 8, 105),
  char_20: unit("support", 235, 18, 6, 460, 25, 6300, 9, 105),
  char_21: unit("tank", 260, 12, 9, 345, 32, 6700, 4, 110, 180),
  char_22: unit("support", 265, 19, 8, 415, 25, 6500, 6, 110, 115),
  char_23: unit("fighter", 245, 18, 7, 435, 26, 6500, 10, 110),
  char_24: unit("ranger", 205, 15, 4, 430, 28, 4900, 12, 100),
  char_25: unit("tank", 300, 17, 12, 405, 26, 6800, 6, 105, 160),
  char_26: unit("assassin", 215, 20, 4, 570, 21, 6100, 18, 95, 85),
  char_27: unit("fighter", 250, 20, 7, 420, 24, 6400, 8, 110),
  char_28: unit("tank", 270, 15, 9, 375, 29, 6600, 4, 100, 145),
  char_29: unit("ranger", 225, 18, 5, 440, 25, 5000, 9, 105, 90),
  char_30: unit("fighter", 235, 17, 7, 440, 26, 6500, 6, 100, 90),
  char_31: unit("ranger", 205, 13, 4, 420, 30, 5100, 9, 100, 100),
  char_32: unit("controller", 225, 13, 5, 425, 29, 5200, 7, 100, 110),
  char_33: unit("tank", 240, 11, 9, 370, 32, 6500, 5, 95, 165),
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
  item_31: { attack: 2, charge: 10 },
  item_32: { speed: 25, hp: 18 },
  item_33: { hp: 18, superPower: 10 },
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
  item_31:
    "Tăng sát thương và tốc độ nạp Super; Bút Chì Bạc không xuyên khiên hay đạn chặn.",
  item_32: "Tăng tốc độ và máu; cần áp sát để phát huy hiệu quả.",
  item_33:
    "Tăng máu và sức mạnh Super; hồi phục vẫn bị giới hạn bởi máu tối đa.",
};
