import type { PronounOption } from "./types";

export function pronounForms(p: PronounOption): string {
  if (p === "he") return "he/him/his";
  if (p === "she") return "she/her/hers";
  if (p === "they") return "they/them/theirs";
  return "";
}

/** Instruction line for one person (synastry or when only one pronoun applies) */
export function pronounInstructionForPerson(
  roleLabel: string,
  pronoun: PronounOption | undefined
): string {
  if (!pronoun || pronoun === "prefer-not-to-say") {
    return `${roleLabel}: use this person's name; use neutral or inclusive wording (e.g. they/them) where a pronoun is needed.`;
  }
  return `${roleLabel}: use ${pronoun} pronouns (${pronounForms(pronoun)}).`;
}

export function dailyReadingNameInstruction(displayName: string): string {
  return `ADDRESS THIS PERSON BY NAME: Refer to them as "${displayName}" in the reading text wherever you would say "the native", "the chart holder", or similar. You may also use "you" occasionally for a direct horoscope tone, but prefer "${displayName}" for third-person sentences. Do not use the phrase "the native".`;
}
