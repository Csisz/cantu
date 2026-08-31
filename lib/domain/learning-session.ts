import { z } from "zod";
import type { AuthContext } from "@/lib/auth/types";
import { MAX_AUDIO_SELECTION_MS, TEXT_INPUT_MAX_CHARACTERS } from "@/lib/input/limits";
import type { InputMode, LearningSource } from "@/lib/input/types";
import type { TablesInsert } from "@/lib/supabase/database.types";

export const DEFAULT_LANGUAGE_PAIR = {
  sourceLanguage: "it",
  explanationLanguage: "hu",
} as const;

const textSessionSchema = z
  .object({
    inputType: z.literal("text"),
    sourceCharCount: z.number().int().min(1).max(TEXT_INPUT_MAX_CHARACTERS),
  })
  .strict();

const audioSessionSchema = z
  .object({
    inputType: z.literal("audio_file"),
    sourceDurationMs: z.number().int().min(1).max(MAX_AUDIO_SELECTION_MS),
  })
  .strict();

const microphoneSessionSchema = z
  .object({
    inputType: z.literal("microphone"),
    sourceDurationMs: z.number().int().min(1).max(MAX_AUDIO_SELECTION_MS),
  })
  .strict();

export const learningSessionMetadataSchema = z.discriminatedUnion("inputType", [
  textSessionSchema,
  audioSessionSchema,
  microphoneSessionSchema,
]);

export const sessionIdSchema = z.string().uuid();
export type LearningSessionMetadata = z.infer<typeof learningSessionMetadataSchema>;
export type LearningSessionInsert = TablesInsert<"learning_sessions">;

export type PersistenceActionState = {
  status: "idle" | "success" | "error" | "unauthenticated";
  message?: string;
};

export const initialPersistenceActionState: PersistenceActionState = { status: "idle" };

export function toPersistenceInputType(mode: InputMode) {
  return mode === "listen" ? "microphone" : mode === "audio" ? "audio_file" : "text";
}

export function toLearningSessionMetadata(source: LearningSource): LearningSessionMetadata | null {
  if (source.kind === "text") {
    return learningSessionMetadataSchema.parse({
      inputType: "text",
      sourceCharCount: source.text.length,
    });
  }

  return learningSessionMetadataSchema.parse({
    inputType: source.kind === "audio" ? "audio_file" : "microphone",
    sourceDurationMs: source.durationMs,
  });
}

export function buildLearningSessionInsert(
  auth: AuthContext,
  metadata: LearningSessionMetadata,
): LearningSessionInsert {
  if (auth.status !== "authenticated") throw new Error("Authentication required");
  const parsed = learningSessionMetadataSchema.parse(metadata);

  return {
    user_id: auth.user.id,
    input_type: parsed.inputType,
    source_language: DEFAULT_LANGUAGE_PAIR.sourceLanguage,
    explanation_language: DEFAULT_LANGUAGE_PAIR.explanationLanguage,
    source_status: parsed.inputType === "text" ? "text_direct" : "pending",
    source_duration_ms: parsed.inputType !== "text" ? parsed.sourceDurationMs : null,
    source_char_count: parsed.inputType === "text" ? parsed.sourceCharCount : null,
    source_fingerprint: null,
    save_source: false,
    verified_source_text: null,
    source_retention_status: "not_stored",
    source_deleted_at: null,
  };
}

export function parseLearningSessionForm(formData: FormData): LearningSessionMetadata {
  const inputType = formData.get("inputType");
  if (inputType === "text") {
    return learningSessionMetadataSchema.parse({
      inputType,
      sourceCharCount: Number(formData.get("sourceCharCount")),
    });
  }
  return learningSessionMetadataSchema.parse({
    inputType,
    sourceDurationMs: Number(formData.get("sourceDurationMs")),
  });
}

export type LearningSessionRow = {
  id: string;
  input_type: string;
  source_status: string;
  source_duration_ms: number | null;
  source_char_count: number | null;
  created_at: string;
};

export type LearningProgressRow = {
  session_id: string;
  stage: string;
  percent_complete: number;
  last_opened_at: string;
  recall_score?: number | null;
};

export type LearningHistoryItem = {
  id: string;
  inputType: "microphone" | "audio_file" | "text";
  sourceStatus: string;
  sourceDurationMs: number | null;
  sourceCharCount: number | null;
  createdAt: string;
  progress: {
    stage: string;
    percentComplete: number;
    lastOpenedAt: string | null;
    recallScore?: number | null;
  };
};

export function toLearningHistoryItems(
  sessions: LearningSessionRow[],
  progressRows: LearningProgressRow[],
): LearningHistoryItem[] {
  const progressBySession = new Map(progressRows.map((row) => [row.session_id, row]));
  return sessions.map((session) => {
    const progress = progressBySession.get(session.id);
    return {
      id: session.id,
      inputType: z.enum(["microphone", "audio_file", "text"]).parse(session.input_type),
      sourceStatus: session.source_status,
      sourceDurationMs: session.source_duration_ms,
      sourceCharCount: session.source_char_count,
      createdAt: session.created_at,
      progress: {
        stage: progress?.stage ?? "new",
        percentComplete: Math.min(100, Math.max(0, progress?.percent_complete ?? 0)),
        lastOpenedAt: progress?.last_opened_at ?? null,
        recallScore: progress?.recall_score ?? null,
      },
    };
  });
}
