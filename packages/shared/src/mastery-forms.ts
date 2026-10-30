/** Geometry and behaviour changes, not extra status procs. All numbers are
 * fixed-point combat budgets; descriptions and runtime share the same recipe. */
export type ShotPattern =
  | "fan"
  | "split"
  | "return"
  | "seeker"
  | "ricochet"
  | "pierce"
  | "wave"
  | "mine"
  | "chain"
  | "orbit"
  | "harpoon";
export type MeleePattern =
  | "sweep"
  | "whirl"
  | "thrust"
  | "cross"
  | "echo"
  | "charge"
  | "throw"
  | "wave"
  | "fan"
  | "orbit"
  | "harpoon";
export type SummonVariant =
  | "bulwark"
  | "medic"
  | "bodyguard"
  | "drone"
  | "fanTurret"
  | "mortar"
  | "hunter"
  | "ram"
  | "brazier"
  | "supply"
  | "bank";
export type MasteryForm =
  | {
      kind: "shot";
      pattern: ShotPattern;
      power: number;
      cooldown: number;
      count?: number;
    }
  | {
      kind: "melee";
      pattern: MeleePattern;
      power: number;
      cooldown: number;
      reach: number;
    }
  | {
      kind: "counter";
      pattern: "mine" | "fan";
      power: number;
      cooldown: number;
    }
  | {
      kind: "super";
      pattern:
        | "orbit"
        | "mines"
        | "ricochet"
        | "chain"
        | "split"
        | "boomerangs"
        | "beams"
        | "crossBeams"
        | "paint"
        | "vortex"
        | "slipper"
        | "summon";
      power: number;
      count: number;
      variant?: SummonVariant;
    };

export interface FormPath {
  name: string;
  role: string;
  description: string;
  tradeoff: string;
  form: MasteryForm;
}
const shot = (
  name: string,
  pattern: ShotPattern,
  power: number,
  cooldown: number,
  description: string,
  tradeoff: string,
  count?: number,
): FormPath => ({
  name,
  role: "Đổi đường đạn",
  description,
  tradeoff,
  form: { kind: "shot", pattern, power, cooldown, count },
});
const melee = (
  name: string,
  pattern: MeleePattern,
  power: number,
  cooldown: number,
  reach: number,
  description: string,
  tradeoff: string,
): FormPath => ({
  name,
  role: "Đổi cách đánh thường",
  description,
  tradeoff,
  form: { kind: "melee", pattern, power, cooldown, reach },
});
const ult = (
  name: string,
  pattern: Extract<MasteryForm, { kind: "super" }>["pattern"],
  power: number,
  count: number,
  description: string,
  tradeoff: string,
  variant?: SummonVariant,
): FormPath => ({
  name,
  role: variant ? "Super · đệ biến thể" : "Thay Super",
  description,
  tradeoff,
  form: { kind: "super", pattern, power, count, variant },
});
const counter = (
  name: string,
  pattern: "mine" | "fan",
  power: number,
  description: string,
  tradeoff: string,
): FormPath => ({
  name,
  role: "Đòn phản công hữu hình",
  description,
  tradeoff,
  form: { kind: "counter", pattern, power, cooldown: 180 },
});

export const FORM_PATHS: Record<
  string,
  readonly [FormPath, FormPath, FormPath]
