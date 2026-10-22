/** Character identity is independent of the legacy class used for attack geometry. */
export type PassiveTrigger =
  | "hit"
  | "taken"
  | "skill"
  | "super"
  | "pulse"
  | "wall"
  | "contact"
  | "low"
  | "kill"
  | "start"
  | "allyLow";
export type PassiveEffect =
  | "shield"
  | "allyShield"
  | "skillRefund"
  | "speed"
  | "mark"
  | "allyHaste"
  | "escape"
  | "lifesteal"
  | "allyEnergy"
  | "ram"
  | "allyCleanse"
  | "combo"
  | "allyHeal"
  | "trap"
  | "guard"
  | "bonus"
  | "mealBurn"
  | "gift"
  | "allyBonus"
  | "battery"
  | "aura"
  | "reach"
  | "energy"
  | "shareShield"
  | "cleanseSpeed"
  | "heatZone"
  | "openingShield"
  | "reload"
  | "balloon"
  | "radiation"
  | "zoneGuard"
  | "meal";
export interface PassiveSpec {
  name: string;
  niche: string;
  trigger: PassiveTrigger;
  effect: PassiveEffect;
  every: number;
  cooldown: number;
  maxUses: number;
  value: number;
  duration: number;
  range: number;
  condition?:
    | "slowed"
    | "debuffed"
    | "targetLow"
    | "rangedSource"
    | "consecutive"
    | "otherAlly"
    | "ownZone";
  text: string;
}
const passive = (
  name: string,
  niche: string,
  trigger: PassiveTrigger,
  effect: PassiveEffect,
  every: number,
  cooldown: number,
  maxUses: number,
  value: number,
  duration: number,
  range: number,
  text: string,
  condition?: PassiveSpec["condition"],
): PassiveSpec => ({
  name,
  niche,
  trigger,
  effect,
  every,
  cooldown,
  maxUses,
  value,
  duration,
  range,
  text,
  condition,
});

