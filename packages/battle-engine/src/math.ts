// Fixed-point scale 100 world units; vectors scale 1024. All divisions truncate toward zero.
export const SCALE = 100,
  UNIT = 1024;
export const div = (a: number, b: number) => Math.trunc(a / b);
export const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));
export function isqrt(n: number): number {
  if (!Number.isSafeInteger(n) || n < 0)
    throw Error("Unsafe square root input");
  if (n < 2) return n;
  let x = n,
    y = Math.floor((x + 1) / 2);
  while (y < x) {
    x = y;
    y = Math.floor((x + Math.floor(n / x)) / 2);
  }
  return x;
}
export const DIRECTIONS: readonly (readonly [number, number])[] = [
  [1024, 0],
  [1004, 200],
  [946, 392],
  [851, 569],
  [724, 724],
  [569, 851],
  [392, 946],
  [200, 1004],
  [0, 1024],
  [-200, 1004],
  [-392, 946],
  [-569, 851],
  [-724, 724],
  [-851, 569],
  [-946, 392],
  [-1004, 200],
  [-1024, 0],
  [-1004, -200],
  [-946, -392],
  [-851, -569],
  [-724, -724],
  [-569, -851],
  [-392, -946],
  [-200, -1004],
  [0, -1024],
  [200, -1004],
  [392, -946],
  [569, -851],
  [724, -724],
  [851, -569],
  [946, -392],
  [1004, -200],
];
export function random(state: { rng: number }): number {
  let x = state.rng | 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return (state.rng = x >>> 0);
}
export const normalize = (x: number, y: number): [number, number] => {
  const d = isqrt(x * x + y * y);
  return d ? [div(x * UNIT, d), div(y * UNIT, d)] : [UNIT, 0];
};
export function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  const obj = value as Record<string, unknown>;
  return (
    "{" +
    Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort()
      .map((k) => JSON.stringify(k) + ":" + canonical(obj[k]))
      .join(",") +
    "}"
  );
}
export function hash(value: unknown): string {
  const str = canonical(value);
  let h = 2166136261;
  for (let i = 0; i < str.length; i++)
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
}
