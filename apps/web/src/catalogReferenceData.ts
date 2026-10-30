import {
  STATUS_RULES,
  MAX_POISON_STACKS,
  type StatusKind,
} from "../../../packages/battle-engine/src/statuses";
import { TICK_RATE } from "../../../packages/battle-engine/src/types";
import {
  BONDS,
  FRIEND_GROUPS,
  ROSTER,
  TRAIT_TEXT,
  character,
  type CharacterId,
} from "../../../packages/shared/src/catalog";
import { MASTERIES } from "../../../packages/shared/src/mastery";
import { SYNERGY_RULE } from "../../../packages/shared/src/synergy";

export type ReferenceTab = "statuses" | "mechanics" | "masteries" | "synergies";
export interface ReferenceEntry {
  id: string;
  name: string;
  category: string;
  summary: string;
  facts: { label: string; text: string }[];
  related: CharacterId[];
  keywords?: string;
}
interface StatusGuide {
  alias: string;
  category: "Sát thương theo thời gian" | "Khống chế" | "Suy yếu" | "Có lợi";
  summary: string;
  stacking?: string;
  interaction: string;
  unit: string;
  related: CharacterId[];
}
// Exhaustive metadata: adding an engine status requires adding its guide here.
const guides: Record<StatusKind, StatusGuide> = {
  burn: {
    alias: "Thiêu đốt",
    category: "Sát thương theo thời gian",
    unit: "HP/s",
    summary: "Mất HP liên tục trong thời gian bị đốt, kể cả khi đứng yên.",
    interaction:
      "Bỏ qua giáp, khiên và Hộ thể. Sát thương mỗi giây còn bị giới hạn ở 3% HP gốc của nạn nhân. Một số Bí kỹ có thể giải Burn.",
    related: ["char_18", "char_27", "char_28", "char_31"],
  },
  poison: {
    alias: "Trúng độc",
    category: "Sát thương theo thời gian",
    unit: "HP/s mỗi tầng",
    summary: "Mỗi tầng độc gây mất HP liên tục và hết hạn riêng.",
    stacking: `Tối đa ${MAX_POISON_STACKS} tầng độc. Khi đủ tầng, lần áp tiếp theo xét thay tầng sắp hết hạn; hiệu lực yếu hơn tầng đó không thay được.`,
    interaction:
      "Bỏ qua giáp, khiên và Hộ thể. Mỗi tầng bị giới hạn thêm ở 1% HP gốc nạn nhân mỗi giây. Bí kỹ giải một trạng thái chỉ gỡ một tầng Poison.",
    related: ["char_19", "char_24"],
  },
  bleeding: {
    alias: "Chảy máu",
    category: "Sát thương theo thời gian",
    unit: "HP/s khi di chuyển",
    summary:
      "Chỉ gây mất HP khi nạn nhân thực sự di chuyển; đứng yên không nhận nhịp sát thương này.",
    interaction:
      "Bỏ qua giáp, khiên và Hộ thể. Giới hạn thêm ở 2% HP gốc nạn nhân mỗi giây. Đẩy lùi khiến nạn nhân di chuyển cũng có thể làm Bleeding gây sát thương.",
    related: ["char_08", "char_19", "char_24"],
  },
  radiation: {
    alias: "Nhiễm xạ",
    category: "Sát thương theo thời gian",
    unit: "tầng",
    summary:
      "Mỗi tầng gây 2 HP/s và giảm 8% hồi phục; tối đa 3 tầng tương ứng 6 HP/s và giảm 24% hồi phục.",
    stacking: `Cộng tầng trên cùng một trạng thái, tối đa ${STATUS_RULES.radiation.cap} tầng; áp lại làm mới thời hạn theo nguồn.`,
    interaction:
      "Sát thương bỏ qua giáp/khiên, giới hạn thêm ở 2% HP gốc nạn nhân mỗi giây. Giảm hồi phục kết hợp với Tiểu Đường trước khi áp giới hạn và luật hồi phục của round.",
    related: ["char_31"],
  },
  frozen: {
    alias: "Làm chậm di chuyển",
    category: "Khống chế",
    unit: "%",
    summary:
      "Giảm tốc độ di chuyển, không trực tiếp giảm nhịp đánh hoặc tốc độ xoay vũ khí.",
    interaction:
      "Một số nguồn giải Frozen hoặc cho miễn làm chậm tạm thời. Không phải trạng thái đóng băng bất động hoàn toàn.",
    related: ["char_06", "char_11", "char_16", "char_20", "char_32"],
  },
  paralyzed: {
    alias: "Tê liệt nhịp đánh",
    category: "Khống chế",
    unit: "%",
    summary:
      "Giảm nhịp đánh và tốc độ xoay; kéo dài thời gian chờ đòn đang có. Không trực tiếp giảm di chuyển.",
    interaction:
      "Ví dụ giảm nhịp 25% làm thời gian giữa hai đòn thành thời gian gốc ÷ 0,75. Hết trạng thái thì nhịp được trả lại, không làm chậm cộng dồn vĩnh viễn.",
    related: ["char_07", "char_09", "char_11"],
  },
  stunned: {
    alias: "Choáng",
    category: "Khống chế",
    unit: "",
    summary: "Ngắt khả năng đánh và kích hoạt Super trong một khoảng ngắn.",
    interaction:
      "Một lần Choáng bị giới hạn tối đa 0,6 giây. Sau khi bị áp, nạn nhân miễn nhận Choáng mới trong 2 giây tính từ lúc áp. Các Bí kỹ chỉ giải Frozen/Paralyzed không giải Choáng.",
    related: ["char_07"],
  },
  diabetes: {
    alias: "Tiểu Đường · giảm hồi phục",
    category: "Suy yếu",
    unit: "%",
    summary:
      "Giảm lượng HP nhận từ hồi phục, gồm hồi trực tiếp và hồi theo thời gian.",
    interaction:
      "Kết hợp với Phóng xạ; tỷ lệ hồi sau hai trạng thái có sàn 35% trước khi tính giảm hồi của chế độ và giai đoạn cuối round. Không trực tiếp giảm lượng khiên được cấp.",
    related: ["char_02", "char_13", "char_19", "char_24"],
  },
  myopia: {
    alias: "Cận Thị · giảm tầm bắn",
    category: "Suy yếu",
    unit: "%",
    summary:
      "Giảm tầm tìm mục tiêu để bắn của nhân vật đánh xa; không rút ngắn vũ khí cận chiến.",
    interaction:
      "Không xóa đạn đã bay và không thu ngắn vũ khí cận chiến. Đạn tự đuổi vẫn chịu thời hạn sống của đường đạn.",
    related: ["char_05", "char_19", "char_24"],
  },
  pressure: {
    alias: "Áp lực · giảm sát thương",
    category: "Suy yếu",
    unit: "%",
    summary: "Giảm sát thương đòn trực tiếp mà người mang trạng thái gây ra.",
    interaction:
      "Tính cùng Rage theo hai hệ số riêng. Ví dụ Rage 20% và Áp lực 20% tạo hệ số 1,2 × 0,8 = 0,96 trước các bước giảm sát thương khác.",
    related: ["char_09", "char_11", "char_19", "char_24"],
  },
  fracture: {
    alias: "Rạn giáp",
    category: "Suy yếu",
    unit: "điểm phần trăm giáp",
    summary:
      "Giảm giáp dùng khi tính sát thương trực tiếp; không làm giáp xuống dưới 0.",
    interaction:
      "Ví dụ 20% giáp gặp Rạn giáp 8 điểm thì còn 12% giáp. Không tăng sát thương DoT vốn đã bỏ qua giáp.",
    related: [],
  },
  blessing: {
    alias: "Hồi phục theo thời gian",
    category: "Có lợi",
    unit: "HP/s",
    summary:
      "Hồi HP liên tục cho người mang trạng thái, không hồi vượt HP tối đa và không hồi sinh.",
    interaction:
      "Chịu giảm hồi từ Tiểu Đường, Phóng xạ và luật hồi của round/chế độ. Lượng hồi trước giảm hồi giới hạn thêm ở 2% HP gốc nạn nhân mỗi giây.",
    related: ["char_06", "char_11", "char_13", "char_19", "char_20", "char_22"],
  },
  rage: {
    alias: "Cuồng nộ · tăng sát thương",
    category: "Có lợi",
    unit: "%",
    summary:
      "Tăng sát thương trực tiếp của người mang trạng thái trong thời hạn hiệu ứng.",
    interaction:
      "Không tăng HP, không tăng nhịp đánh và không trực tiếp tăng lượng hồi HP. Nhiều nguồn Rage lấy hiệu lực mạnh nhất.",
    related: [
      "char_06",
      "char_11",
      "char_13",
      "char_19",
      "char_20",
      "char_22",
      "char_25",
    ],
  },
  introvert: {
    alias: "Hướng Nội",
    category: "Có lợi",
    unit: "% giảm sát thương trực tiếp",
    summary:
      "Trạng thái riêng của Hổ: giảm sát thương trực tiếp nhận, hồi HP theo thời gian và đổi lại giảm 15% di chuyển.",
    interaction:
      "Chỉ Hổ tự áp cho mình. Bình thường hồi 0,8% HP gốc/giây; Nén Bão giảm còn 0,4%. Bình Tâm rút thời hạn còn 1,4 giây và giải một Frozen hoặc Paralyzed theo hồi riêng.",
    related: ["char_01"],
  },
  ward: {
    alias: "Hộ thể",
    category: "Có lợi",
    unit: "%",
    summary:
      "Giảm sát thương trực tiếp nhận sau bước tính giáp, trước khi khiên hấp thụ.",
    interaction:
      "Không giảm Burn, Poison, Bleeding hay Phóng xạ. Hộ thể 20% kết hợp giáp 20% tạo hệ số sát thương nhận 0,8 × 0,8 = 0,64.",
    related: [],
  },
};