export const CHARACTER_PASSIVES: Record<string, PassiveSpec> = {
  char_01: passive(
    "Đừng Đụng Tui",
    "Hộ vệ / hấp thụ áp lực",
    "taken",
    "shield",
    3,
    180,
    5,
    3,
    60,
    0,
    "Sau mỗi 3 đòn thường nhận phải mà còn sống, tạo khiên bằng {value}% HP tối đa trong {duration} giây; hồi {cooldown} giây, tối đa {maxUses} lần/trận.",
  ),
  char_02: passive(
    "Ôm Đồng Đội",
    "Đấu sĩ / bảo kê cận chiến",
    "hit",
    "allyShield",
    4,
    150,
    5,
    3,
    60,
    140,
    "Mỗi {every} đòn thường trúng cấp khiên bằng {value}% HP của Bé cho đồng minh yếu nhất trong {range}, tồn tại {duration} giây; hồi {cooldown} giây, tối đa {maxUses} lần/trận.",
  ),
  char_03: passive(
    "Vitamin Bắt Nhịp",
    "Kiểm soát / duy trì kỹ năng",
    "hit",
    "skillRefund",
    3,
    180,
    4,
    24,
    0,
    0,
    "Mỗi {every} đòn thường trúng mục tiêu đang chậm rút ngắn hồi kỹ năng {value} tick (30 tick = 1 giây); hồi {cooldown} giây, tối đa {maxUses} lần/trận.",
    "slowed",
  ),
  char_04: passive(
    "Đạp Tường Lấy Đà",
    "Đấu sĩ / truy đuổi",
    "wall",
    "speed",
    1,
    150,
    5,
    10,
    60,
    0,
    "Nảy tường tăng {value}% tốc độ trong {duration} giây; hồi {cooldown} giây, tối đa {maxUses} lần/trận.",
  ),
  char_05: passive(
    "Soi Điểm Yếu",
    "Xạ thủ / đánh dấu cho đội",
    "hit",
    "mark",
    3,
    150,
    5,
    12,
    90,
    0,
    "Mỗi {every} đòn thường trúng đánh dấu mục tiêu {duration} giây: đòn thường kế tiếp của một đồng minh thêm {value}% sát thương rồi xóa dấu. Các dấu không cộng dồn; hồi {cooldown} giây, tối đa {maxUses} lần/trận.",
  ),
  char_06: passive(
    "Quẩy Đúng Nhịp",
    "Hỗ trợ / tăng nhịp đánh",
    "skill",
    "allyHaste",
    1,
    210,
    4,
    8,
    90,
    180,
    "Sau kỹ năng, đồng minh khác yếu nhất trong {range} tăng {value}% tốc độ đánh trong {duration} giây; tối đa {maxUses} lần/trận. Không tự nhận.",
    "otherAlly",
  ),
  char_07: passive(
    "Nhát Nhưng Biết Chạy",
    "Kiểm soát / thoát hiểm",
    "low",
    "escape",
    1,
    0,
    1,
    10,
    60,
    0,
    "Một lần/trận khi còn sống dưới 40% HP: xóa chậm, miễn chậm 1 giây và tăng {value}% tốc độ trong {duration} giây. Không cứu đòn kết liễu.",
  ),
  char_08: passive(
    "Sói Tự Chữa Lành",
    "Đấu sĩ / hút máu theo nhịp",
    "hit",
    "lifesteal",
    4,
    150,
    5,
    25,
    0,
    0,
    "Mỗi {every} đòn thường trúng hồi {value}% lượng HP thực vừa gây mất; hồi {cooldown} giây, tối đa {maxUses} lần/trận. Đánh khiên không hồi máu.",
  ),
  char_09: passive(
    "Chốt Đơn Tiếp Sức",
    "Kiểm soát / điều phối Super",
    "super",
    "allyEnergy",
    1,
    300,
    3,
    5,
    0,
    180,
    "Sau Super cấp {value} năng lượng cho tối đa 2 đồng minh khác trong {range}; hồi {cooldown} giây, tối đa {maxUses} lần/trận. Không tự kích hoạt chuỗi Super.",
  ),
  char_10: passive(
    "Lốp Có Giảm Xóc",
    "Hộ vệ / cản đường",
    "contact",
    "ram",
    1,
    180,
    4,
    3,
    60,
    0,
    "Va chạm thân địch tạo khiên bằng {value}% HP tối đa trong {duration} giây và đẩy địch nhẹ; hồi {cooldown} giây, tối đa {maxUses} lần/trận.",
  ),
  char_11: passive(
    "Cờ Giải Vây",
    "Hỗ trợ / giải khống chế",
    "skill",
    "allyCleanse",
    1,
    210,
    4,
    6,
    60,
    180,
    "Sau kỹ năng, đồng minh yếu nhất trong {range} được xóa chậm và thêm {value} khiên trong {duration} giây; tối đa {maxUses} lần/trận. Không cấp miễn chậm.",
  ),
  char_12: passive(
    "Ba Nhát Một Nhịp",
    "Đấu sĩ / đấu một mục tiêu",
    "hit",
    "combo",
    3,
    150,
    5,
    16,
    90,
    0,
    "Trúng cùng một mục tiêu {every} đòn thường liên tiếp: đòn kế tiếp thêm {value}% ATK trong {duration} giây. Đổi mục tiêu xóa bộ đếm; hồi {cooldown} giây, tối đa {maxUses} lần/trận.",
    "consecutive",
  ),
  char_13: passive(
    "Vitamin Theo Giờ",
    "Hỗ trợ / hồi phục định kỳ",
    "pulse",
    "allyHeal",
    1,
    180,
    4,
    6,
    0,
    180,
    "Mỗi {cooldown} giây hồi {value} HP cho đồng minh yếu nhất trong {range}, tối đa {maxUses} lần/trận. Không hồi vượt HP tối đa.",
  ),
  char_14: passive(
    "Quà Có Bẫy",
    "Kiểm soát / bẫy áp sát",
    "skill",
    "trap",
    1,
    210,
    3,
    25,
    90,
    55,
    "Sau kỹ năng đặt bẫy dưới mục tiêu trong {duration} giây, bán kính {range}; bẫy nổ một lần gây {value}% ATK và chậm 12% trong 1 giây. Tối đa {maxUses} bẫy/trận.",
  ),
  char_15: passive(
    "Gâu Là Có Mặt",
    "Hộ vệ / cứu đồng đội",
    "allyLow",
    "guard",
    1,
    240,
    3,
    10,
    90,
    180,
    "Đồng minh khác trong {range} còn sống dưới 40% HP sau đòn địch: cấp {value} khiên trong {duration} giây; hồi {cooldown} giây, tối đa {maxUses} lần/trận. Không cứu đòn chết người.",
    "otherAlly",
  ),
  char_16: passive(
    "Tô Đậm Hiệu Ứng",
    "Kiểm soát / phối hợp hiệu ứng",
    "hit",
    "bonus",
    2,
    150,
    5,
    14,
    90,
    0,
    "Mỗi {every} đòn thường trúng địch đang chậm, đốt hoặc phóng xạ: đòn kế tiếp thêm {value}% ATK trong {duration} giây; hồi {cooldown} giây, tối đa {maxUses} lần/trận.",
    "debuffed",
  ),
  char_17: passive(
    "Giao Đòn Kết",
    "Sát thủ / kết liễu",
    "hit",
    "bonus",
    2,
    150,
    5,
    18,
    60,
    0,
    "Mỗi {every} đòn thường trúng địch còn dưới 40% HP: cường hóa đòn kế tiếp thêm {value}% ATK trong {duration} giây; hồi {cooldown} giây, tối đa {maxUses} lần/trận.",
    "targetLow",
  ),
  char_18: passive(
    "Nồi Lẩu Hai Ngăn",
    "Đấu sĩ / tiếp tế và đốt",
    "hit",
    "mealBurn",
    4,
    180,
    4,
    12,
    60,
    140,
    "Mỗi {every} đòn thường trúng: đốt mục tiêu {value}% ATK/giây trong {duration} giây và hồi 4 HP cho đồng minh yếu nhất trong {range}; hồi {cooldown} giây, tối đa {maxUses} lần/trận.",
  ),
  char_19: passive(
    "Lì Xì Chiến Thắng",
    "Hỗ trợ / thưởng hạ gục",
    "kill",
    "gift",
    1,
    180,
    3,
    12,
    90,
    180,
    "Hạ gục địch cấp đồng minh khác yếu nhất trong {range} {value} khiên trong {duration} giây và 4 năng lượng; hồi {cooldown} giây, tối đa {maxUses} lần/trận.",
    "otherAlly",
  ),
  char_20: passive(
    "Hoa Trao Đúng Người",
    "Hỗ trợ / cường hóa chủ lực",
    "pulse",
    "allyBonus",
    1,
    210,
    4,
    18,
    90,
    180,
    "Mỗi {cooldown} giây, đồng minh khác yếu nhất trong {range} nhận đòn thường kế tiếp thêm {value}% ATK trong {duration} giây; tối đa {maxUses} lần/trận. Không tự nhận.",
    "otherAlly",
  ),
  char_21: passive(
    "Cửa Hứng Đạn",
    "Hộ vệ / chống xạ thủ",
    "taken",
    "battery",
    3,
    150,
    5,
    5,
    0,
    0,
    "Sau {every} đòn thường từ địch đánh xa mà còn sống, nhận {value} năng lượng và cường hóa đòn kế tiếp 10% ATK trong 3 giây; hồi {cooldown} giây, tối đa {maxUses} lần/trận.",
    "rangedSource",
  ),
  char_22: passive(
    "Đồng Đội Có Aura",
    "Hỗ trợ / phát aura theo vị trí",
    "pulse",
    "aura",
    1,
    90,
    0,
    4,
    0,
    160,
    "Đồng minh khác trong {range} nhận +{value}% ATK và +{value}% tốc độ khi Aura còn sống. ATK làm tròn gần nhất, ít nhất +1. Rời tầm hoặc Aura bị hạ thì mất buff; nhiều Aura chỉ dùng mức cao nhất.",
  ),
  char_23: passive(
    "Vương Quyền Vươn Xa",
    "Đấu sĩ / kiểm soát tầm đánh",
    "hit",
    "reach",
    3,
    150,
    5,
    800,
    60,
    0,
    "Mỗi {every} đòn thường trúng tăng {value} đơn vị tầm vũ khí trong {duration} giây; hồi {cooldown} giây, tối đa {maxUses} lần/trận. Aura vũ khí có va chạm thật, không đánh toàn sân.",
  ),
  char_24: passive(
    "Vần Thơ Giữ Khoảng",
    "Xạ thủ / tích lực từ xa",
    "hit",
    "energy",
    4,
    150,
    5,
    4,
    0,
    140,
    "Mỗi {every} đòn thường trúng từ khoảng cách ít nhất {range} nhận {value} năng lượng; hồi {cooldown} giây, tối đa {maxUses} lần/trận.",
  ),
  char_25: passive(
    "Chia Vốn Cứu Nguy",
    "Hộ vệ / chuyển phòng thủ",
    "low",
    "shareShield",
    1,
    0,
    1,
    16,
    90,
    180,
    "Một lần/trận dưới 40% HP mà còn sống: đồng minh khác yếu nhất trong {range} nhận {value} khiên trong {duration} giây; nếu không có, tự nhận một nửa.",
  ),
  char_26: passive(
    "Phonk Phá Trói",
    "Sát thủ / tự giải chậm",
    "hit",
    "cleanseSpeed",
    3,
    150,
    4,
    8,
    60,
    0,
    "Mỗi {every} đòn thường trúng xóa chậm và tăng {value}% tốc độ trong {duration} giây; hồi {cooldown} giây, tối đa {maxUses} lần/trận. Không miễn khống chế.",
  ),
  char_27: passive(
    "Lõi Nóng Phản Công",
    "Đấu sĩ / chống vây cận chiến",
    "taken",
    "heatZone",
    4,
    210,
    3,
    20,
    60,
    85,
    "Sau {every} đòn thường nhận phải mà còn sống, để vùng lửa cố định bán kính {range} trong {duration} giây, gây {value}% ATK/giây; hồi {cooldown} giây, tối đa {maxUses} lần/trận.",
  ),
  char_28: passive(
    "Khởi Động Phế Liệu",
    "Hộ vệ / chống dồn đầu trận",
    "start",
    "openingShield",
    1,
    0,
    1,
    12,
    180,
    0,
    "Đầu trận nhận {value} khiên trong {duration} giây; nếu có Tai Mèo biến hình thì khiên tăng 50%. Chỉ một lần/trận.",
  ),
  char_29: passive(
    "Nét Vẽ Nạp Lại",
    "Xạ thủ / đổi nhịp kỹ năng",
    "skill",
    "reload",
    1,
    210,
    4,
    12,
    0,
    0,
    "Sau kỹ năng, rút ngắn thời gian chờ đòn thường {value} tick và nhận 3 năng lượng; tối đa {maxUses} lần/trận. Không bắn nhiều đòn trong một tick.",
  ),
  char_30: passive(
    "Bóng Nảy Lấy Hên",
    "Đấu sĩ / tận dụng nảy tường",
    "wall",
    "balloon",
    1,
    180,
    4,
    12,
    90,
    0,
    "Nảy tường nhận 4 khiên trong {duration} giây và cường hóa đòn thường kế tiếp thêm {value}% ATK; hồi {cooldown} giây, tối đa {maxUses} lần/trận.",
  ),
  char_31: passive(
    "Dư Chấn Phóng Xạ",
    "Xạ thủ / phóng xạ chống hồi phục",
    "hit",
    "radiation",
    1,
    0,
    0,
    6,
    60,
    0,
    "Đòn thường trúng gắn 1 tầng phóng xạ trong {duration} giây, tối đa 3 tầng từ mọi nguồn. Mỗi tầng gây {value}% ATK/giây và giảm 8% hồi máu (tối đa 24%). Khiên và giáp chặn sát thương; không tự lan, nguồn chết thì ngừng gây sát thương.",
  ),
  char_32: passive(
    "Giữ Đất Cái Bang",
    "Kiểm soát / chiếm vùng",
    "pulse",
    "zoneGuard",
    1,
    180,
    4,
    8,
    60,
    0,
    "Đứng trong vùng chiêu đã kích hoạt của chính mình nhận {value} khiên trong {duration} giây; hồi {cooldown} giây, tối đa {maxUses} lần/trận.",
    "ownZone",
  ),
  char_33: passive(
    "Chia Phần Ăn",
    "Hộ vệ / tự hồi và tiếp tế",
    "hit",
    "meal",
    4,
    180,
    5,
    1,
    0,
    160,
    "Mỗi {every} đòn thường trúng hồi {value}% HP tối đa của Jake cho bản thân và một đồng minh khác yếu nhất trong {range}; hồi {cooldown} giây, tối đa {maxUses} lần/trận. Không có đồng đội thì chỉ hồi cho bản thân.",
  ),
};

