import "server-only";

import { isE2EAnalysisMockEnabled } from "@/lib/env/server";
import { DEFAULT_LANGUAGE_ANALYSIS_MODEL } from "@/lib/analysis/schema";
import { OpenAILanguageAnalysisProvider } from "./openai";
import { TestLanguageAnalysisProvider } from "./test-provider";
import { AnalysisError, type LanguageAnalysisProvider } from "./types";

export function createLanguageAnalysisProvider(): LanguageAnalysisProvider {
  if (isE2EAnalysisMockEnabled()) return new TestLanguageAnalysisProvider();
  const provider = (process.env.LANGUAGE_ANALYSIS_PROVIDER ?? "openai").trim();
  if (provider !== "openai") throw new AnalysisError("not_configured");
  const model = (process.env.LANGUAGE_ANALYSIS_MODEL ?? DEFAULT_LANGUAGE_ANALYSIS_MODEL).trim();
  if (!model) throw new AnalysisError("not_configured");
  return new OpenAILanguageAnalysisProvider(
    process.env.OPENAI_API_KEY ?? "",
    fetch,
    undefined,
    model,
  );
}
