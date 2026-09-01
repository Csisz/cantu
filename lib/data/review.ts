import "server-only";

import { z } from "zod";
import type { AuthContext } from "@/lib/auth/types";
import { isE2EAuthMockEnabled } from "@/lib/env/server";
import { buildReviewItem, gradeReviewAnswer } from "@/lib/review/grading";
import { buildReviewQueue, isReviewDue } from "@/lib/review/queue";
import { scheduleReview } from "@/lib/review/scheduler";
import {
  REVIEW_ACTIVITY_TYPES,
  REVIEW_RATINGS,
  type PhrasebookSnapshot,
  type PhraseReviewState,
  type ReviewPhrase,
  type ReviewSnapshot,
  type ReviewSubmissionResponse,
} from "@/lib/review/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { bringE2EReviewForward, deleteE2EPhrase, listE2EPhrases, updateE2EReview } from "./e2e-learning-store";

const phraseIdSchema = z.string().uuid();
export const reviewSubmissionSchema = z.object({
  phraseId: phraseIdSchema,
  activityType: z.enum(REVIEW_ACTIVITY_TYPES),
  answer: z.string().min(1).max(2_000),
  rating: z.enum(REVIEW_RATINGS).exclude(["again"]).optional(),
  manual: z.boolean().optional().default(false),
}).strict();

function requireUser(auth: AuthContext) {
  return auth.status === "authenticated" ? auth.user : null;
}

type PhraseRow = {
  id: string;
  user_id: string;
  italian_chunk: string;
  meaning_hu: string;
  note_hu: string | null;
  register: string | null;
  source_session_id: string | null;
  created_at: string;
};

type ReviewRow = {
  phrase_id: string;
  user_id: string;
  state: string;
  next_review_at: string;
  last_reviewed_at: string | null;
  review_count: number;
  success_count: number;
  lapse_count: number;
  interval_days: number;
  difficulty: number;
  last_rating: string | null;
  created_at: string;
  updated_at: string;
};

