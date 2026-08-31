import {
  learningAnalysisSchema,
  type LearningAnalysis,
  type VerifiedLearningSource,
} from "./schema";

export type AnalysisValidationResult =
  | { success: true; analysis: LearningAnalysis }
  | { success: false; issues: string[] };

export function normalizeSourceQuote(value: string) {
  return value
    .normalize("NFC")
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("it-IT");
}

export function sourceContainsExactChunk(source: string, chunk: string) {
  const normalizedSource = normalizeSourceQuote(source);
  const normalizedChunk = normalizeSourceQuote(chunk);
  return normalizedChunk.length > 0 && normalizedSource.includes(normalizedChunk);
}

function duplicateValues(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (seen.has(value)) return true;
    seen.add(value);
    return false;
  });
}

export function validateLearningAnalysis(
  source: VerifiedLearningSource,
  candidate: unknown,
): AnalysisValidationResult {
  const parsed = learningAnalysisSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      success: false,
      issues: parsed.error.issues.map((issue) => `${issue.path.join(".") || "result"}: ${issue.message}`),
    };
  }

  const analysis = parsed.data;
  const issues: string[] = [];

  for (const [index, chunk] of analysis.chunks.entries()) {
    if (!sourceContainsExactChunk(source.text, chunk.sourceText)) {
      issues.push(`chunks.${index}.sourceText is not an exact occurrence in the verified source`);
    }
  }

  const duplicateRecallIds = duplicateValues(analysis.recall.map((item) => item.id));
  if (duplicateRecallIds.length > 0) issues.push("recall item IDs must be unique");

  for (const [index, item] of analysis.recall.entries()) {
    const optionIds = item.options.map((option) => option.id);
    if (duplicateValues(optionIds).length > 0) {
      issues.push(`recall.${index}.options IDs must be unique`);
    }
    if (item.type === "fill_chunk") {
      if (!item.correctText || item.correctOptionId !== null || item.options.length !== 0) {
        issues.push(`recall.${index} fill_chunk must have correctText and no options/correctOptionId`);
      }
    } else if (
      item.options.length < 2 ||
      item.correctText !== null ||
      !item.correctOptionId ||
      !optionIds.includes(item.correctOptionId)
    ) {
      issues.push(`recall.${index} choice item must reference one of at least two option IDs`);
    }
  }

  if (analysis.analysisStatus === "ready") {
    if (!analysis.meaning?.naturalHu) issues.push("ready analysis requires a natural Hungarian meaning");
    if (analysis.chunks.length < 1) issues.push("ready analysis requires useful source material");
    if (analysis.transfer.length < 1) issues.push("ready analysis requires an original transfer example");
    if (analysis.recall.length < 2) issues.push("ready analysis requires at least two recall items");
    for (const [index, example] of analysis.transfer.entries()) {
      if (normalizeSourceQuote(example.italian) === normalizeSourceQuote(source.text)) {
        issues.push(`transfer.${index}.italian must be a new teaching example, not the complete source`);
      }
    }
  } else {
    if (analysis.meaning !== null) issues.push(`${analysis.analysisStatus} must not contain a fabricated meaning`);
    if (
      analysis.chunks.length > 0 ||
      analysis.grammar.length > 0 ||
      analysis.pronunciation !== null ||
      analysis.transfer.length > 0 ||
      analysis.recall.length > 0
    ) {
      issues.push(`${analysis.analysisStatus} must not contain a fabricated learning lesson`);
    }
  }

  return issues.length > 0 ? { success: false, issues } : { success: true, analysis };
}
