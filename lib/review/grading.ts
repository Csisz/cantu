import type { ReviewActivityType, ReviewItem, ReviewPhrase } from "./types";

export function normalizeItalianReviewAnswer(value: string) {
  return value
    .normalize("NFC")
    .replace(/[’‘`´]/gu, "'")
    .trim()
    .replace(/\s+/gu, " ")
    .toLocaleLowerCase("it-IT");
}

function stableChoiceId(index: number) {
  return `choice-${index + 1}`;
}

function meaningChoices(phrase: ReviewPhrase, allPhrases: ReviewPhrase[]) {
  const meanings = [
    phrase.meaningHu,
    ...allPhrases
      .filter((candidate) => candidate.id !== phrase.id)
      .map((candidate) => candidate.meaningHu),
  ].filter((meaning, index, values) => values.indexOf(meaning) === index).slice(0, 3);
  const rotated = meanings.length > 1
    ? [...meanings.slice(1), meanings[0]!]
    : meanings;
  return rotated.map((text, index) => ({ id: stableChoiceId(index), text }));
}

function fillPrompt(italianChunk: string) {
  const tokens = italianChunk.trim().split(/\s+/u);
  if (tokens.length < 2) return null;
  const targetIndex = tokens.reduce((best, token, index) =>
    token.length > tokens[best]!.length ? index : best, 0);
  const answer = tokens[targetIndex]!;
  const promptTokens = [...tokens];
  promptTokens[targetIndex] = "_____";
  return { prompt: promptTokens.join(" "), answer };
}

export function activityTypeForReview(
  phrase: ReviewPhrase,
  allPhrases: ReviewPhrase[],
): ReviewActivityType {
  const desired = phrase.review.reviewCount % 3;
  if (desired === 0 && meaningChoices(phrase, allPhrases).length >= 2) return "it_to_hu";
  if (desired === 2 && fillPrompt(phrase.italianChunk)) return "fill_chunk";
  return "hu_to_it";
}

export function buildReviewItem(phrase: ReviewPhrase, allPhrases: ReviewPhrase[]): ReviewItem {
  const activityType = activityTypeForReview(phrase, allPhrases);
  if (activityType === "it_to_hu") {
    const options = meaningChoices(phrase, allPhrases);
    return {
      phraseId: phrase.id,
      activityType,
      prompt: phrase.italianChunk,
      promptLanguage: "it",
      answerLabel: "Mit jelent magyarul?",
      options,
      correctOptionId: options.find((option) => option.text === phrase.meaningHu)?.id ?? null,
      correctText: null,
      revealedAnswer: phrase.meaningHu,
      noteHu: phrase.noteHu,
      register: phrase.register,
      state: phrase.review.state,
      nextReviewAt: phrase.review.nextReviewAt,
    };
  }
  if (activityType === "fill_chunk") {
    const fill = fillPrompt(phrase.italianChunk)!;
    return {
      phraseId: phrase.id,
      activityType,
      prompt: fill.prompt,
      promptLanguage: "it",
      answerLabel: "Írd be a hiányzó olasz részt",
      options: [],
      correctOptionId: null,
      correctText: fill.answer,
      revealedAnswer: phrase.italianChunk,
      noteHu: phrase.noteHu,
      register: phrase.register,
      state: phrase.review.state,
      nextReviewAt: phrase.review.nextReviewAt,
    };
  }
  return {
    phraseId: phrase.id,
    activityType,
    prompt: phrase.meaningHu,
    promptLanguage: "hu",
    answerLabel: "Írd le olaszul",
    options: [],
    correctOptionId: null,
    correctText: phrase.italianChunk,
    revealedAnswer: phrase.italianChunk,
    noteHu: phrase.noteHu,
    register: phrase.register,
    state: phrase.review.state,
    nextReviewAt: phrase.review.nextReviewAt,
  };
}

export function gradeReviewAnswer(item: ReviewItem, answer: string) {
  if (item.activityType === "it_to_hu") {
    return Boolean(item.correctOptionId) && answer === item.correctOptionId;
  }
  return Boolean(item.correctText)
    && normalizeItalianReviewAnswer(answer) === normalizeItalianReviewAnswer(item.correctText ?? "");
}