export function passiveDescription(id: string) {
  const p = CHARACTER_PASSIVES[id];
  return p.text.replace(
    /\{(every|value|range|maxUses|cooldown|duration)\}/g,
    (_, key: string) =>
      String(
        key === "cooldown" || key === "duration"
          ? p[key] / 30
          : key === "value" && p.effect === "reach"
            ? p.value / 100
            : p[key as "value"],
      ),
  );
}

export const LEGENDARY_KITS = {
  char_22: {
    skillRadius: 160,
    superRadius: 200,
    skillDuration: 90,
    superDuration: 120,
    skillAttack: 6,
    superAttack: 10,
    superHaste: 8,
    skillPower: 70,
    superPower: 140,
  },
  char_23: {
    skillReach: 1200,
    superReach: 1800,
    skillDuration: 90,
    superDuration: 120,
    skillPower: 110,
    superPower: 210,
  },
  char_31: {
    skillPower: 135,
    superPower: 200,
    splashPower: 45,
    splashRadius: 100,
    radiationPower: 6,
    radiationWound: 8,
    radiationDuration: 60,
    radiationMax: 3,
  },
  char_32: {
    skillRadius: 120,
    superRadius: 175,
    skillPower: 30,
    superPower: 40,
    skillDuration: 90,
    superDuration: 120,
    skillSlow: 12,
    superSlow: 18,
    windup: 15,
  },
  char_33: {
    skillPower: 100,
    superPower: 160,
    skillHeal: 3,
    superHeal: 6,
    superShield: 8,
    range: 180,
  },
} as const;