function toReviewState(row: ReviewRow): PhraseReviewState {
  return {
    phraseId: row.phrase_id,
    state: row.state as PhraseReviewState["state"],
    nextReviewAt: row.next_review_at,
    lastReviewedAt: row.last_reviewed_at,
    reviewCount: row.review_count,
    successCount: row.success_count,
    lapseCount: row.lapse_count,
    intervalDays: row.interval_days,
    difficulty: Number(row.difficulty),
    lastRating: row.last_rating as PhraseReviewState["lastRating"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPhrase(row: PhraseRow, review: PhraseReviewState): ReviewPhrase {
  return {
    id: row.id,
    italianChunk: row.italian_chunk,
    meaningHu: row.meaning_hu,
    noteHu: row.note_hu,
    register: row.register,
    sourceSessionId: row.source_session_id,
    createdAt: row.created_at,
    review,
  };
}

export async function loadOwnedPhrases(auth: AuthContext): Promise<ReviewPhrase[]> {
  const user = requireUser(auth);
  if (!user) return [];

  if (isE2EAuthMockEnabled()) {
    return listE2EPhrases(user.id).flatMap(({ phrase, review }) => review ? [toPhrase({
      id: phrase.id,
      user_id: phrase.userId,
      italian_chunk: phrase.italian_chunk,
      meaning_hu: phrase.meaning_hu,
      note_hu: phrase.note_hu,
      register: phrase.register,
      source_session_id: phrase.source_session_id,
      created_at: phrase.created_at,
    }, review)] : []);
  }

  const supabase = await createClient();
  const [phraseResult, reviewResult] = await Promise.all([
    supabase.from("user_phrasebook").select("id, user_id, italian_chunk, meaning_hu, note_hu, register, source_session_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("user_phrase_review").select("phrase_id, user_id, state, next_review_at, last_reviewed_at, review_count, success_count, lapse_count, interval_days, difficulty, last_rating, created_at, updated_at").eq("user_id", user.id),
  ]);
  const error = phraseResult.error ?? reviewResult.error;
  if (error) {
    console.error("Cantu phrase memory load failed", { code: error.code });
    throw new Error("Phrase memory load failed");
  }
  const reviewByPhrase = new Map(
    (reviewResult.data as ReviewRow[]).map((row) => [row.phrase_id, toReviewState(row)]),
  );
  return (phraseResult.data as PhraseRow[]).flatMap((row) => {
    const review = reviewByPhrase.get(row.id);
    return review ? [toPhrase(row, review)] : [];
  });
}

export async function bringOwnedPhraseReviewForward(
  auth: AuthContext,
  phraseIdInput: unknown,
  now = new Date(),
) {
  const user = requireUser(auth);
  if (!user) return false;
  const phraseId = phraseIdSchema.parse(phraseIdInput);
  const phrases = await loadOwnedPhrases(auth);
  const phrase = phrases.find((item) => item.id === phraseId);
  if (!phrase) return false;
  const boundedNextReviewAt = new Date(now.getTime() + 24 * 60 * 60 * 1_000).toISOString();
  if (new Date(phrase.review.nextReviewAt).getTime() <= new Date(boundedNextReviewAt).getTime()) return true;

  if (isE2EAuthMockEnabled()) {
    return bringE2EReviewForward(user.id, phraseId, new Date(boundedNextReviewAt));
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("user_phrase_review").update({
    next_review_at: boundedNextReviewAt,
    state: phrase.review.state === "stable" ? "review" : phrase.review.state,
  }).eq("phrase_id", phraseId).eq("user_id", user.id).select("phrase_id").maybeSingle();
  if (error || !data) {
    console.error("Cantu practice review signal failed", { code: error?.code ?? "not_found" });
    return false;
  }
  return true;
}

export async function getPhrasebookSnapshot(auth: AuthContext): Promise<PhrasebookSnapshot> {
  if (!requireUser(auth)) return { status: "ready", items: [], dueCount: 0 };
  try {
    const items = await loadOwnedPhrases(auth);
    const now = new Date();
    return { status: "ready", items, dueCount: items.filter((item) => isReviewDue(item.review.nextReviewAt, now)).length };
  } catch {
    return { status: "error", message: "A mentett kifejezéseket most nem érjük el." };
  }
}

export async function getReviewSnapshot(
  auth: AuthContext,
  manualPhraseId?: string,
): Promise<ReviewSnapshot | null> {
  if (!requireUser(auth)) return null;
  const phrases = await loadOwnedPhrases(auth);
  const now = new Date();
  const dueCount = phrases.filter((phrase) => isReviewDue(phrase.review.nextReviewAt, now)).length;
  if (manualPhraseId) {
    const parsedId = phraseIdSchema.parse(manualPhraseId);
    const phrase = phrases.find((item) => item.id === parsedId);
    if (!phrase) return null;
    return { mode: "manual", dueCount, items: [buildReviewItem(phrase, phrases)], phrases };
  }
  return { mode: "scheduled", dueCount, items: buildReviewQueue(phrases, now), phrases };
}

export async function submitPhraseReview(
  auth: AuthContext,
  input: unknown,
  now = new Date(),
): Promise<ReviewSubmissionResponse> {
  const user = requireUser(auth);
  if (!user) return { status: "unauthenticated", message: "Az ismétlés mentéséhez jelentkezz be újra." };
  const parsed = reviewSubmissionSchema.parse(input);
  const phrases = await loadOwnedPhrases(auth);
  const phrase = phrases.find((item) => item.id === parsed.phraseId);
  if (!phrase) return { status: "error", message: "Ez a kifejezés nem érhető el a saját gyűjteményedben." };
  const item = buildReviewItem(phrase, phrases);
  if (item.activityType !== parsed.activityType) {
    return { status: "error", message: "A kérdés közben megváltozott. Töltsd újra az ismétlést." };
  }
  const correct = gradeReviewAnswer(item, parsed.answer);
  if (parsed.manual) {
    return { status: "success", correct, message: "A kézi gyakorlás nem módosította az ütemezést." };
  }
  if (correct && !parsed.rating) {
    return { status: "error", correct, message: "Válaszd ki, mennyire volt könnyű felidézni." };
  }
  const effectiveRating = correct ? parsed.rating! : "again";
  const scheduled = scheduleReview(phrase.review, effectiveRating, now);

  if (isE2EAuthMockEnabled()) {
    const updated = updateE2EReview(user.id, phrase.id, effectiveRating, now);
    if (!updated) return { status: "error", message: "Az ismétlést most nem sikerült menteni." };
  } else {
    const admin = createAdminClient();
    const { data, error } = await admin.from("user_phrase_review").update({
      state: scheduled.state,
      next_review_at: scheduled.nextReviewAt,
      last_reviewed_at: scheduled.lastReviewedAt,
      review_count: scheduled.reviewCount,
      success_count: scheduled.successCount,
      lapse_count: scheduled.lapseCount,
      interval_days: scheduled.intervalDays,
      difficulty: scheduled.difficulty,
      last_rating: scheduled.lastRating,
    }).eq("phrase_id", phrase.id).eq("user_id", user.id).select("phrase_id").maybeSingle();
    if (error || !data) {
      console.error("Cantu review schedule save failed", { code: error?.code ?? "not_found" });
      return { status: "error", correct, message: "Az ismétlést most nem sikerült menteni. A válaszod ettől még megmarad ezen a képernyőn." };
    }
    await admin.from("user_phrasebook").update({ last_reviewed_at: scheduled.lastReviewedAt }).eq("id", phrase.id).eq("user_id", user.id);
  }

  return {
    status: "success",
    correct,
    effectiveRating,
    nextReviewAt: scheduled.nextReviewAt,
    state: scheduled.state,
    message: correct ? "Az ismétlés elmentve." : "Ez a kifejezés hamarabb visszatér.",
  };
}

export async function deletePhrasebookItem(auth: AuthContext, phraseIdInput: unknown) {
  const user = requireUser(auth);
  if (!user) return { status: "unauthenticated" as const, message: "A törléshez jelentkezz be újra." };
  const phraseId = phraseIdSchema.parse(phraseIdInput);
  if (isE2EAuthMockEnabled()) {
    return deleteE2EPhrase(user.id, phraseId)
      ? { status: "success" as const, message: "A kifejezés és az ismétlési állapota törölve." }
      : { status: "error" as const, message: "Ez a kifejezés nem található." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("user_phrasebook").delete().eq("id", phraseId).eq("user_id", user.id).select("id").maybeSingle();
  if (error || !data) return { status: "error" as const, message: "A kifejezést most nem sikerült törölni." };
  return { status: "success" as const, message: "A kifejezés és az ismétlési állapota törölve." };
}