export const STATUS_ENTRIES: ReferenceEntry[] = (
  Object.entries(STATUS_RULES) as [
    StatusKind,
    (typeof STATUS_RULES)[StatusKind],
  ][]
).map(([id, rule]) => {
  const guide = guides[id];
  const related = [
    ...new Set([
      ...guide.related,
    ]),
  ];
  return {
    id,
    name: rule.label,
    category: guide.category,
    summary: guide.summary,
    related,
    keywords: `${id} ${guide.alias}`,
    facts: [
      { label: "Tên gọi", text: guide.alias },
      {
        label: "Mặc định",
        text: `${id === "stunned" ? "Bật Choáng" : `${rule.power} ${guide.unit}`} · ${rule.duration / TICK_RATE} giây`,
      },
      {
        label: "Trần hiệu lực",
        text:
          id === "stunned" ? "0,6 giây mỗi lần" : `${rule.cap} ${guide.unit}`,
      },
      {
        label: "Cộng dồn",
        text:
          guide.stacking ||
          "Giữ một hiệu lực mạnh nhất. Nguồn bằng hoặc mạnh hơn có thể làm mới thời hạn; nguồn yếu hơn không kéo dài hiệu lực mạnh.",
      },
      { label: "Tương tác", text: guide.interaction },
    ],
  };
});

