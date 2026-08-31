import { z } from "zod";
import { lessonStageSchema, stagePercent } from "@/lib/learning/player";

export const learningProgressMutationSchema = z
  .object({
    sessionId: z.string().uuid(),
    stage: lessonStageSchema,
    percentComplete: z.number().min(0).max(100),
    recallScore: z.number().min(0).max(100).nullable().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.percentComplete !== stagePercent(value.stage)) {
      context.addIssue({
        code: "custom",
        path: ["percentComplete"],
        message: "Progress percentage must match the lesson stage",
      });
    }
  });

export type LearningProgressMutation = z.infer<typeof learningProgressMutationSchema>;

export function progressLabel(percentComplete: number) {
  const bounded = Math.min(100, Math.max(0, Math.round(percentComplete)));
  return `${bounded}%`;
}
