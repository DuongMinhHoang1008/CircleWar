import type { Loadout } from "./balance";

export type GrowthStat =
  | "damage"
  | "speed"
  | "spin"
  | "chance"
  | "bounces"
  | "knockback"
  | "range"
  | "haste"
  | "duration"
  | "summonHp"
  | "summonDamage"
  | "shieldSize"
  | "shieldCount"
  | "projectileSpeed"
  | "buffPower"
  | "auraRange"
  | "reach"
  | "volatility"
  | "tradeHaste"
  | "friendlySafety"
  | "selfRisk"
  | "riskReduction"
  | "heal"
  | "blastRadius"
  | "dot";
export interface CharacterKit {
  id: string;
  name: string;
  ranged: boolean;
  normal: string;
  super: string;
  growth: readonly [GrowthStat, GrowthStat];
  chance: number;
}
const kit = (
  id: string,
  name: string,
  ranged: boolean,
  normal: string,
  ultimate: string,
  growth: CharacterKit["growth"],
  chance = 20,
): CharacterKit => ({
  id,
  name,
  ranged,
  normal,
  super: ultimate,
  growth,
  chance,
});

/** Identity and attack geometry are independent of the immutable class/race catalog. */
export const CHARACTER_KITS: Record<string, CharacterKit> = {
  char_01: kit(
    "char_01",
    "Hổ Hướng Nội",
    false,
    "Đòn thường có 20% vào Hướng Nội trong 2 giây: giảm 25% sát thương nhận, hồi 1% HP/giây, đổi lại giảm 15% di chuyển. Chỉ Hổ tự nhận hiệu ứng này.",
    "Vồ về phía địch; đòn chạm đầu tiên gây 180% Damage và chắc chắn Hướng Nội. Không dịch chuyển tức thời.",
    ["chance", "damage"],
  ),
  char_02: kit(
    "char_02",
    "Bé Ôm Bão",
    false,
    "Đòn thường có 20% gây Tiểu Đường trong 3 giây, giảm 35% hồi phục.",
    "Tăng 100% tốc độ xoay trong 3 giây; mọi đòn thường trúng trong thời gian này chắc chắn gây Tiểu Đường.",
    ["chance", "damage"],
  ),
  char_03: kit(
    "char_03",
    "Anh Tím Mọng",
    true,
    "Ném quả theo hướng vũ khí; quả có một lần nảy tường, tối đa 5 lần theo tăng trưởng. Sau nảy có thể trúng lại nhưng mỗi mục tiêu có hồi trúng 0,4 giây.",
    "Ném rổ quả lớn: đạn nảy, nổ bán kính 90 khi trúng, gây 160% Damage cho mục tiêu chính và 60% cho địch xung quanh.",
    ["bounces", "damage"],
  ),
  char_04: kit(
    "char_04",
    "Đùi Gió Lốc",
    false,
    "Đòn cận chiến có lực đẩy cao, tăng theo thời gian. Impulse giảm dần, bị giới hạn và chặn bởi tường.",
    "Xoay nhanh trong 3 giây, tăng lực đẩy lên trần; vẫn có hồi đòn và nhận sát thương bình thường.",
    ["knockback", "damage"],
  ),
  char_05: kit(
    "char_05",
    "Kính Cận Bắt Bài",
    true,
    "Bắn đạn có 20% gây Cận Thị trong 3 giây, giảm 30% tầm bắn. Không đổi tầm vũ khí cận chiến.",
    "Đặt một trụ súng có HP, tồn tại 8 giây, bắn địch gần nhất trong 220. Tối đa một trụ mỗi chủ; trụ có thể bị phá.",
    ["chance", "damage"],
  ),
  char_06: kit(
    "char_06",
    "Đội Trưởng Sắc Màu",
    true,
    "Bắn dải màu xuyên tối đa ba nhân vật: đồng đội nhận Rage nhẹ, địch nhận Frozen và sát thương. Dải dài dần và tạo nhanh dần.",
    "Bắn tia cầu vồng rộng trong tầm 320; đồng đội trên tia nhận Rage/Blessing, kẻ địch chịu 180% Damage.",
    ["range", "haste"],
  ),
  char_07: kit(
    "char_07",
    "Courage Nhút Nhát",
    false,
    "Khi nhận đòn trực tiếp có 18% né và chạy ngược nguồn đánh trong 1,5 giây; né thành công có hồi 1,5 giây, không né DoT đã gắn.",
    "Hét trong bán kính 150: Choáng 0,5 giây và Paralyzed 25% trong 2 giây. Choáng có cửa sổ chống nối liên tục.",
    ["chance", "speed"],
    18,
  ),
  char_08: kit(
    "char_08",
    "Sói Suy Tư",
    false,
    "Đòn thường có 20% gây Bleeding trong 3 giây; nạn nhân mất HP khi thực sự di chuyển, không cộng tầng.",
    "Trăng máu trong 4 giây: +30% Damage, +20% di chuyển và xoay; đổi lại nhận thêm 20% sát thương trực tiếp.",
    ["chance", "damage"],
  ),
  char_09: kit(
    "char_09",
    "Sếp Chốt Đơn",
    true,
    "Ném deadline, 20% gây Paralyzed 25% trong 2 giây.",
    "Rải năm vùng deadline tồn tại 4 giây. Tất cả người khác, kể cả đồng đội, chạm vùng sẽ chịu sát thương, Paralyzed và Áp lực giảm 20% Damage. Không dùng Hướng Nội của Hổ.",
    ["chance", "haste"],
  ),
  char_10: kit(
    "char_10",
    "Lốp Lăn Ăn Vặt",
    false,
    "Đòn thường có 25% tạo khiên mỏng 4% HP, tồn tại 2 giây; có hồi kích hoạt 1 giây.",
    "Lăn lao nhanh trong 2,5 giây và đẩy người chạm phải; vẫn nhận đầy đủ sát thương, không có bất tử.",
    ["shieldCount", "damage"],
    25,
  ),
  char_11: kit(
    "char_11",
    "Cờ Con Cổ Vũ",
    false,
    "Đánh cận chiến và tự đặt cờ mỗi 4 giây: vùng cờ buff Rage/hồi HP cho đồng đội, Frozen cho địch. Tối đa ba cờ, không nhân chồng cùng loại.",
    "Cổ vũ tất cả đồng đội trong 3 giây; địch trong 180 nhận Áp lực và Paralyzed.",
    ["haste", "duration"],
  ),
  char_12: kit(
    "char_12",
    "Kiếm Khách Mượn Vai",
    false,
    "Cận chiến, xoay cơ sở nhanh hơn 35%. Tốc độ xoay và Damage tăng theo thời gian.",
    "Trong 2,5 giây xoay rất nhanh và lao về phía địch; không tự miễn sát thương hay vượt tường.",
    ["spin", "damage"],
  ),
  char_13: kit(
    "char_13",
    "Mâm Quả Chủ Tịch",
    true,
    "Ném hoa quả: trúng đồng đội cấp Blessing/Rage nhẹ; trúng địch gây Damage và Tiểu Đường. Tốc độ ném và bay tăng dần.",
    "Rải tám quả quanh sân gần bản thân, tạo vùng tiếp tế ngắn hạn buff đồng đội và debuff địch.",
    ["haste", "projectileSpeed"],
  ),
  char_14: kit(
    "char_14",
    "Hộp Quà Nghiêm Túc",
    false,
    "Đánh cận chiến; tự gọi một đệ nhỏ mỗi 4 giây dù không tấn công. Tối đa hai đệ nhỏ, có HP và bị phá được.",
    "Gọi một đệ khổng lồ tồn tại 10 giây, có HP và Damage riêng. Đệ tiếp tục hoạt động sau khi chủ chết đến hết lifetime hoặc bị phá; không tính là nhân vật sống để kéo dài round.",
    ["summonHp", "summonDamage"],
  ),
  char_15: kit(
    "char_15",
    "Hiệp Sĩ Gâu Gâu",
    false,
    "Cầm kiếm và khiên ở hai phía. Khiên có hitbox chặn đạn trực diện, kích thước tăng dần; cú đánh của khiên chỉ gây 40% Damage.",
    "Ném tám mảnh xương/kiếm/khiên ra xung quanh, gây sát thương và đẩy lùi; vẫn có thể né hoặc chặn.",
    ["shieldSize", "damage"],
  ),
  char_16: kit(
    "char_16",
    "Họa Sĩ Chạy Deadline",
    true,
    "Bắn mực có 20% gây Frozen 25% trong 2 giây.",
    "Đặt vũng mực lớn bán kính 160, báo trước 0,5 giây, tồn tại 4 giây; gây Damage mỗi giây và Frozen.",
    ["chance", "haste"],
  ),
  char_17: kit(
    "char_17",
    "Anh Tết Ship Nhanh",
    false,
    "Cận chiến nhanh, tốc độ di chuyển và xoay tăng theo thời gian.",
    "Giao hàng siêu tốc trong 2 giây: tăng tốc mạnh và né tất cả đòn trực tiếp. DoT đã gắn vẫn chạy; không xuyên tường.",
    ["speed", "spin"],
  ),
  char_18: kit(
    "char_18",
    "Ông Hoàng Nồi Lẩu",
    false,
    "Thân lớn hơn thường, đòn cận chiến có 25% gây Burn trong 3 giây.",
    "Vùng lẩu nóng đi theo chủ trong 4 giây: địch chịu Damage/Burn mỗi giây; chủ hồi nhẹ, đồng đội không nhận phần hồi này.",
    ["chance", "damage"],
    25,
  ),
  char_19: kit(
    "char_19",
    "Cô Nàng Khui Tết",
    false,
    "Chạm đồng đội trao Rage/Blessing; chạm địch gây debuff ngẫu nhiên. Mỗi cặp có hồi trao lì xì 1 giây.",
    "Ném tám lì xì hiệu ứng: đồng đội nhận buff, địch nhận Damage và debuff. Không áp Hướng Nội lên nhân vật khác.",
    ["speed", "spin"],
  ),
  char_20: kit(
    "char_20",
    "Hoàng Tử Ngậm Hoa",
    true,
    "Hoa hồng dừng khi chạm tường hoặc nhân vật và cắm xuống đất, tạo vùng nhỏ Rage/hồi HP cho đồng đội, Frozen cho địch. Tối đa bốn hoa.",
    "Tạo vườn sáu hoa quanh mục tiêu; các vùng trùng không nhân chồng buff hoặc tick Damage.",
    ["haste", "duration"],
  ),
  char_21: kit(
    "char_21",
    "Độ Duy Môn",
    true,
    "Bắn pháo không khí theo hướng vũ khí, lực đẩy cao và tăng dần cùng Damage.",
    "Bắn tám hướng và tự tạo khiên 12% HP tối đa; pháo có lực đẩy mạnh.",
    ["knockback", "damage"],
  ),
  char_22: kit(
    "char_22",
    "Đẳng Cấp Aura",
    false,
    "Cận chiến và phát aura cho đồng đội khác trong 160; buff Damage cơ sở 12%, hiệu lực và bán kính tăng dần. Nhiều aura cùng loại lấy mạnh nhất.",
    "Aura tuôn trào: tất cả đồng đội nhận Rage mạnh, tăng nhịp và Blessing trong 3 giây. Không hồi sinh.",
    ["buffPower", "auraRange"],
  ),
  char_23: kit(
    "char_23",
    "King Of RiseOn",
    false,
    "Kiếm xoay có 15% lướt qua va chạm vũ khí; không đồng nghĩa bỏ qua giáp/khiên. Tầm kiếm và Damage tăng dần.",
    "Kiếm khổng lồ trong 4 giây, chắc chắn bỏ qua va chạm vũ khí; vẫn nhận sát thương từ đòn đánh vào thân.",
    ["reach", "damage"],
    15,
  ),
  char_24: kit(
    "char_24",
    "Thi Thánh Họ Mai",
    true,
    "Bắn nét mực có 10% gắn một debuff ngẫu nhiên hợp lệ. Tỉ lệ và tốc độ bắn tăng dần.",
    "Bắn mười hai nét mực tỏa quanh người; mỗi nét có tỉ lệ gắn debuff. Không dùng Hướng Nội và không khóa liên tục.",
    ["chance", "haste"],
    10,
  ),
  char_25: kit(
    "char_25",
    "Công Tử Phú Thọ",
    false,
    "Cận chiến, giao dịch định kỳ: lợi nhuận thêm máu ảo theo tài sản, thua lỗ trừ trực tiếp HP thật. Không tự hoàn lại khiên đã bị đánh mất.",
    "Trong 4 giây có bốn nhịp giao dịch chắc chắn sinh lời và nhận Rage; máu ảo vẫn có trần.",
    ["volatility", "tradeHaste"],
  ),
  char_26: kit(
    "char_26",
    "Anh Fam De Phonk",
    false,
    "Cận chiến, nhẹ nhàng bẻ hướng về địch gần nhất, đòn trúng tạo luồng gió đẩy lùi.",
    "Đặt lốc lớn trong 4 giây: kéo địch về tâm và gây sát thương mỗi giây; lực hút có trần.",
    ["speed", "damage"],
  ),
  char_27: kit(
    "char_27",
    "Robot Da Đỏ",
    false,
    "Mỗi đòn trúng đều gây Burn nhẹ; 20% thiêu đốt mạnh hơn. Tăng trưởng nâng tỉ lệ đốt mạnh, không cộng tầng Burn.",
    "Cháy bỏng 4 giây: tăng Damage, di chuyển và nhịp đánh, đồng thời tự chịu Burn.",
    ["chance", "damage"],
  ),
  char_28: kit(
    "char_28",
    "Người Máy Sịp Đỏ Phế Thải",
    false,
    "Đánh cận chiến, có 15% tự mất HP bằng 20% Damage cơ sở. Tỉ lệ tự đánh giảm dần, không kích hoạt chuỗi proc.",
    "Bắn laser đỏ thẳng trong 300, gây 200% Damage; tự chịu Burn trong 3 giây.",
    ["riskReduction", "damage"],
    15,
  ),
  char_29: kit(
    "char_29",
    "Wacom Hỏng Hóc",
    true,
    "Đạn thường chỉ gây 55% Damage, đồng đội trên đường đạn vẫn chịu 35% sát thương đạn. Sát thương đồng đội giảm dần theo tăng trưởng.",
    "Bắn chuỗi tám phát, mỗi phát có 12% bật ngược về bản thân; không bắn xuyên mọi mục tiêu.",
    ["friendlySafety", "damage"],
  ),
  char_30: kit(
    "char_30",
    "Chó Bóng Bay",
    true,
    "Thả bóng bay nổ sau 3 giây hoặc khi nhân vật chạm vào sau lúc lên ngòi. Vụ nổ gây sát thương cả chủ và đồng đội, tăng rủi ro theo thời gian.",
    "Thả tám bóng lớn; vụ nổ vẫn gây sát thương chủ/đồng đội. Mỗi chủ có giới hạn số bóng đang hoạt động.",
    ["selfRisk", "damage"],
  ),
  char_31: kit(
    "char_31",
    "Ủn Đại Ca",
    true,
    "Bắn tên lửa mini, 20% gây Phóng xạ; tối đa 3 tầng, gây DoT và giảm hồi phục tối đa 24%.",
    "Tên lửa khổng lồ nổ toàn bản đồ: trong 130 gây 220% Damage, ngoài tâm gây 80%; mọi người trúng Phóng xạ/Burn. Chủ và đồng đội nhận 50% Damage tương ứng.",
    ["chance", "damage"],
  ),
  char_32: kit(
    "char_32",
    "Bang Chủ Cái Bang",
    true,
    "Dép tổ ong chạm tường hoặc địch để lại vùng Frozen và Damage mỗi giây; tối đa ba vùng thường.",
    "Đặt đại trận bán kính 175, báo trước 0,5 giây, tồn tại 4 giây; Frozen và Damage mỗi giây. Mỗi chủ giữ một đại trận.",
    ["dot", "blastRadius"],
  ),
  char_33: kit(
    "char_33",
    "Sóc Jake",
    false,
    "Cầm dĩa và đùi gà, phía đùi gà gây 50% Damage; đòn trúng có 25% ném gà boomerang, khi quay lại hồi HP cho chủ. Hồi ném 2 giây.",
    "Ném đùi gà khổng lồ xuyên mục tiêu: đồng đội chạm hồi ít HP, địch nhận Damage; quay lại hồi HP chủ.",
    ["heal", "damage"],
    25,
  ),
  fu_di: kit(
    "fu_di",
    "Người Máy Đỉnh Cao Fu Di",
    false,
    "Đánh cận chiến, có 20% bắn thêm laser thẳng; không còn tự đánh. Tỉ lệ laser và Damage tăng dần.",
    "Bắn laser khổng lồ xuyên địch trong tầm 340, gây 210% Damage; không tự Burn.",
    ["chance", "damage"],
  ),
  wacom: kit(
    "wacom",
    "Siêu Chiến Binh Wacom",
    true,
    "Đạn bay nhanh, gây 60% Damage, một lần nảy tường và tăng dần tối đa 5; hồi bắn dài hơn 30%, không gây sát thương đồng đội.",
    "Bắn liên tục tám phát cách nhau 0,3 giây, mỗi phát 28% Damage; tạm dừng bắn thường trong chuỗi. Đạn nảy, không có phản đạn vào chủ.",
    ["haste", "bounces"],
  ),
  skyrocket: kit(
    "skyrocket",
    "Skyrocket Dog",
    true,
    "Thả bóng bay 60% Damage, vùng nổ cơ sở 45 tăng dần; không gây sát thương chủ hoặc đồng đội.",
    "Ba bóng tên lửa lớn 70% Damage mỗi quả, bán kính cơ sở 75, tự hướng về địch; nổ khi chạm hoặc hết hạn. Không gây sát thương đồng đội/chủ.",
    ["damage", "blastRadius"],
  ),
};

