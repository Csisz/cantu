import type { LearningAnalysis, VerifiedLearningSource } from "@/lib/analysis/schema";

export type AnalysisUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type AnalysisProviderResult = {
  analysis: unknown;
  model: string;
  usage?: AnalysisUsage;
};

export type AnalysisProviderOptions = {
  correctionIssues?: readonly string[];
  signal?: AbortSignal;
};

export interface LanguageAnalysisProvider {
  readonly name: string;
  readonly model: string;
  analyze(
    input: VerifiedLearningSource,
    options?: AnalysisProviderOptions,
  ): Promise<AnalysisProviderResult>;
}

export type AnalysisErrorCode =
  | "invalid_source"
  | "source_not_verified"
  | "unauthenticated"
  | "not_configured"
  | "rate_limited"
  | "quota_exceeded"
  | "provider_unavailable"
  | "provider_timeout"
  | "invalid_provider_response"
  | "analysis_invalid"
  | "unsupported_language"
  | "session_not_found"
  | "source_context_mismatch"
  | "analysis_in_progress";

export class AnalysisError extends Error {
  constructor(
    public readonly code: AnalysisErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = "AnalysisError";
  }
}

export type CompletedLearningAnalysis = {
  analysis: LearningAnalysis;
  sessionId: string;
  cached: boolean;
  generation: {
    model: string;
    reasoningEffort: "low";
    schemaVersion: string;
    promptVersion: string;
    latencyMs: number;
    usage?: AnalysisUsage;
  };
};
