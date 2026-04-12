/** Tropical Sun sign abbreviation (Ari, Tau, …) from calendar month/day */

const SUN_SIGN_STARTS: { month: number; day: number; sign: string }[] = [
  { month: 1, day: 20, sign: "Aqu" },
  { month: 2, day: 19, sign: "Pis" },
  { month: 3, day: 21, sign: "Ari" },
  { month: 4, day: 20, sign: "Tau" },
  { month: 5, day: 21, sign: "Gem" },
  { month: 6, day: 21, sign: "Can" },
  { month: 7, day: 23, sign: "Leo" },
  { month: 8, day: 23, sign: "Vir" },
  { month: 9, day: 23, sign: "Lib" },
  { month: 10, day: 23, sign: "Sco" },
  { month: 11, day: 22, sign: "Sag" },
  { month: 12, day: 22, sign: "Cap" },
];

export function getTropicalSunSignAbbrev(month: number, day: number): string {
  for (let i = SUN_SIGN_STARTS.length - 1; i >= 0; i--) {
    const { month: m, day: d, sign } = SUN_SIGN_STARTS[i];
    if (month > m || (month === m && day >= d)) return sign;
  }
  return "Cap";
}