export const MECHANIC_ENTRIES: ReferenceEntry[] = [
  {
    id: "direct-damage",
    name: "Sát thương trực tiếp & giáp",
    category: "Sát thương",
    related: [],
    summary:
      "Đòn đánh và nhiều kỹ năng xử lý giảm sát thương trước, rồi trừ khiên, cuối cùng mới trừ HP.",
    facts: [
      {
        label: "Thứ tự",
        text: "Xét né/miễn đòn → hiệu chỉnh sát thương → giáp (sau Rạn giáp) và Hộ thể → khiên → HP thực.",
      },
      {
        label: "Phân biệt",
        text: "Giáp giảm theo tỷ lệ, tối đa 60%. Sát thương theo thời gian và các cơ chế tự mất HP có luật riêng.",
      },
    ],
  },
  {
    id: "dot",
    name: "DoT · sát thương theo thời gian",
    category: "Sát thương",
    related: ["char_08", "char_18", "char_27", "char_31"],
    summary:
      "Burn, Poison, Bleeding và Phóng xạ trừ HP theo thời gian; không tạo một đòn đánh thường mới.",
    facts: [
      {
        label: "Phòng thủ",
        text: "Bỏ qua giáp, khiên và Hộ thể. Né đòn trực tiếp không xóa DoT đã gắn; nguồn gây đã chết thì DoT vẫn có thể chạy đến hết hạn.",
      },
      {
        label: "Giới hạn",
        text: "Mỗi loại có trần sát thương theo HP gốc nạn nhân. Bleeding chỉ gây sát thương khi nạn nhân di chuyển; Poison có các tầng hết hạn riêng.",
      },
    ],
  },
  {
    id: "shield",
    name: "Khiên & máu ảo",
    category: "Phòng thủ",
    related: ["char_10", "char_11", "char_15", "char_21", "char_25"],
    summary:
      "Khiên hấp thụ đòn trực tiếp sau giảm sát thương; không tăng HP thật và không cản DoT.",
    facts: [
      {
        label: "Thời hạn",
        text: "Các lớp khiên có nguồn và thời hạn riêng, mất khi bị đánh hết hoặc hết hạn. Tổng khiên được cấp qua cơ chế khiên chung không vượt 100 HP.",
      },
      {
        label: "Máu ảo",
        text: "Lợi nhuận giao dịch của Công Tử tạo lớp khiên có thời hạn rất dài. Khiên đã tiêu không tự hoàn lại khi tài sản thay đổi.",
      },
      {
        label: "Hồi HP",
        text: "Giảm hồi phục không trực tiếp làm giảm khiên. Giai đoạn cuối round vẫn giảm lượng khiên mới được cấp.",
      },
    ],
  },
  {
    id: "healing",
    name: "Hồi HP & hồi dư",
    category: "Hồi phục",
    related: ["char_01", "char_13", "char_18", "char_20", "char_33"],
    summary:
      "Chỉ lượng HP thực sự được hồi mới tính vào đóng góp hồi phục. Không tự chuyển phần hồi dư thành khiên.",
    facts: [
      {
        label: "Giảm hồi",
        text: "Tiểu Đường, Phóng xạ, luật chế độ và giai đoạn cuối round có thể giảm lượng hồi. Nhân vật đã chết không nhận hồi phục.",
      },
      {
        label: "Ngoại lệ hồi dư",
        text: "Suất Dành Riêng của Mâm Quả có thể chuyển một phần hồi dư từ quả thường thành khiên, với trần và hồi riêng ghi trong Bí kỹ.",
      },
    ],
  },
  {
    id: "cleanse",
    name: "Giải trạng thái & miễn hiệu ứng",
    category: "Phòng thủ",
    related: ["char_01", "char_13", "char_19"],
    summary:
      "Giải trạng thái loại bỏ hiệu ứng đang có; miễn hiệu ứng ngăn lần áp mới trong thời hạn tương ứng.",
    facts: [
      {
        label: "Phạm vi",
        text: "Mỗi kỹ năng ghi rõ loại được giải. Khay Thanh Mát và Bình Tâm chỉ giải một Frozen hoặc Paralyzed; không giải Choáng hay toàn bộ DoT.",
      },
      {
        label: "Bí kỹ giải mới",
        text: "Ưu tiên Frozen → Paralyzed → Burn → Poison → Bleeding và chỉ giải một loại; nếu chọn Poison chỉ gỡ một tầng.",
      },
      {
        label: "Cộng hưởng Cứu viện",
        text: "Xóa cả Frozen và Paralyzed cho người được cứu viện, đi cùng khiên.",
      },
    ],
  },
  {
    id: "evasion",
    name: "Né đòn & va chạm vũ khí",
    category: "Phòng thủ",
    related: ["char_07", "char_17", "char_23"],
    summary:
      "Né có thể vô hiệu hóa đòn trực tiếp; va chạm vũ khí có thể chặn sát thương trong đúng nhịp va chạm.",
    facts: [
      {
        label: "Không xóa DoT",
        text: "Né không ngừng DoT đã gắn. Bỏ qua va chạm vũ khí của King Of RiseOn không đồng thời bỏ qua giáp hay khiên.",
      },
      {
        label: "Xoay vũ khí",
        text: "Va chạm và đòn trúng có thể đảo hướng xoay; vũ khí vẫn cần chạm mục tiêu để gây sát thương.",
      },
    ],
  },
  {
    id: "projectiles",
    name: "Hướng xoay, đạn & tầm bắn",
    category: "Nhịp chiến đấu",
    related: ["char_03", "char_05", "char_06", "char_29"],
    summary:
      "Nhân vật đánh xa chọn hướng bắn theo vũ khí xoay và chỉ bắn khi có mục tiêu hợp lệ cùng hồi đòn sẵn sàng.",
    facts: [
      {
        label: "Tốc độ",
        text: "Di chuyển, xoay vũ khí, tốc độ đạn và thời gian giữa các đòn là các thông số khác nhau. Frozen và Paralyzed ảnh hưởng các phần khác nhau.",
      },
      {
        label: "Xuyên / nảy",
        text: "Xuyên mục tiêu và nảy tường phụ thuộc từng kỹ năng; không phải mọi đạn đều xuyên hoặc được trúng lặp không giới hạn.",
      },
    ],
  },
  {
    id: "super",
    name: "Năng lượng & Super",
    category: "Nhịp chiến đấu",
    related: [],
    summary:
      "Thanh năng lượng đầy ở 100. Super tự kích hoạt khi đủ năng lượng, không còn Super đang chạy và không bị chặn kích hoạt.",
    facts: [
      {
        label: "Nạp thanh",
        text: "Sát thương gây ra/nhận vào, chỉ số nạp Super và một số kỹ năng/cộng hưởng có thể cấp năng lượng. Cộng năng lượng trực tiếp khác với tăng chỉ số nạp.",
      },
      {
        label: "Bí kỹ Super",
        text: "Hiệu ứng sau Super chỉ chạy khi Super đã được kích hoạt thành công; vẫn chịu hồi riêng của Bí kỹ.",
      },
    ],
  },
  {
    id: "displacement",
    name: "Đẩy lùi, kéo & lướt",
    category: "Di chuyển",
    related: ["char_04", "char_10", "char_17", "char_21", "char_26"],
    summary:
      "Các lực đẩy/kéo làm thay đổi chuyển động, có giới hạn và tương tác với tường đấu trường.",
    facts: [
      {
        label: "Phân biệt",
        text: "Lướt không tự cấp bất tử hoặc xuyên tường. Chỉ những kỹ năng ghi rõ né/miễn đòn mới cho phần bảo vệ đó.",
      },
      {
        label: "Kết hợp",
        text: "Di chuyển do lực đẩy có thể làm Bleeding gây sát thương. Giảm di chuyển không đồng nghĩa vô hiệu mọi lực đẩy.",
      },
    ],
  },
  {
    id: "constructs",
    name: "Đệ, trụ & vùng hiệu ứng",
    category: "Triệu hồi & vùng",
    related: [
      "char_05",
      "char_11",
      "char_14",
      "char_16",
      "char_20",
      "char_30",
      "char_32",
    ],
    summary:
      "Đệ/trụ là vật thể có HP và thời hạn; vùng hiệu ứng tác động lên nhân vật đi vào hoặc đứng trong vùng.",
    facts: [
      {
        label: "Đệ / trụ",
        text: "Có thể bị chọn làm mục tiêu và bị phá. Đệ của Hộp Quà tiếp tục hoạt động sau khi chủ chết đến hết thời hạn hoặc bị phá; không tính là nhân vật sống để kéo dài round.",
      },
      {
        label: "Vùng",
        text: "Số vùng, báo trước và nhịp tác dụng phụ thuộc kỹ năng. Các vùng cờ/hoa trùng nhau không nhân chồng cùng loại buff hay nhịp sát thương.",
      },
    ],
  },
  {
    id: "friendly-fire",
    name: "Sát thương đồng đội & tự mất HP",
    category: "Sát thương",
    related: ["char_09", "char_25", "char_28", "char_29", "char_30", "char_31"],
    summary:
      "Một số bộ kỹ năng có rủi ro gây sát thương cho chủ hoặc đồng đội; đây là đặc tính riêng của nguồn đó.",
    facts: [
      {
        label: "Theo nguồn",
        text: "Deadline, đạn Wacom, bóng bay và tên lửa có luật trúng đồng đội khác nhau. Dạng tiến hóa của một số nhân vật thay đổi hoặc bỏ rủi ro này.",
      },
      {
        label: "Bí kỹ phản công",
        text: "Hiệu ứng phản công mới cần mất HP do địch đánh trực tiếp; friendly fire và sát thương chỉ vào khiên không tính.",
      },
    ],
  },
  {
    id: "mastery-procs",
    name: "Biến thể đòn đánh & Bí kỹ",
    category: "Nhịp chiến đấu",
    related: [],
    summary:
      "Bí kỹ có thể thay đường đạn, hình đòn đánh, Super hoặc hành vi đệ; mở mốc sau tạo thêm lựa chọn để lắp.",
    facts: [
      {
        label: "Đạn phụ",
        text: "Mảnh tách chỉ sinh một thế hệ; các mảnh và viên quạt phụ không tự kích hoạt proc đòn thường. Đĩa hồi lưu giới hạn số mục tiêu mỗi chiều; đạn quỹ đạo cần chủ còn sống khi còn xoay quanh người.",
      },
      {
        label: "Giới hạn",
        text: "Đổi độ phủ, nhịp đánh, khả năng xuyên, rủi ro hụt hoặc thay hoàn toàn Super. Phản công có hồi riêng 6 giây và làm nhịp đòn thường dài hơn 25%.",
      },
      {
        label: "Trang bị",
        text: "Mỗi nhân vật lắp một Bí kỹ, mỗi đội tối đa một Truyền thừa. Xem tab Bí kỹ để tra từng hiệu ứng và giới hạn.",
      },
    ],
  },
];