export const GROWTH_LABELS: Record<GrowthStat, string> = {
  damage: "Damage",
  speed: "di chuyển",
  spin: "tốc độ xoay",
  chance: "tỉ lệ hiệu ứng",
  bounces: "số lần nảy",
  knockback: "lực đẩy",
  range: "độ dài dải màu",
  haste: "tốc độ đánh/tạo vùng",
  duration: "thời gian tồn tại vùng",
  summonHp: "HP đệ",
  summonDamage: "Damage đệ",
  shieldSize: "độ lớn khiên",
  shieldCount: "số khiên tạo",
  projectileSpeed: "tốc độ bay",
  buffPower: "hiệu lực buff",
  auraRange: "vùng aura",
  reach: "kích thước vũ khí",
  volatility: "biên độ cổ phiếu",
  tradeHaste: "tốc độ giao dịch",
  friendlySafety: "giảm Damage đồng đội",
  selfRisk: "sát thương chủ/đồng đội",
  riskReduction: "giảm tỉ lệ tự đánh",
  heal: "lượng hồi HP",
  blastRadius: "vùng ảnh hưởng",
  dot: "Damage theo tick",
};
export function characterKit(id?: string, equipment: readonly string[] = []) {
  if (id === "char_28" && equipment.includes("item_28"))
    return CHARACTER_KITS.fu_di;
  if (id === "char_29" && equipment.includes("item_29"))
    return CHARACTER_KITS.wacom;
  if (id === "char_30" && equipment.includes("item_30"))
    return CHARACTER_KITS.skyrocket;
  return id ? CHARACTER_KITS[id] : undefined;
}
export function kitGrowthDescription(spec: CharacterKit) {
  const detail = (stat: GrowthStat) =>
    stat === "chance"
      ? `${GROWTH_LABELS[stat]} +2 điểm %`
      : stat === "shieldCount"
        ? "thêm 1 lớp khiên mỗi 4 tầng, tối đa 4 lớp"
        : stat === "bounces"
          ? "thêm 1 lần nảy mỗi 3 tầng, tối đa 5"
          : stat === "riskReduction" || stat === "friendlySafety"
            ? `${GROWTH_LABELS[stat]}: hệ số rủi ro giảm 6% gốc`
            : `${GROWTH_LABELS[stat]} +${["damage", "summonDamage", "knockback"].includes(stat) ? 8 : ["speed", "buffPower", "auraRange", "heal"].includes(stat) ? 4 : ["reach", "blastRadius"].includes(stat) ? 3 : 5}% gốc`;
  return `Mỗi 10 giây sống sót: ${detail(spec.growth[0])}; ${detail(spec.growth[1])}. Tối đa 12 tầng. Tính từ baseline, đặt lại khi tạo trận mới.`;
}
export const KIT_GROWTH_LIMIT = 12;
const DEFAULT_GROWTH = Object.fromEntries(
  Object.keys(GROWTH_LABELS).map((key) => [
    key,
    key === "chance" || key === "bounces" ? 0 : key === "shieldCount" ? 1 : 100,
  ]),
) as Record<GrowthStat, number>;
const GROWTH_TABLES = new Map<
  CharacterKit,
  readonly Record<GrowthStat, number>[]
