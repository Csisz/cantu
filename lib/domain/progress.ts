import { z } from "zod";

export const DEFAULT_LANGUAGE_PAIR = {
  sourceLanguage: "it",
  explanationLanguage: "hu",
} as const;

export const progressMutationSchema = z
  .object({
    songId: z.string().uuid(),
    lessonId: z.string().uuid().nullable().optional(),
    stage: z.enum(["new", "quick_understand", "deep_dive", "completed"]),
    percentComplete: z.number().min(0).max(100),
    quizScore: z.number().min(0).max(100).nullable().optional(),
  })
  .strict();

export type ProgressMutationInput = z.infer<typeof progressMutationSchema>;

export function progressLabel(percentComplete: number) {
  const bounded = Math.min(100, Math.max(0, Math.round(percentComplete)));
  return `${bounded}%`;
}