const masteryEntries: ReferenceEntry[] = MASTERIES.map((m) => ({
  id: m.id,
  name: m.name,
  category: character(m.characterId)!.name,
  summary: m.role,
  related: [m.characterId as CharacterId],
  facts: [
    { label: "Hiệu ứng", text: m.description },
    { label: "Giới hạn", text: m.tradeoff },
    {
      label: "Mở khóa",
      text: `Mốc ${m.goal} trận đạt điều kiện trong Hành trình nhân vật. Chỉ có tác dụng khi được lắp.`,
    },
    ...(m.legacy
      ? [
          {
            label: "Truyền thừa",
            text: "Mỗi đội chỉ lắp tối đa một Bí kỹ Truyền thừa.",
          },
        ]
      : []),
  ],
}));
const synergyEntries: ReferenceEntry[] = [
  ...BONDS.map((b) => ({
    id: b.id,
    name: b.name,
    category: "Liên kết",
    summary: b.description,
    facts: [{ label: "Cộng hưởng", text: SYNERGY_RULE }],
    related: b.members as CharacterId[],
  })),
  ...FRIEND_GROUPS.map((g) => ({
    id: g.id,
    name: g.name,
    category: "Hội",
    summary: g.two,
    facts: [
      { label: "Mốc 3", text: g.three },
      { label: "Giới hạn", text: g.limit },
      ...(g.required?.length
        ? [
            {
              label: "Thành viên bắt buộc",
              text: g.required
                .map((id) => character(id)?.name || id)
                .join(", "),
            },
          ]
        : []),
      ...(g.requiredAny?.length
        ? [
            {
              label: "Cần ít nhất một",
              text: g.requiredAny
                .map((id) => character(id)?.name || id)
                .join(", "),
            },
          ]
        : []),
      ...(g.threeRequiresGroups?.length
        ? [
            {
              label: "Điều kiện mốc 3",
              text: `Cần có thành viên từ mỗi hội: ${g.threeRequiresGroups.map((id) => FRIEND_GROUPS.find((other) => other.id === id)?.name || id).join(", ")}.`,
            },
          ]
        : []),
    ],
    related: g.members as CharacterId[],
  })),
  ...Object.entries(TRAIT_TEXT).map(([name, text]) => ({
    id: `trait:${name}`,
    name,
    category: "Tộc / vai trò",
    summary: text,
    facts: [
      {
        label: "Thành viên",
        text: "Mốc tính theo các nhân vật phù hợp trong đội đại diện đang chọn.",
      },
    ],
    related: ROSTER.filter((c) => c.roleClass === name || c.race === name).map(
      (c) => c.id as CharacterId,
    ),
  })),
];
export const REFERENCE_ENTRIES: Record<ReferenceTab, ReferenceEntry[]> = {
  statuses: STATUS_ENTRIES,
  mechanics: MECHANIC_ENTRIES,
  masteries: masteryEntries,
  synergies: synergyEntries,
};
export const referenceFilters = (tab: ReferenceTab) => [
  ...new Set(REFERENCE_ENTRIES[tab].map((e) => e.category)),
];
export const catalogSearchText = (value: string) =>
  value
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
export function searchReference(
  tab: ReferenceTab,
  search: string,
  filter: string,
) {
  const query = catalogSearchText(search);
  const entries = REFERENCE_ENTRIES[tab].filter(
    (e) =>
      (filter === "Tất cả" || e.category === filter) &&
      catalogSearchText(
        [
          e.name,
          e.category,
          e.summary,
          e.keywords,
          ...e.facts.map((f) => f.text),
          ...e.related.map((id) => character(id)?.name),
        ].join(" "),
      ).includes(query),
  );
  if (!query) return entries;
  const rank = (entry: ReferenceEntry) => {
    const name = catalogSearchText(entry.name);
    if (name === query) return 0;
    if (name.includes(query)) return 1;
    if (catalogSearchText(entry.keywords || "").includes(query)) return 2;
    return 3;
  };
  return entries.sort((a, b) => rank(a) - rank(b));
}
