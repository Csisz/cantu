import "server-only";

import { createHash } from "node:crypto";
import type { AuthContext } from "@/lib/auth/types";
import {
  completeLearningAnalysis,
  failLearningAnalysis,
  startLearningAnalysis,
} from "@/lib/data/learning-analysis";
import type { LanguageAnalysisProvider } from "@/lib/providers/analysis/types";
import { AnalysisError, type CompletedLearningAnalysis } from "@/lib/providers/analysis/types";
import {
  DEFAULT_ANALYSIS_REASONING_EFFORT,
  LEARNING_ANALYSIS_PROMPT_VERSION,
  LEARNING_ANALYSIS_SCHEMA_VERSION,
  verifiedLearningSourceSchema,
} from "./schema";
import { validateLearningAnalysis } from "./semantic-validation";
import type { AnalysisRequest } from "./validation";

export function fingerprintVerifiedSource(text: string) {
  return createHash("sha256").update(text.normalize("NFC"), "utf8").digest("hex");
}

export function analysisGeneratorVersion(provider: LanguageAnalysisProvider) {
  return `${LEARNING_ANALYSIS_PROMPT_VERSION}:${provider.name}:${provider.model}`;
}

export async function analyzeVerifiedSource(
  auth: AuthContext,
  request: AnalysisRequest,
  provider: LanguageAnalysisProvider,
  signal?: AbortSignal,
): Promise<CompletedLearningAnalysis> {
  if (auth.status !== "authenticated") throw new AnalysisError("unauthenticated");
  const source = verifiedLearningSourceSchema.parse({
    text: request.text,
    sourceStatus: request.sourceStatus,
    sourceLanguage: "it",
    explanationLanguage: "hu",
  });
  const generatorVersion = analysisGeneratorVersion(provider);
  const persistence = await startLearningAnalysis(auth, {
    sessionId: request.sessionId,
    inputType: request.inputType,
    sourceStatus: request.sourceStatus,
    sourceCharCount: source.text.length,
    sourceFingerprint: fingerprintVerifiedSource(source.text),
    provider: provider.name,
    schemaVersion: LEARNING_ANALYSIS_SCHEMA_VERSION,
    generatorVersion,
  });

  if (persistence.cachedResult) {
    const cached = validateLearningAnalysis(source, persistence.cachedResult);
    if (!cached.success) throw new AnalysisError("analysis_invalid");
    return {
      analysis: cached.analysis,
      sessionId: persistence.sessionId,
      cached: true,
      generation: {
        model: provider.model,
        reasoningEffort: DEFAULT_ANALYSIS_REASONING_EFFORT,
        schemaVersion: LEARNING_ANALYSIS_SCHEMA_VERSION,
        promptVersion: LEARNING_ANALYSIS_PROMPT_VERSION,
        latencyMs: 0,
      },
    };
  }

  if (!persistence.attemptId) throw new AnalysisError("analysis_in_progress");
  const startedAt = performance.now();
  try {
    let providerResult = await provider.analyze(source, { signal });
    let validated = validateLearningAnalysis(source, providerResult.analysis);
    if (!validated.success) {
      providerResult = await provider.analyze(source, {
        signal,
        correctionIssues: validated.issues,
      });
      validated = validateLearningAnalysis(source, providerResult.analysis);
    }
    if (!validated.success) throw new AnalysisError("analysis_invalid");

    const latencyMs = performance.now() - startedAt;
    await completeLearningAnalysis(auth, {
      sessionId: persistence.sessionId,
      attemptId: persistence.attemptId,
      schemaVersion: LEARNING_ANALYSIS_SCHEMA_VERSION,
      generatorVersion,
      result: validated.analysis,
      latencyMs,
    });

    return {
      analysis: validated.analysis,
      sessionId: persistence.sessionId,
      cached: false,
      generation: {
        model: providerResult.model,
        reasoningEffort: DEFAULT_ANALYSIS_REASONING_EFFORT,
        schemaVersion: LEARNING_ANALYSIS_SCHEMA_VERSION,
        promptVersion: LEARNING_ANALYSIS_PROMPT_VERSION,
        latencyMs: Math.max(0, Math.round(latencyMs)),
        ...(providerResult.usage ? { usage: providerResult.usage } : {}),
      },
    };
  } catch (error) {
    const normalized = error instanceof AnalysisError
      ? error
      : new AnalysisError("invalid_provider_response");
    await failLearningAnalysis(auth, {
      sessionId: persistence.sessionId,
      attemptId: persistence.attemptId,
      latencyMs: performance.now() - startedAt,
      errorCode: normalized.code,
    });
    throw normalized;
  }
}