export const LEGENDARY_TEXT: Record<string, { skill: string; super: string }> =
  {
    char_22: {
      skill:
        "Mỗi 7 giây tạo aura đi theo trong 3 giây, bán kính 160: +6% ATK cho đồng minh bên trong, gồm bản thân; tạo khiên 80% ATK cho người yếu nhất trong 180 và đánh 70% ATK nếu địch trong tầm vũ khí. Nhiều aura dùng mức cao nhất.",
      super:
        "Aura đi theo trong 4 giây, bán kính 200: +10% ATK và +8% tốc độ đánh cho đồng minh bên trong; cấp khiên 60% ATK cho người yếu nhất trong 180 và đánh 140% ATK nếu địch trong tầm vũ khí. Aura biến mất khi chủ bị hạ.",
    },
    char_23: {
      skill:
        "Mỗi 7 giây mở rộng tầm vũ khí thêm 12 đơn vị trong 3 giây và chém 110% ATK nếu địch nằm trong tầm mở rộng. Hết buff trở lại tầm cũ.",
      super:
        "Mở rộng tầm vũ khí thêm 18 đơn vị trong 4 giây và chém 210% ATK. Vẫn cần địch trong tầm và có thể va chạm vũ khí; không xuyên khiên.",
    },
    char_31: {
      skill:
        "Mỗi 7 giây bắn đạn phóng xạ 135% ATK, tầm 260; chỉ khi đạn trúng mới gắn thêm 1 tầng. Có thể né hoặc chặn.",
      super:
        "Bắn đầu đạn 200% ATK, tầm 300. Khi trúng, nổ bán kính 100: địch khác chịu 45% ATK; các mục tiêu trúng nhận 2 tầng phóng xạ, tối đa 3 tầng. Không trúng thì không nổ.",
    },
    char_32: {
      skill:
        "Mỗi 7 giây đặt vùng cố định tại địch trong 260, báo trước 0,5 giây; bán kính 120, tồn tại 3 giây, gây 30% ATK mỗi giây và làm chậm 12%. Rời vùng sẽ tránh các nhịp sau.",
      super:
        "Đặt đại trận cố định trong tầm 300, báo trước 0,5 giây; bán kính 175, tồn tại 4 giây, gây 40% ATK mỗi giây và làm chậm 18%. Khiên, giải chậm và di chuyển ra khỏi vùng là counter.",
    },
    char_33: {
      skill:
        "Mỗi 7 giây ném đồ ăn 100% ATK vào địch trong 180 và hồi 3% HP tối đa của Jake cho đồng minh yếu nhất trong 180. Phần tấn công cần đạn trúng; không có địch vẫn có thể cứu người bị thương.",
      super:
        "Ném đại tiệc 160% ATK vào địch trong 180; hồi 6% HP tối đa của Jake cho đồng minh yếu nhất trong 180 và tự tạo khiên bằng 8% HP trong 3 giây. Không hồi sinh hay hồi vượt mức; phóng xạ giảm hồi phục.",
    },
  };

