/** Wheel index 0 = Aries at top, matching ♈…♓ order */

export const ZODIAC_WHEEL_SIGN_ABBREVS = [
  "Ari",
  "Tau",
  "Gem",
  "Can",
  "Leo",
  "Vir",
  "Lib",
  "Sco",
  "Sag",
  "Cap",
  "Aqu",
  "Pis",
] as const;

export type TropicalSignAbbrev = (typeof ZODIAC_WHEEL_SIGN_ABBREVS)[number];

export const SIGN_FULL_NAME: Record<TropicalSignAbbrev, string> = {
  Ari: "Aries",
  Tau: "Taurus",
  Gem: "Gemini",
  Can: "Cancer",
  Leo: "Leo",
  Vir: "Virgo",
  Lib: "Libra",
  Sco: "Scorpio",
  Sag: "Sagittarius",
  Cap: "Capricorn",
  Aqu: "Aquarius",
  Pis: "Pisces",
};

export const SIGN_SUN_DATE_RANGE: Record<TropicalSignAbbrev, string> = {
  Ari: "Mar 21 – Apr 19",
  Tau: "Apr 20 – May 20",
  Gem: "May 21 – Jun 20",
  Can: "Jun 21 – Jul 22",
  Leo: "Jul 23 – Aug 22",
  Vir: "Aug 23 – Sep 22",
  Lib: "Sep 23 – Oct 22",
  Sco: "Oct 23 – Nov 21",
  Sag: "Nov 22 – Dec 21",
  Cap: "Dec 22 – Jan 19",
  Aqu: "Jan 20 – Feb 18",
  Pis: "Feb 19 – Mar 20",
};