>();
for (const spec of Object.values(CHARACTER_KITS)) {
  GROWTH_TABLES.set(
    spec,
    Array.from({ length: KIT_GROWTH_LIMIT + 1 }, (_, stacks) => {
      const values = Object.fromEntries(
        Object.keys(GROWTH_LABELS).map((key) => [key, 100]),
      ) as Record<GrowthStat, number>;
      values.chance = spec.chance;
      values.bounces = 1;
      values.shieldCount = 1;
      for (const stat of spec.growth) {
        if (stat === "chance")
          values.chance = Math.min(60, spec.chance + stacks * 2);
        else if (stat === "shieldCount")
          values.shieldCount = 1 + Math.floor(stacks / 4);
        else if (stat === "bounces")
          values.bounces = Math.min(5, 1 + Math.floor(stacks / 3));
        else if (stat === "riskReduction" || stat === "friendlySafety")
          values[stat] = Math.max(20, 100 - stacks * 6);
        else
          values[stat] =
            100 +
            stacks *
              (["damage", "summonDamage", "knockback"].includes(stat)
                ? 8
                : stat === "speed" ||
                    stat === "buffPower" ||
                    stat === "auraRange" ||
                    stat === "heal"
                  ? 4
                  : stat === "reach" || stat === "blastRadius"
                    ? 3
                    : 5);
      }
      return values;
    }),
  );
}
export function kitGrowth(
  f: Pick<Loadout, "characterId" | "equipment">,
  tick: number,
) {
  const spec = characterKit(f.characterId, f.equipment);
  return spec
    ? GROWTH_TABLES.get(spec)![
        Math.max(0, Math.min(KIT_GROWTH_LIMIT, Math.floor(tick / 300)))
      ]
    : DEFAULT_GROWTH;
}
