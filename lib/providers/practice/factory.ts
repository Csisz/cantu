import "server-only";

import { isE2EPracticeMockEnabled } from "@/lib/env/server";
import { PracticeError, type ConversationPracticeProvider } from "./types";
import { DEFAULT_CONVERSATION_PRACTICE_MODEL, OpenAIConversationPracticeProvider } from "./openai";
import { TestConversationPracticeProvider } from "./test-provider";

export function createConversationPracticeProvider(): ConversationPracticeProvider {
  if (isE2EPracticeMockEnabled()) return new TestConversationPracticeProvider();
  if ((process.env.CONVERSATION_PRACTICE_PROVIDER ?? "openai").trim() !== "openai") {
    throw new PracticeError("not_configured");
  }
  return new OpenAIConversationPracticeProvider(
    process.env.OPENAI_API_KEY ?? "",
    fetch,
    undefined,
    (process.env.CONVERSATION_PRACTICE_MODEL ?? process.env.LANGUAGE_ANALYSIS_MODEL ?? DEFAULT_CONVERSATION_PRACTICE_MODEL).trim(),
  );
}
