export const PUBLIC_BETA_LIMITS = {
  transcriptionPerHour: 20,
  analysisPerHour: 10,
  pronunciationPerHour: 15,
  practiceTurnsPerHour: 24,
  jsonRequestBytes: 12_000,
  sourceTextChars: 2_000,
  practiceResponseChars: 1_000,
  billingWebhookBytes: 256_000,
} as const;

export type GuardedOperation = "transcription" | "analysis" | "pronunciation" | "practice";

export const RATE_LIMIT_INVENTORY: Record<GuardedOperation, { limit: number; windowMinutes: number; storage: "postgres" }> = {
  transcription: { limit: PUBLIC_BETA_LIMITS.transcriptionPerHour, windowMinutes: 60, storage: "postgres" },
  analysis: { limit: PUBLIC_BETA_LIMITS.analysisPerHour, windowMinutes: 60, storage: "postgres" },
  pronunciation: { limit: PUBLIC_BETA_LIMITS.pronunciationPerHour, windowMinutes: 60, storage: "postgres" },
  practice: { limit: PUBLIC_BETA_LIMITS.practiceTurnsPerHour, windowMinutes: 60, storage: "postgres" },
};
