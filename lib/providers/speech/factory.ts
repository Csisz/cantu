import "server-only";

import { isE2ESTTMockEnabled } from "@/lib/env/server";
import { OpenAISpeechToTextProvider } from "./openai";
import { TestSpeechToTextProvider } from "./test-provider";
import { TranscriptionError, type SpeechToTextProvider } from "./types";

export function createSpeechToTextProvider(): SpeechToTextProvider {
  if (isE2ESTTMockEnabled()) return new TestSpeechToTextProvider();
  const provider = (process.env.SPEECH_TO_TEXT_PROVIDER ?? "openai").trim();
  if (provider !== "openai") throw new TranscriptionError("not_configured");
  return new OpenAISpeechToTextProvider(process.env.OPENAI_API_KEY ?? "");
}
