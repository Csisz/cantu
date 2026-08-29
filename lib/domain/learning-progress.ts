import { z } from "zod";

export const learningProgressMutationSchema = z
  .object({
    sessionId: z.string().uuid(),
    stage: z.enum(["new", "source_verified", "understand", "notice", "say", "recall", "completed"]),
    percentComplete: z.number().min(0).max(100),
    recallScore: z.number().min(0).max(100).nullable().optional(),
  })
  .strict();

export function progressLabel(percentComplete: number) {
  const bounded = Math.min(100, Math.max(0, Math.round(percentComplete)));
  return `${bounded}%`;
}
