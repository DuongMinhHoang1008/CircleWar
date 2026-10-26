/** Preserve existing class/role assignments; combat mechanics live in character-kits.ts. */
export const LEGENDARY_IDENTITIES: Record<
  string,
  { base: string; roleClass: string }
> = {
  char_22: { base: "guardian", roleClass: "Hỗ trợ" },
  char_23: { base: "swordsman", roleClass: "Đấu sĩ" },
  char_31: { base: "ranger", roleClass: "Xạ thủ" },
  char_32: { base: "frost", roleClass: "Kiểm soát" },
  char_33: { base: "guardian", roleClass: "Hộ vệ" },
};
