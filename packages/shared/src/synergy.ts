export type SynergyKind = "rescue" | "chain" | "break" | "tempo";
const kinds: Record<string, SynergyKind> = {
  P01: "rescue",
  P02: "break",
  P03: "rescue",
  P04: "break",
  P05: "chain",
  P06: "tempo",
  P07: "chain",
  P08: "chain",
  P09: "tempo",
  P10: "chain",
  P11: "rescue",
  P12: "tempo",
  P13: "rescue",
  P14: "break",
  P15: "tempo",
  P16: "chain",
  P17: "rescue",
  P18: "tempo",
  P19: "chain",
  P20: "rescue",
  P21: "tempo",
  P22: "break",
  P23: "chain",
  P24: "rescue",
  T01: "rescue",
  T02: "break",
  T03: "rescue",
  T04: "chain",
  T05: "tempo",
  T06: "chain",
  T07: "rescue",
  T08: "chain",
  T09: "break",
  T10: "rescue",
  T11: "tempo",
  G01: "tempo",
  G02: "rescue",
  G03: "break",
  G04: "rescue",
  G05: "tempo",
  G06: "chain",
  G07: "rescue",
  G08: "chain",
  G09: "rescue",
  G10: "tempo",
  G11: "tempo",
  G12: "break",
  G13: "chain",
  G14: "rescue",
  G15: "chain",
  G16: "break",
  G17: "rescue",
};
export const SYNERGY_SIGNATURES = {
  rescue: {
    name: "Cứu viện",
    text: "Đồng đội trong liên kết có tỷ lệ HP thấp nhất nhận khiên bằng 12% HP gốc trong 4 giây, đồng thời xóa Frozen và Paralyzed. Mốc 3 tăng khiên thành 18%.",
  },
  chain: {
    name: "Liên kích",
    text: "Mỗi đồng đội khác trong liên kết cường hóa đòn thường kế tiếp: thêm 60% ATK thành sát thương trực tiếp; phải đánh trong 3 giây. Mốc 3 tăng thành 90%.",
  },
  break: {
    name: "Phá nhịp",
    text: "Địch gần người kích hoạt nhất bị choáng 0,5 giây và chậm 25% trong 3 giây. Mốc 3 tăng thời gian chậm thành 4 giây.",
  },
  tempo: {
    name: "Tiếp nhịp Super",
    text: "Mỗi đồng đội khác trong liên kết nhận 20 năng lượng Super. Mốc 3 tăng thành 30 năng lượng.",
  },
} as const;
export const synergyKind = (id: string): SynergyKind => kinds[id] || "chain";
/** Broad age/profession groups stay passive; signatures reward a chosen pair or anchor. */
export const canResonate = (id: string) => !["G01", "G10"].includes(id);
export const synergySignature = (id: string) =>
  SYNERGY_SIGNATURES[synergyKind(id)];
export const SYNERGY_RULE =
  "Cộng hưởng dùng chung hồi 8 giây mỗi đội, tối đa 4 lần/trận. Không cần đứng gần; cần đủ thành viên còn sống. Ưu tiên liên kết bộ ba, rồi đôi, rồi hội; mỗi lần chỉ phát một Cộng hưởng.";
