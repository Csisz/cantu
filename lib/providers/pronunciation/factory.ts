import "server-only";

import { isE2ESTTMockEnabled } from "@/lib/env/server";
import type { PronunciationFeedbackProvider } from "@/lib/pronunciation/types";
import { createSpeechToTextProvider } from "../speech/factory";
import { TestPronunciationFeedbackProvider } from "./test-provider";
import { TransparentSttPronunciationFeedbackProvider } from "./transparent-stt";

export function createPronunciationFeedbackProvider(): PronunciationFeedbackProvider {
  if (isE2ESTTMockEnabled()) return new TestPronunciationFeedbackProvider();
  return new TransparentSttPronunciationFeedbackProvider(createSpeechToTextProvider());
}