export const LEGENDARY_IDENTITIES: Record<
  string,
  { base: string; roleClass: string; weakness: string; weapon: string }
> = {
  char_22: {
    base: "guardian",
    roleClass: "Hỗ trợ",
    weakness:
      "Aura cần giữ khoảng cách với đồng đội; tách đội hình hoặc hạ nguồn aura để ngắt buff. Sát thương cá nhân thấp.",
    weapon:
      "Cánh Aura xoay phòng thân; phát aura hỗ trợ đồng minh trong tầm, không tự gây sát thương toàn sân.",
  },
  char_23: {
    base: "swordsman",
    roleClass: "Đấu sĩ",
    weakness:
      "Tầm vũ khí chỉ tăng trong thời gian ngắn; né nhịp aura, đợi buff hết và cấu rỉa từ ngoài tầm. Khiên và va chạm vũ khí vẫn có tác dụng.",
    weapon:
      "Kiếm vương quyền nối dài bằng aura khi tung chiêu; tầm hình ảnh, va chạm và sát thương luôn khớp nhau.",
  },
  char_31: {
    base: "ranger",
    roleClass: "Xạ thủ",
    weakness:
      "Mỏng, cần đạn trúng để tích phóng xạ. Chặn đạn, dùng khiên hoặc áp sát; rời vùng nổ để tránh lây tầng từ Super.",
    weapon:
      "Bút Chì Bạc bắn đầu đạn phóng xạ; đòn thường, kỹ năng và Super có đạn thật, có thể né và chặn.",
  },
  char_32: {
    base: "frost",
    roleClass: "Kiểm soát",
    weakness:
      "Đại trận đứng yên và báo trước 0,5 giây; di chuyển ra khỏi vùng, giải chậm hoặc dùng khiên. Mỗi Bang Chủ chỉ giữ được một vùng chiêu.",
    weapon:
      "Trúc Bổng Tổ Ong phóng sóng lá; chiêu đặt đại trận có vùng ảnh hưởng lớn để kiểm soát sân.",
  },
  char_33: {
    base: "guardian",
    roleClass: "Hộ vệ",
    weakness:
      "Di chuyển chậm; cần đồng minh trong 180 để tiếp tế. Phóng xạ giảm hồi máu, còn đạn đồ ăn có thể né và chặn.",
    weapon:
      "Nĩa Bếp HB đánh cận chiến; kỹ năng và Super ném đồ ăn gây sát thương, đồng thời chia phần hồi phục trong tầm.",
  },
};
