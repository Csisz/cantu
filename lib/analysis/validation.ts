import { z } from "zod";
import { TEXT_INPUT_MAX_CHARACTERS } from "@/lib/input/limits";
import { verifiedSourceStatusSchema } from "./schema";

export const analysisRequestSchema = z
  .object({
    text: z.string().trim().min(1).max(TEXT_INPUT_MAX_CHARACTERS),
    sourceStatus: verifiedSourceStatusSchema,
    inputType: z.enum(["microphone", "audio_file", "text"]),
    sessionId: z.string().uuid().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.sourceStatus === "text_direct") {
      if (value.inputType !== "text" || value.sessionId) {
        context.addIssue({ code: "custom", message: "Direct text must create its session at analysis time." });
      }
      return;
    }
    if (value.inputType === "text" || !value.sessionId) {
      context.addIssue({ code: "custom", message: "Verified STT sources require their owned audio session." });
    }
  });

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;