> = {
  char_02: [
    melee(
      "Vòng Ôm Xoắn",
      "whirl",
      85,
      150,
      82,
      "Thay đòn chạm vũ khí bằng một vòng quét quanh người trong bán kính 82, tối đa ba địch, mỗi địch nhận 85% ATK một lần mỗi nhịp.",
      "Nhịp đánh dài hơn 50%; chỉ địch sát người mới trúng.",
    ),
    melee(
      "Kéo Về Đây",
      "harpoon",
      75,
      145,
      160,
      "Thay đòn thường bằng tay ôm phóng thẳng tầm 160, gây 75% ATK và kéo người trúng về phía Bé với lực có trần.",
      "Nhịp đánh dài hơn 45%; đường móc hẹp, có thể trượt và bị đệ chặn.",
    ),
    ult(
      "Bão Gấu Bông",
      "orbit",
      65,
      3,
      "Thay Super xoay nhanh bằng ba quả cầu xoay quanh Bé một giây, rồi rời quỹ đạo đuổi địch. Mỗi quả gây 65% ATK.",
      "Mất phần tăng xoay và bảo đảm Tiểu Đường của Super gốc.",
    ),
  ],
  char_03: [
    shot(
      "Chùm Nho Tách Hạt",
      "split",
      55,
      120,
      "Quả thường gây 55% ATK; lần va chạm đầu hoặc hết tầm tách ba hạt bay theo ba hướng, mỗi hạt bằng 30% sát thương quả mẹ.",
      "Không còn nảy; nhịp ném dài hơn 20%. Hạt con không kích hoạt đòn thường hay tách tiếp.",
    ),
    shot(
      "Quả Cầu Hồi Lưu",
      "return",
      90,
      115,
      "Quả thường bay ra rồi quay về chủ sau 0,6 giây. Mỗi mục tiêu chỉ trúng một lần mỗi lượt đi/về, 90% ATK mỗi lần, tối đa hai người mỗi chiều.",
      "Không nảy; nhịp ném dài hơn 15%, tối đa một quả hồi lưu đang bay.",
    ),
    ult(
      "Mưa Hạt Chín",
      "mines",
      50,
      5,
      "Thay rổ quả bằng năm hạt mìn rải quanh mục tiêu. Lên ngòi sau 0,6 giây, chạm địch hoặc hết 3 giây thì nổ trong bán kính 55, 50% ATK mỗi hạt.",
      "Không còn cú rổ 160%; hạt đứng yên, có thể tránh vùng rải.",
    ),
  ],
  char_04: [
    melee(
      "Lưỡi Gió",
      "wave",
      85,
      135,
      200,
      "Thay đòn cận chiến bằng lưỡi gió bay lượn sang hai bên theo đường tiến, gây 85% ATK và xuyên tối đa hai mục tiêu.",
      "Nhịp đánh dài hơn 35%; không còn cú đẩy mạnh của đòn thường gốc.",
    ),
    melee(
      "Bước Đệm Gió",
      "charge",
      110,
      160,
      140,
      "Mỗi nhịp lao ngắn theo hướng vũ khí và phóng một mặt gió rộng phía trước, gây 110% ATK khi chạm.",
      "Nhịp đánh dài hơn 60%; lao theo hướng xoay, không tự né đòn hay xuyên tường.",
    ),
    ult(
      "Lốc Cuốn Theo Người",
      "vortex",
      22,
      1,
      "Super tạo một lốc bán kính 120 đi theo chủ trong 3 giây, kéo địch về tâm và gây 22% ATK mỗi giây.",
      "Thay toàn bộ phần tăng xoay/lực đẩy của Super gốc.",
    ),
  ],
  char_05: [
    shot(
      "Đạn Khoan",
      "pierce",
      100,
      150,
      "Đạn thường thành mũi khoan lớn, xuyên tối đa ba mục tiêu theo một đường thẳng, 100% ATK mỗi người.",
      "Nhịp bắn dài hơn 50%; không tự bẻ hướng hoặc nảy tường.",
    ),
    ult(
      "Trạm Săn Đuổi",
      "summon",
      40,
      1,
      "Super gọi drone có HP đi theo chủ trong 6 giây. Drone tự bắn một viên vào địch gần trong tầm 220 mỗi giây.",
      "Thay trụ cố định 8 giây; drone chỉ có 25% HP gốc chủ và mỗi phát bằng 40% ATK gốc.",
      "drone",
    ),
    ult(
      "Pháo Ba Nòng",
      "summon",
      25,
      1,
      "Super đặt pháo có HP, tồn tại 6 giây; mỗi 1,5 giây bắn ba viên tỏa quạt vào hướng địch, mỗi viên 25% ATK gốc.",
      "Thay trụ bắn đơn; yếu khi mục tiêu chỉ trúng một nhánh quạt.",
      "fanTurret",
    ),
  ],
  char_06: [
    shot(
      "Lăng Kính Tách Tia",
      "fan",
      40,
      145,
      "Mỗi lần bắn tạo ba dải màu theo ba hướng; mỗi dải gây 40% ATK. Dải màu vẫn có thể tiếp sức đồng đội trên đường bay.",
      "Nhịp bắn dài hơn 45%; sát thương mỗi dải thấp hơn và không nhân chồng buff cùng loại.",
      3,
    ),
    shot(
      "Cầu Vồng Quay Lại",
      "return",
      60,
      150,
      "Dải màu bay ra rồi trở về chủ, có thể chạm lại một người ở lượt về; mỗi lượt gây 60% ATK, giữ tương tác tiếp sức của dải màu.",
      "Nhịp bắn dài hơn 50%; chỉ giữ một dải hồi lưu đang bay.",
    ),
    ult(
      "Giao Điểm Sắc Màu",
      "crossBeams",
      90,
      2,
      "Thay tia cầu vồng đơn bằng hai tia hẹp vuông góc tại người dùng, mỗi tia dài 260 và gây 90% ATK. Đồng đội trên tia vẫn được tiếp sức.",
      "Không còn tia rộng 320; cần đứng đúng giao điểm để phủ nhiều mục tiêu.",
    ),
  ],
  char_07: [
    melee(
      "Gào Bật Âm",
      "throw",
      65,
      150,
      170,
      "Đòn thường thành một vành âm thanh bay ra rồi trở về. Mỗi lượt đi/về có thể trúng mỗi địch một lần, 65% ATK.",
      "Chỉ một vành đang bay; không còn đánh chạm vũ khí trong lúc chờ vành về.",
    ),
    counter(
      "Bẫy Can Đảm",
      "mine",
      65,
      "Khi mất HP do địch đánh trực tiếp, để lại một bẫy âm trước người. Sau 0,6 giây bẫy lên ngòi, nổ bán kính 55 với 65% ATK. Hồi 6 giây.",
      "Nhịp đánh thường dài hơn 25%. Bẫy đứng yên, chỉ tồn tại 3 giây và không cho né thêm.",
    ),
    ult(
      "Tiếng Hú Dội Tường",
      "ricochet",
      30,
      8,
      "Thay tiếng hét khống chế bằng tám vành âm bắn ra tám hướng, mỗi vành nảy tường hai lần và gây 30% ATK.",
      "Không còn Choáng/Paralyzed diện rộng từ Super gốc.",
    ),
  ],
  char_08: [
    melee(
      "Song Nha",
      "cross",
      75,
      155,
      90,
      "Đòn thường quét thành hai đường nanh vuông góc. Mỗi địch chỉ nhận một lần 75% ATK trong cùng nhịp, tối đa ba người.",
      "Nhịp đánh dài hơn 55%; không tăng sát thương khi hai đường cùng chạm một người.",
    ),
    melee(
      "Liềm Trăng",
      "throw",
      65,
      155,
      190,
      "Ném liềm trăng xuyên hai địch rồi quay về chủ; mỗi người có thể trúng một lần mỗi chiều, 65% ATK.",
      "Không đánh chạm trong lúc liềm đang bay; không tự hồi HP khi bắt liềm.",
    ),
    ult(
      "Bầy Sói Ảo",
      "summon",
      30,
      2,
      "Thay Trăng máu bằng hai sói nhỏ có HP đuổi địch bằng chuyển động vật lý, tồn tại 5 giây; mỗi cú cắn bằng 30% ATK gốc chủ.",
      "Không nhận phần tăng sát thương/tốc độ của Trăng máu. Mỗi sói chỉ có 18% HP gốc chủ.",
      "hunter",
    ),
  ],
  char_09: [
    shot(
      "Deadline Gập",
      "return",
      65,
      150,
      "Deadline gập thành đường đạn đi rồi quay về, gây 65% ATK mỗi lượt; mỗi mục tiêu chỉ trúng một lần mỗi chiều.",
      "Nhịp bắn dài hơn 50%; chỉ một deadline hồi lưu đang bay.",
    ),
    shot(
      "Ghim Việc",
      "mine",
      95,
      130,
      "Phóng một ghim bay 80 đơn vị rồi neo lại. Sau 0,6 giây lên ngòi, chạm địch hoặc hết 3 giây thì nổ bán kính 55 với 95% ATK.",
      "Nhịp đặt dài hơn 30%; phải dụ địch đi vào ghim, không tự gây Paralyzed của đòn thường.",
    ),
    ult(
      "Dây Chuyền Công Việc",
      "chain",
      75,
      4,
      "Bắn một deadline chuyền mục tiêu: sau mỗi cú trúng, đường đạn đuổi người chưa trúng gần đó trong 140, tối đa bốn địch, 75% ATK mỗi người.",
      "Thay năm vùng deadline; đường chuyền có thể bị chặn và không tạo vùng áp lực.",
    ),
  ],
  char_10: [
    melee(
      "Vành Cưa",
      "whirl",
      70,
      165,
      78,
      "Đòn thường quét tròn quanh Lốp, tối đa ba địch trong bán kính 78, mỗi người 70% ATK.",
      "Nhịp đánh dài hơn 65%; không đánh từ xa.",
    ),
    melee(
      "Lốp Hồi Lưu",
      "throw",
      60,
      155,
      175,
      "Phóng một vành lốp lớn đi rồi trở về, mỗi chiều gây 60% ATK và có thể xuyên hai địch.",
      "Tạm ngừng đòn chạm trong khi vành lốp chưa về.",
    ),
    ult(
      "Hai Làn Lăn",
      "summon",
      55,
      2,
      "Thay cú tự lăn bằng hai lốp nhỏ có HP lao theo hai làn, nảy khi va chạm, húc địch bằng 55% ATK gốc và đẩy người trúng. Tồn tại 4 giây.",
      "Chủ không còn được lao nhanh. Mỗi lốp có 18% HP gốc chủ và có thể bị phá.",
      "ram",
    ),
  ],
  char_12: [
    melee(
      "Trảm Chữ Thập",
      "cross",
      95,
      125,
      105,
      "Hai đường kiếm vuông góc thay đòn chạm, mỗi người nhận tối đa một lần 95% ATK mỗi nhịp.",
      "Nhịp đánh dài hơn 25%; giới hạn ba địch mỗi nhịp.",
    ),
    melee(
      "Kiếm Vọng",
      "echo",
      84,
      130,
      95,
      "Chém một đường 84% ATK, để lại vệt báo trước tại đúng vị trí chém. Sau 0,4 giây, vệt chém lặp gây thêm 42% ATK cho người còn đứng trên đó.",
      "Nhịp đánh dài hơn 30%; nhát lặp đứng yên, có thể tránh và không kích hoạt proc đòn thường.",
    ),
    ult(
      "Mưa Phi Kiếm",
      "ricochet",
      45,
      12,
      "Thay lao kiếm bằng mười hai phi kiếm tỏa quanh người, mỗi kiếm nảy tường hai lần, 45% ATK.",
      "Không còn cú lao và tăng xoay của Super gốc.",
    ),
  ],
  char_15: [
    melee(
      "Khiên Hồi Lưu",
      "throw",
      90,
      100,
      180,
      "Ném khiên thành đĩa bay xuyên hai địch rồi quay về; mỗi lượt gây 90% ATK. Chỉ có một khiên đang bay.",
      "Trong lúc khiên bay, không đánh cận chiến và không dùng khiên chặn đạn.",
    ),
    counter(
      "Phản Kích Khiên",
      "fan",
      40,
      "Sau khi mất HP do địch đánh trực tiếp, phóng ba mảnh khiên theo hướng người vừa đánh, mỗi mảnh 40% ATK. Hồi 6 giây.",
      "Nhịp đánh thường dài hơn 25%. Không cấp khiên/giảm sát thương thêm, không phản công khi chỉ mất khiên.",
    ),
    ult(
      "Chiến Hữu Xương",
      "summon",
      50,
      1,
      "Super gọi một hộ vệ có HP đi theo đồng đội yếu nhất, chặn đường đạn bằng thân và đánh địch gần. Tồn tại 6 giây.",
      "Thay tám mảnh xương; hộ vệ có 40% HP gốc và 50% ATK gốc chủ, có thể bị phá.",
      "bodyguard",
    ),
  ],
  char_16: [
    shot(
      "Mực Loang",
      "split",
      60,
      125,
      "Viên mực 60% ATK vỡ thành ba nét mực nhỏ theo ba hướng khi va chạm đầu hoặc hết tầm; mỗi nét con bằng 30% đạn mẹ.",
      "Nhịp bắn dài hơn 25%; nét con không gây proc đòn thường hoặc tách tiếp.",
    ),
    shot(
      "Bút Lượn Sóng",
      "wave",
      80,
      120,
      "Nét mực lượn ngang theo đường tiến, xuyên hai mục tiêu với 80% ATK mỗi người.",
      "Nhịp bắn dài hơn 20%; có thể lượn lệch khỏi mục tiêu đứng yên ở đường giữa.",
    ),
    ult(
      "Ba Ô Tranh",
      "paint",
      23,
      3,
      "Super tạo ba ô mực bán kính 70 nối thành một dải quanh mục tiêu, báo trước lệch nhịp rồi tồn tại 3 giây, gây 23% ATK mỗi giây.",
      "Thay một vũng lớn 150; giữa các ô có khoảng tránh và vùng chồng không nhân nhịp sát thương.",
    ),
  ],
  char_17: [
    melee(
      "Đơn Hàng Xuyên Tuyến",
      "thrust",
      110,
      150,
      125,
      "Đòn thường thành cú đâm thẳng dài 125, có thể xuyên ba địch, 110% ATK mỗi người.",
      "Nhịp đánh dài hơn 50%; đường đâm hẹp, dễ hụt người ở bên hông.",
    ),
    melee(
      "Giao Hàng Hai Chiều",
      "throw",
      60,
      150,
      195,
      "Ném kiện hàng cứng theo hướng vũ khí rồi kéo về, gây 60% ATK mỗi lượt đi/về, xuyên tối đa hai người.",
      "Chỉ một kiện đang bay; không đánh chạm trong khi kiện chưa về.",
    ),
    ult(
      "Trạm Giao Nhanh",
      "summon",
      0,
      2,
      "Thay cú giao hàng né đòn bằng hai đệ tiếp tế có HP tìm đồng đội bị thương. Khi tới gần, mỗi đệ hồi 1% HP gốc chủ mỗi 2 giây, tối đa 20 HP/lần. Tồn tại 6 giây.",
      "Mất phần lao và né đòn của Super. Đệ chỉ có 18% HP gốc chủ, không tấn công địch.",
      "medic",
    ),
  ],
  char_18: [
    melee(
      "Muôi Vung Rộng",
      "sweep",
      85,
      140,
      90,
      "Vung muôi thành quạt rộng phía trước, đánh tối đa ba địch, mỗi người 85% ATK.",
      "Nhịp đánh dài hơn 40%; không đánh được người ở sau lưng.",
    ),
    melee(
      "Nắp Nồi Bay",
      "throw",
      65,
      155,
      175,
      "Phóng nắp nồi đi rồi trở về, mỗi chiều 65% ATK; cú trúng chính vẫn xét Burn của bộ kỹ năng.",
      "Chỉ một nắp đang bay và không đánh chạm trong lúc chờ nắp về.",
    ),
    ult(
      "Bếp Lẩu Dã Chiến",
      "summon",
      40,
      1,
      "Super đặt bếp có HP đứng yên 6 giây, mỗi 1,5 giây bắn một viên lẩu nổ bán kính 55, 40% ATK gốc.",
      "Không còn vùng lẩu đi theo chủ và phần tự hồi của Super gốc. Bếp có 40% HP gốc chủ.",
      "brazier",
    ),
  ],
  char_19: [
    melee(
      "Phi Phong Bao",
      "fan",
      40,
      150,
      180,
      "Mỗi nhịp ném ba phong bao tỏa quạt: trúng địch mỗi bao 40% ATK, trúng đồng đội giữ hiệu ứng lì xì của phong bao.",
      "Nhịp đánh dài hơn 50%; thay cú đánh chạm và không tăng buff khi nhiều bao cùng trúng một người.",
    ),
    melee(
      "Bao Lì Xì Hồi Đáp",
      "throw",
      60,
      155,
      190,
      "Một phong bao bay ra rồi trở về; có thể tương tác với mỗi người một lần mỗi chiều.",
      "Chỉ một bao hồi lưu đang bay; sát thương mỗi chiều 60% ATK và không đánh chạm trong lúc chờ.",
    ),
    ult(
      "Sạp Lộc Di Động",
      "summon",
      30,
      1,
      "Super đặt một sạp tiếp tế có HP cạnh đồng đội yếu nhất. Trong 6 giây, sạp bắn quả tiếp tế tới đồng đội bị thương mỗi 1,5 giây.",
      "Thay tám lì xì tỏa hướng; sạp đứng yên, có 25% HP gốc chủ và có thể bị phá.",
      "supply",
    ),
  ],
  char_21: [
    shot(
      "Pháo Tản",
      "fan",
      25,
      135,
      "Mỗi lần bắn phóng năm viên khí tỏa quạt, mỗi viên 25% ATK; rất mạnh khi đứng sát, khó gom đủ viên ở xa.",
      "Nhịp bắn dài hơn 35%; viên ngoài không có proc đòn thường.",
      5,
    ),
    shot(
      "Khí Xuyên",
      "pierce",
      110,
      155,
      "Pháo khí thành một đường đạn lớn xuyên ba địch, mỗi người 110% ATK.",
      "Nhịp bắn dài hơn 55%; không còn lực đẩy mạnh theo đòn thường gốc.",
    ),
    ult(
      "Vệ Tinh Khí Nén",
      "orbit",
      65,
      3,
      "Super tạo ba vệ tinh khí xoay quanh người một giây, sau đó phóng ra đuổi địch, 65% ATK mỗi vệ tinh.",
      "Không nhận khiên và không bắn tám hướng ngay như Super gốc.",
    ),
  ],
  char_23: [
    melee(
      "Xung Kiếm",
      "thrust",
      110,
      145,
      135,
      "Đòn thường trở thành đường đâm thẳng rất dài, xuyên ba mục tiêu, mỗi người 110% ATK.",
      "Nhịp đánh dài hơn 45%; vùng trúng hẹp và vẫn chịu giáp/khiên.",
    ),
    melee(
      "Kiếm Quét Hai Trục",
      "cross",
      95,
      125,
      110,
      "Quét hai trục kiếm vuông góc thay cú chạm, mỗi người chỉ trúng một lần 95% ATK mỗi nhịp.",
      "Nhịp đánh dài hơn 25%; tối đa ba địch.",
    ),
    ult(
      "Vương Kiếm Tách Mảnh",
      "split",
      120,
      4,
      "Phóng một kiếm lớn 120% ATK. Khi chạm đầu hoặc hết tầm, kiếm vỡ thành bốn mảnh theo hướng tiến, mỗi mảnh 30% đạn mẹ.",
      "Thay Super kiếm khổng lồ cận chiến; không còn giai đoạn chắc chắn bỏ qua va chạm vũ khí.",
    ),
  ],
  char_24: [
    shot(
      "Bút Tam Tài",
      "fan",
      40,
      145,
      "Mỗi nhịp bắn ba nét mực tỏa quạt, mỗi nét 40% ATK; chỉ nét giữa tính là đòn thường để xét hiệu ứng bộ kỹ năng.",
      "Nhịp bắn dài hơn 45%; hai nét ngoài không gây thêm debuff ngẫu nhiên.",
      3,
    ),
    shot(
      "Mực Đuổi Hình",
      "seeker",
      75,
      140,
      "Nét mực tự uốn đường bay theo mục tiêu đã chọn, gây 75% ATK khi trúng.",
      "Nhịp bắn dài hơn 40%; đạn không xuyên, không tự tăng tầm sống và vẫn bị đệ/khiên chặn.",
    ),
    ult(
      "Bút Trận Tứ Phương",
      "crossBeams",
      70,
      4,
      "Super vẽ bốn nét tỏa theo bốn hướng vuông góc tại người dùng; mỗi nét dài 260, gây 70% ATK.",
      "Thay mười hai viên mực tỏa; nét cắt không tự gắn debuff ngẫu nhiên.",
    ),
  ],
  char_25: [
    melee(
      "Đồng Xu Xoay",
      "orbit",
      55,
      200,
      75,
      "Thay đòn thường bằng hai đồng xu bay sát quanh chủ trong 1,5 giây; mỗi xu chỉ trúng mỗi địch một lần, 55% ATK.",
      "Nhịp gọi dài gấp đôi, tối đa hai xu cùng lúc; không còn đòn chạm trong thời gian đó.",
    ),
    melee(
      "Búng Tiền",
      "thrust",
      100,
      150,
      170,
      "Búng một đồng xu thành cú đánh thẳng tầm 170, có thể xuyên ba địch, mỗi người 100% ATK.",
      "Nhịp đánh dài hơn 50%; vùng trúng hẹp, không thay đổi rủi ro giao dịch.",
    ),
    ult(
      "Quỹ Đầu Tư Tiền Tuyến",
      "summon",
      22,
      1,
      "Super dựng quỹ có HP trong 6 giây, mỗi 1,5 giây bắn ba đồng xu về hướng địch, mỗi xu 22% ATK gốc.",
      "Không còn bốn giao dịch chắc chắn lãi và Rage từ Super gốc. Quỹ có 40% HP gốc chủ.",
      "bank",
    ),
  ],
  char_26: [
    melee(
      "Lưỡi Bass",
      "wave",
      80,
      135,
      200,
      "Phóng lưỡi gió lượn ngang theo đường tiến, xuyên hai mục tiêu, mỗi người 80% ATK.",
      "Nhịp đánh dài hơn 35%; thay cú đánh chạm đẩy lùi.",
    ),
    melee(
      "Vòng Xoáy Đổi Beat",
      "whirl",
      70,
      175,
      75,
      "Đòn thường thành một vòng quét bán kính 75 quanh người, tối đa ba địch, mỗi người 70% ATK.",
      "Nhịp đánh dài hơn 75%; không tạo thêm đòn khi chỉ đi sát đối thủ.",
    ),
    ult(
      "Hai Mắt Bão",
      "vortex",
      20,
      2,
      "Super đặt hai tâm lốc ở hai bên mục tiêu, mỗi tâm bán kính 95, kéo địch và gây 20% ATK mỗi giây trong 3 giây.",
      "Thay một lốc lớn 160; khoảng giữa hai tâm có thể bị vượt qua, vùng trùng không nhân nhịp sát thương.",
    ),
  ],
  char_27: [
    melee(
      "Hỏa Tiễn Tay",
      "thrust",
      100,
      150,
      150,
      "Thay đòn chạm bằng luồng nhiệt thẳng tầm 150, xuyên tối đa ba địch, mỗi người 100% ATK; giữ xét Burn ở cú trúng chính.",
      "Nhịp đánh dài hơn 50%; không đánh được mục tiêu ngoài đường nhiệt.",
    ),
    melee(
      "Dao Nhiệt Hồi Lưu",
      "throw",
      60,
      150,
      180,
      "Ném dao nhiệt đi rồi trở về, mỗi chiều gây 60% ATK và có thể trúng lại người đã trúng lúc đi.",
      "Chỉ một dao đang bay, không đánh chạm trong lúc chờ dao về.",
    ),
    ult(
      "Lò Nung Vệ Tinh",
      "orbit",
      65,
      3,
      "Super tạo ba lõi nhiệt xoay quanh người một giây rồi phóng ra đuổi địch, mỗi lõi 65% ATK.",
      "Không có phần tăng sát thương/di chuyển/nhịp đánh của Super gốc; cũng không tự Burn từ Super này.",
    ),
  ],
  char_28: [
    melee(
      "Nắm Đấm Phóng",
      "charge",
      120,
      170,
      145,
      "Mỗi nhịp lao ngắn theo hướng vũ khí, đồng thời phóng một nắm đấm rộng gây 120% ATK khi chạm.",
      "Nhịp đánh dài hơn 70%; không tự né và vẫn bị tường chặn.",
    ),
    melee(
      "Đĩa Cưa Tái Chế",
      "throw",
      65,
      155,
      190,
      "Ném một đĩa cưa đi rồi trở về chủ; xuyên hai người, 65% ATK mỗi chiều.",
      "Không đánh chạm trong lúc đĩa chưa về. Rủi ro tự đánh của dạng cơ bản vẫn xét trên các cú trúng chính.",
    ),
    ult(
      "Laser Tách Tia",
      "beams",
      100,
      3,
      "Super bắn ba tia laser hẹp tỏa quạt, mỗi tia dài 260 và gây 100% ATK cho người trên tia.",
      "Thay tia laser lớn; mỗi tia yếu hơn và không có phần tự Burn từ Super cơ bản.",
    ),
  ],
  char_29: [
    shot(
      "Điểm Ảnh Tách",
      "split",
      40,
      135,
      "Viên đạn chính 40% ATK tách ba điểm ảnh 30% sát thương đạn mẹ khi va chạm đầu hoặc hết tầm.",
      "Nhịp bắn dài hơn 35%; chỉ viên chính giữ luật trúng đồng đội của dạng cơ bản. Mảnh con không có proc hoặc tách tiếp.",
    ),
    shot(
      "Đạn Gập Gương",
      "ricochet",
      65,
      145,
      "Đạn thường nảy tường hai lần rồi tiếp tục bay, mỗi lần trúng gây 65% ATK.",
      "Nhịp bắn dài hơn 45%; giữ rủi ro trúng đồng đội ở dạng cơ bản và không tăng số lần nảy theo tăng trưởng.",
    ),
    ult(
      "Ống Kính Quét",
      "beams",
      65,
      3,
      "Thay chuỗi tám phát bằng ba tia hẹp tỏa quạt, dài 260, mỗi tia 65% ATK.",
      "Không có tám phát hoặc phản đạn vào chủ; tổng sát thương tập trung thấp hơn chuỗi gốc.",
    ),
  ],
  char_30: [
    shot(
      "Bóng Chùm",
      "split",
      60,
      140,
      "Bóng thường nổ 60% ATK rồi tách ba mảnh bay theo ba hướng, mỗi mảnh bằng 30% sát thương bóng mẹ.",
      "Nhịp thả dài hơn 40%; vụ nổ mẹ vẫn có rủi ro trúng chủ/đồng đội ở dạng cơ bản, mảnh con không tách tiếp.",
    ),
    shot(
      "Bóng Neo",
      "mine",
      80,
      150,
      "Bóng thường bay 80 đơn vị rồi neo đứng yên, lên ngòi sau 0,6 giây; chạm người hoặc hết 3 giây nổ bán kính 55, 80% ATK.",
      "Nhịp thả dài hơn 50%; dạng cơ bản vẫn có nguy cơ nổ trúng chủ và đồng đội.",
    ),
    ult(
      "Đoàn Bóng Hộ Tống",
      "orbit",
      65,
      5,
      "Super tạo năm bóng quay quanh người một giây, rồi tự phóng theo địch. Mỗi bóng gây 65% ATK khi trúng.",
      "Thay loạt bóng gốc; không nổ toàn vùng và không gây sát thương đồng đội/chủ từ năm bóng này.",
    ),
  ],
  char_31: [
    shot(
      "Rocket Chia Đầu",
      "split",
      65,
      130,
      "Rocket 65% ATK vỡ thành ba mảnh 30% sát thương mẹ theo ba hướng khi va chạm đầu hoặc hết tầm.",
      "Nhịp bắn dài hơn 30%; chỉ đầu chính xét Phóng xạ, mảnh con không có proc.",
    ),
    shot(
      "Tên Lửa Truy Đuổi",
      "seeker",
      80,
      140,
      "Tên lửa thường uốn đường bay theo mục tiêu đã chọn, gây 80% ATK.",
      "Nhịp bắn dài hơn 40%; không xuyên, không tăng tầm sống và vẫn bị vật thể chặn.",
    ),
    ult(
      "Trận Địa Pháo",
      "summon",
      30,
      3,
      "Thay tên lửa toàn bản đồ bằng ba ụ pháo có HP, mỗi 1,5 giây bắn một đạn nổ bán kính 55 với 30% ATK gốc. Tồn tại 4 giây.",
      "Không còn vụ nổ/Phóng xạ toàn bản đồ. Mỗi ụ có 18% HP gốc chủ, đạn ụ không gây hại đồng đội.",
      "mortar",
    ),
  ],
  char_32: [
    shot(
      "Dép Hồi Lưu",
      "return",
      65,
      155,
      "Dép bay ra rồi quay về chủ, gây 65% ATK mỗi chiều và xuyên hai người.",
      "Nhịp ném dài hơn 55%; không để lại vùng Frozen khi chạm, chỉ một dép hồi lưu đang bay.",
    ),
    shot(
      "Đôi Dép So Le",
      "fan",
      45,
      150,
      "Ném đồng thời hai dép theo hai hướng lệch nhau; mỗi dép gây 45% ATK và để vùng theo bộ kỹ năng gốc.",
      "Nhịp ném dài hơn 50%; hai dép có thể cùng trượt người ở đường giữa và vẫn dùng chung giới hạn vùng.",
      2,
    ),
    ult(
      "Tam Giác Dép",
      "slipper",
      22,
      3,
      "Super đặt ba trận dép nhỏ bán kính 70 quanh mục tiêu theo hình tam giác, báo trước lệch nhịp, tồn tại 3 giây và gây 22% ATK mỗi giây.",
      "Thay một đại trận bán kính 175; có khe tránh giữa các trận nhỏ, không nhân nhịp khi vùng trùng.",
    ),
  ],
  char_33: [
    melee(
      "Dĩa Bay Xuyên Tuyến",
      "thrust",
      95,
      145,
      170,
      "Thay đòn chạm bằng mũi dĩa bay thẳng tầm 170, xuyên ba người, mỗi người 95% ATK.",
      "Nhịp đánh dài hơn 45%; đường bay hẹp và không còn hai mặt vũ khí đánh riêng.",
    ),
    melee(
      "Đùi Gà Quét Vòng",
      "whirl",
      80,
      150,
      85,
      "Quét đùi gà thành vòng tròn bán kính 85, tối đa ba địch, mỗi người 80% ATK.",
      "Nhịp đánh dài hơn 50%; không thể đánh riêng hai phía để tăng số lần trúng.",
    ),
    ult(
      "Tiệc Nướng Trên Không",
      "boomerangs",
      45,
      3,
      "Super ném ba đùi gà theo ba hướng; mỗi đùi quay về sau 0,8 giây, có thể trúng mỗi người một lần mỗi chiều. Chủ bắt lại mỗi đùi hồi 1% HP gốc, tối đa 20 HP.",
      "Thay một đùi khổng lồ 125%; mỗi đùi nhỏ yếu hơn và tổng hồi chủ tối đa 3% HP gốc trước giảm hồi.",
    ),
  ],
};
