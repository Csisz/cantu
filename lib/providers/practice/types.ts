import type { PracticeResponseInput, PracticeStartInput, PracticeTurn } from "@/lib/practice/types";

export type PracticeProviderOptions = {
  correctionIssues?: readonly string[];
  signal?: AbortSignal;
};

export interface ConversationPracticeProvider {
  readonly name: string;
  readonly model: string;
  startScenario(input: PracticeStartInput, options?: PracticeProviderOptions): Promise<unknown>;
  respond(input: PracticeResponseInput, options?: PracticeProviderOptions): Promise<unknown>;
}

export type PracticeErrorCode =
  | "unauthenticated"
  | "invalid_request"
  | "no_saved_phrases"
  | "session_invalid"
  | "session_expired"
  | "target_not_found"
  | "turn_limit_reached"
  | "duplicate_request"
  | "not_configured"
  | "rate_limited"
  | "provider_unavailable"
  | "provider_timeout"
  | "invalid_provider_response"
  | "practice_invalid";

export class PracticeError extends Error {
  constructor(public readonly code: PracticeErrorCode, message = code) {
    super(message);
    this.name = "PracticeError";
  }
}

export type ValidatedPracticeTurn = PracticeTurn;
