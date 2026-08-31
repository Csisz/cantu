import { pronunciationFeedbackSchema, type PronunciationFeedback } from "./types";

const apostrophes = /[’‘`´]/gu;
const nonLexical = /[^\p{L}\p{N}'\s-]+/gu;

export function normalizeItalianText(value: string) {
  return value
    .normalize("NFC")
    .replace(apostrophes, "'")
    .replace(nonLexical, " ")
    .trim()
    .replace(/\s+/gu, " ")
    .toLocaleLowerCase("it-IT");
}

type LexicalToken = { display: string; normalized: string };

export function tokenizeItalian(value: string): LexicalToken[] {
  const normalizedText = normalizeItalianText(value);
  if (!normalizedText) return [];
  return normalizedText.split(" ").flatMap((display) => {
    const normalized = display.replace(/['-]/gu, "");
    return normalized ? [{ display, normalized }] : [];
  });
}

function counts(tokens: LexicalToken[]) {
  const result = new Map<string, number>();
  for (const token of tokens) result.set(token.normalized, (result.get(token.normalized) ?? 0) + 1);
  return result;
}

function orderedSubset(target: LexicalToken[], understood: LexicalToken[]) {
  let cursor = -1;
  for (const token of target) {
    const next = understood.findIndex((candidate, index) => index > cursor && candidate.normalized === token.normalized);
    if (next >= 0) cursor = next;
    else if (understood.some((candidate) => candidate.normalized === token.normalized)) return false;
  }
  return true;
}

export function comparePronunciationTokens(targetText: string, understoodText: string) {
  const target = tokenizeItalian(targetText);
  const understood = tokenizeItalian(understoodText);
  const understoodCounts = counts(understood);
  const targetCounts = counts(target);
  const matchedTokens: string[] = [];
  const missingTokens: string[] = [];
  const extraTokens: string[] = [];

  for (const token of target) {
    const remaining = understoodCounts.get(token.normalized) ?? 0;
    if (remaining > 0) {
      matchedTokens.push(token.display);
      understoodCounts.set(token.normalized, remaining - 1);
    } else {
      missingTokens.push(token.display);
    }
  }
  for (const token of understood) {
    const remaining = targetCounts.get(token.normalized) ?? 0;
    if (remaining > 0) targetCounts.set(token.normalized, remaining - 1);
    else extraTokens.push(token.display);
  }

  return {
    matchedTokens,
    missingTokens,
    extraTokens,
    orderCorrect: orderedSubset(target, understood),
  };
}

export function buildTransparentPronunciationFeedback(input: {
  targetText: string;
  understoodText: string;
  learnerDurationMs: number;
  referenceDurationMs?: number;
}): PronunciationFeedback {
  const targetMatch = comparePronunciationTokens(input.targetText, input.understoodText);
  const observations: PronunciationFeedback["observations"] = [];

  if (targetMatch.missingTokens.length === 0 && targetMatch.extraTokens.length === 0 && targetMatch.orderCorrect) {
    observations.push({ code: "all_words_recognized", messageHu: "Minden szót elcsíptem." });
  } else {
    if (targetMatch.missingTokens.length > 0) {
      observations.push({
        code: "some_words_missing",
        messageHu: `Ezt a részt most nem értettem biztosan: ${targetMatch.missingTokens.join(", ")}. Próbáld újra egy kicsit lassabban.`,
      });
    }
    if (targetMatch.extraTokens.length > 0) {
      observations.push({
        code: "extra_words",
        messageHu: `Ezeket a plusz szavakat hallottam: ${targetMatch.extraTokens.join(", ")}.`,
      });
    }
    if (!targetMatch.orderCorrect) {
      observations.push({
        code: "word_order_difference",
        messageHu: "A szavakat most más sorrendben értettem. Mondd ki újra a kifejezést egyben.",
      });
    }
  }

  return pronunciationFeedbackSchema.parse({
    understoodText: input.understoodText,
    targetMatch,
    timing: {
      learnerDurationMs: Math.round(input.learnerDurationMs),
      ...(input.referenceDurationMs ? { referenceDurationMs: Math.round(input.referenceDurationMs) } : {}),
    },
    observations,
  });
}

