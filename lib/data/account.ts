import "server-only";

import type { AuthContext } from "@/lib/auth/types";
import { isE2EAuthMockEnabled } from "@/lib/env/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clearE2ELearningSessions, exportE2EAccountData } from "./e2e-learning-store";

function userOf(auth: AuthContext) {
  if (auth.status !== "authenticated") throw new Error("Unauthenticated");
  return auth.user;
}

export async function exportOwnedAccountData(auth: AuthContext) {
  const user = userOf(auth);
  if (isE2EAuthMockEnabled()) return exportE2EAccountData(user);
  const admin = createAdminClient();
  const [profile, sessions, phrases, reviews] = await Promise.all([
    admin.from("profiles").select("display_name, created_at, updated_at").eq("id", user.id).maybeSingle(),
    admin.from("learning_sessions").select("id, input_type, content_kind, source_language, explanation_language, source_status, source_duration_ms, source_char_count, source_retention_status, source_deleted_at, created_at, updated_at").eq("user_id", user.id).order("created_at"),
    admin.from("user_phrasebook").select("id, italian_chunk, meaning_hu, note_hu, register, source_session_id, created_at, last_reviewed_at").eq("user_id", user.id).order("created_at"),
    admin.from("user_phrase_review").select("phrase_id, state, next_review_at, last_reviewed_at, review_count, success_count, lapse_count, interval_days, difficulty, last_rating, created_at, updated_at").eq("user_id", user.id),
  ]);
  const error = profile.error ?? sessions.error ?? phrases.error ?? reviews.error;
  if (error) throw new Error("Account export unavailable");
  const sessionIds = (sessions.data ?? []).map((session) => session.id);
  const [progress, results] = sessionIds.length ? await Promise.all([
    admin.from("learning_progress").select("session_id, stage, percent_complete, recall_score, last_opened_at, created_at, updated_at").eq("user_id", user.id),
    admin.from("learning_results").select("session_id, schema_version, generator_version, result_json, created_at, updated_at").in("session_id", sessionIds),
  ]) : [{ data: [], error: null }, { data: [], error: null }];
  if (progress.error ?? results.error) throw new Error("Account export unavailable");
  return {
    exportedAt: new Date().toISOString(),
    account: { email: user.email, displayName: user.displayName, profile: profile.data },
    learningSessions: sessions.data,
    learningProgress: progress.data,
    learningResults: results.data,
    savedPhrases: phrases.data,
    phraseReview: reviews.data,
  };
}

export async function deleteOwnedAccount(auth: AuthContext) {
  const user = userOf(auth);
  if (isE2EAuthMockEnabled()) {
    clearE2ELearningSessions(user.id);
    return;
  }
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id, false);
  if (error) throw new Error("Account deletion unavailable");
}
