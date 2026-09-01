export const REVIEW_RATINGS = ["again", "hard", "good", "easy"] as const;
export type ReviewRating = (typeof REVIEW_RATINGS)[number];

export const REVIEW_STATES = ["new", "learning", "review", "stable"] as const;
export type ReviewStateName = (typeof REVIEW_STATES)[number];

export type PhraseReviewState = {
  phraseId: string;
  state: ReviewStateName;
  nextReviewAt: string;
  lastReviewedAt: string | null;
  reviewCount: number;
  successCount: number;
  lapseCount: number;
  intervalDays: number;
  difficulty: number;
  lastRating: ReviewRating | null;
  createdAt: string;
  updatedAt: string;
};

export type ReviewPhrase = {
  id: string;
  italianChunk: string;
  meaningHu: string;
  noteHu: string | null;
  register: string | null;
  sourceSessionId: string | null;
  createdAt: string;
  review: PhraseReviewState;
};

export const REVIEW_ACTIVITY_TYPES = ["it_to_hu", "hu_to_it", "fill_chunk"] as const;
export type ReviewActivityType = (typeof REVIEW_ACTIVITY_TYPES)[number];

export type ReviewChoice = { id: string; text: string };

export type ReviewItem = {
  phraseId: string;
  activityType: ReviewActivityType;
  prompt: string;
  promptLanguage: "it" | "hu";
  answerLabel: string;
  options: ReviewChoice[];
  correctOptionId: string | null;
  correctText: string | null;
  revealedAnswer: string;
  noteHu: string | null;
  register: string | null;
  state: ReviewStateName;
  nextReviewAt: string;
};

export type ReviewSubmission = {
  phraseId: string;
  activityType: ReviewActivityType;
  answer: string;
  rating?: Exclude<ReviewRating, "again">;
  manual?: boolean;
};

export type ReviewSubmissionResponse = {
  status: "success" | "error" | "unauthenticated";
  correct?: boolean;
  effectiveRating?: ReviewRating;
  nextReviewAt?: string;
  state?: ReviewStateName;
  message: string;
};

export type PhrasebookSnapshot =
  | { status: "ready"; items: ReviewPhrase[]; dueCount: number }
  | { status: "error"; message: string };

export type ReviewSnapshot = {
  mode: "scheduled" | "manual";
  dueCount: number;
  items: ReviewItem[];
  phrases: ReviewPhrase[];
};
