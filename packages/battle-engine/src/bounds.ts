import { div } from "./math";
import type { BattleState } from "./types";

export interface ArenaBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function safeBounds(s: BattleState): ArenaBounds {
  const { width, height, shrinkSeconds } = s.config;
  const end = shrinkSeconds * 30;
  const start = Math.min(900, div(end, 2));
  const elapsed = Math.max(0, Math.min(s.tick - start, end - start));
  const squareAt = width === height ? 0 : Math.max(1, div(end - start, 3));
  const short = Math.min(width, height);
  // First trim the long axis to the inscribed square, then shrink that square.
  const trim = Math.min(elapsed, squareAt);
  const shrink =
    elapsed <= squareAt
      ? 0
      : div(short * 30 * (elapsed - squareAt), (end - start - squareAt) * 100);
  const trimDuration = Math.max(1, squareAt);
  const left = div((width - short) * trim, trimDuration * 2) + shrink;
  const top = div((height - short) * trim, trimDuration * 2) + shrink;
  return { left, right: width - left, top, bottom: height - top };
}
