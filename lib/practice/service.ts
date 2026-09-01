import "server-only";

import type { AuthContext } from "@/lib/auth/types";
import { bringOwnedPhraseReviewForward, loadOwnedPhrases } from "@/lib/data/review";
import type { ConversationPracticeProvider, PracticeProviderOptions } from "@/lib/providers/practice/types";
import { PracticeError } from "@/lib/providers/practice/types";
import { getPracticeScenario } from "./scenarios";
import { applyPracticeOutcome } from "./adaptation";
import { consumePracticeNonce, consumePracticeRateLimit, releasePracticeNonce } from "./rate-limit";
import { createPracticeStateToken, readPracticeStateToken } from "./state-token";
import { selectPracticeTargets } from "./targets";
import {
  MAX_PRACTICE_TURNS,
  MIN_PRACTICE_TURNS,
  practiceTurnSchema,
  type PracticeClientResult,
  type PracticeProviderTarget,
  type PracticeResponseInput,
  type PracticeStartInput,
  type PracticeTarget,
  type PracticeTurn,
} from "./types";

function requireUser(auth: AuthContext) {
  if (auth.status !== "authenticated") throw new PracticeError("unauthenticated");
  return auth.user;
}

function providerTargets(targets: PracticeTarget[]): PracticeProviderTarget[] {
  return targets.map(({ referenceId, italianChunk, meaningHu, noteHu }) => ({
    referenceId,
    italianChunk,
    meaningHu,
    noteHu,
  }));
}

export function validatePracticeTurn(
  candidate: unknown,
  mode: "start" | "respond",
  targets: PracticeTarget[],
  turnNumber: number,
) {
  const parsed = practiceTurnSchema.safeParse(candidate);
  if (!parsed.success) return { success: false as const, issues: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) };
  const turn = parsed.data;
  const issues: string[] = [];
  const allowedTargetIds = new Set<string>(targets.map((target) => target.referenceId));
  if (turn.targetUsage.targetPhraseId && !allowedTargetIds.has(turn.targetUsage.targetPhraseId)) {
    issues.push("targetUsage.targetPhraseId must reference a supplied private target");
  }
  if (turn.targetUsage.usedSuccessfully && !turn.targetUsage.targetPhraseId) {
    issues.push("successful target use requires a target reference");
  }
  if (mode === "start") {
    if (turn.learnerFeedback !== null) issues.push("scenario start must not evaluate a learner response");
    if (turn.targetUsage.targetPhraseId !== null || turn.targetUsage.usedSuccessfully) issues.push("scenario start must not claim target usage");
    if (turn.scenarioState !== "continue") issues.push("scenario start must continue");
  } else {
    if (!turn.learnerFeedback) issues.push("learner response requires transparent feedback");
    if (turn.scenarioState === "complete" && turnNumber < MIN_PRACTICE_TURNS) {
      issues.push(`scenario cannot complete before learner turn ${MIN_PRACTICE_TURNS}`);
    }
    if (turn.learnerFeedback?.status === "needs_fix") {
      if (!turn.learnerFeedback.correctedItalian || !turn.learnerFeedback.explanationHu) {
        issues.push("needs_fix requires a correction and concise Hungarian explanation");
      }
      if (turn.targetUsage.usedSuccessfully) issues.push("needs_fix cannot claim successful target use");
    }
    if (turn.learnerFeedback?.status === "good" && turn.learnerFeedback.correctedItalian) {
      issues.push("good answers must not be rewritten as errors");
    }
  }
  return issues.length ? { success: false as const, issues } : { success: true as const, turn };
}

async function callWithOneCorrection(
  call: (options?: PracticeProviderOptions) => Promise<unknown>,
  mode: "start" | "respond",
  targets: PracticeTarget[],
  turnNumber: number,
) {
  let candidate = await call();
  let checked = validatePracticeTurn(candidate, mode, targets, turnNumber);
  if (!checked.success) {
    candidate = await call({ correctionIssues: checked.issues });
    checked = validatePracticeTurn(candidate, mode, targets, turnNumber);
  }
  if (!checked.success) throw new PracticeError("practice_invalid");
  return checked.turn;
}

function clientTargets(targets: PracticeTarget[]) {
  return targets.map(({ referenceId, italianChunk, meaningHu, noteHu }) => ({
    referenceId,
    italianChunk,
    meaningHu,
    noteHu,
  }));
}

function result(
  scenario: NonNullable<ReturnType<typeof getPracticeScenario>>,
  targets: PracticeTarget[],
  turn: PracticeTurn,
  turnCount: number,
  stateToken: string | null,
  reviewBroughtForward = false,
): PracticeClientResult {
  return {
    scenario: { id: scenario.id, titleHu: scenario.titleHu, settingHu: scenario.settingHu, partnerRoleHu: scenario.partnerRoleHu },
    targets: clientTargets(targets),
    turn,
    turnCount,
    maxTurns: MAX_PRACTICE_TURNS,
    stateToken,
    reviewBroughtForward,
  };
}

export async function startConversationPractice(
  auth: AuthContext,
  scenarioId: string,
  provider: ConversationPracticeProvider,
  secret: string,
  signal?: AbortSignal,
) {
  const user = requireUser(auth);
  if (!consumePracticeRateLimit(user.id)) throw new PracticeError("rate_limited");
  const scenario = getPracticeScenario(scenarioId);
  if (!scenario) throw new PracticeError("invalid_request");
  const targets = selectPracticeTargets(await loadOwnedPhrases(auth));
  if (!targets.length) throw new PracticeError("no_saved_phrases");
  const input: PracticeStartInput = { scenario, targets: providerTargets(targets) };
  const turn = await callWithOneCorrection(
    (options) => provider.startScenario(input, { ...options, signal }),
    "start",
    targets,
    0,
  );
  const stateToken = createPracticeStateToken({
    userId: user.id,
    scenarioId: scenario.id,
    targetPhraseIds: targets.map((target) => target.phraseId),
    turnCount: 0,
    partnerReplyIt: turn.partnerReplyIt,
    nextGoalHu: turn.nextGoalHu,
    struggleCounts: Object.fromEntries(targets.map((target) => [target.phraseId, 0])),
    signaledPhraseIds: [],
  }, secret);
  return result(scenario, targets, turn, 0, stateToken);
}

export async function respondToConversationPractice(
  auth: AuthContext,
  stateToken: string,
  learnerResponse: string,
  provider: ConversationPracticeProvider,
  secret: string,
  signal?: AbortSignal,
) {
  const user = requireUser(auth);
  const state = readPracticeStateToken(stateToken, secret);
  if (!state || state.userId !== user.id) throw new PracticeError("session_invalid");
  if (state.turnCount >= MAX_PRACTICE_TURNS) throw new PracticeError("turn_limit_reached");
  if (!consumePracticeNonce(state.nonce)) throw new PracticeError("duplicate_request");
  if (!consumePracticeRateLimit(user.id)) {
    releasePracticeNonce(state.nonce);
    throw new PracticeError("rate_limited");
  }

  try {
    const scenario = getPracticeScenario(state.scenarioId);
    if (!scenario) throw new PracticeError("session_invalid");
    const owned = await loadOwnedPhrases(auth);
    const selected = state.targetPhraseIds.map((id) => owned.find((phrase) => phrase.id === id));
    if (selected.some((phrase) => !phrase)) throw new PracticeError("target_not_found");
    const targets: PracticeTarget[] = selected.map((phrase, index) => ({
      phraseId: phrase!.id,
      referenceId: `target-${index + 1}`,
      italianChunk: phrase!.italianChunk,
      meaningHu: phrase!.meaningHu,
      noteHu: phrase!.noteHu,
    }));
    const turnNumber = state.turnCount + 1;
    const input: PracticeResponseInput = {
      scenario,
      targets: providerTargets(targets),
      turnNumber,
      partnerReplyIt: state.partnerReplyIt,
      currentGoalHu: state.nextGoalHu,
      learnerResponse,
    };
    let turn = await callWithOneCorrection(
      (options) => provider.respond(input, { ...options, signal }),
      "respond",
      targets,
      turnNumber,
    );
    if (turnNumber >= MAX_PRACTICE_TURNS && turn.scenarioState !== "complete") {
      turn = { ...turn, scenarioState: "complete", nextGoalHu: null };
    }

    const target = turn.targetUsage.targetPhraseId
      ? targets.find((item) => item.referenceId === turn.targetUsage.targetPhraseId)
      : null;
    const adaptation = applyPracticeOutcome(
      state.struggleCounts,
      state.signaledPhraseIds,
      target?.phraseId ?? null,
      turn.learnerFeedback?.status ?? null,
    );
    const { struggleCounts, signaledPhraseIds } = adaptation;
    let reviewBroughtForward = false;
    if (adaptation.signalPhraseId) {
      reviewBroughtForward = await bringOwnedPhraseReviewForward(auth, adaptation.signalPhraseId);
    }

    const nextToken = turn.scenarioState === "continue"
      ? createPracticeStateToken({
          userId: user.id,
          scenarioId: scenario.id,
          targetPhraseIds: targets.map((item) => item.phraseId),
          turnCount: turnNumber,
          partnerReplyIt: turn.partnerReplyIt,
          nextGoalHu: turn.nextGoalHu,
          struggleCounts,
          signaledPhraseIds,
        }, secret)
      : null;
    return result(scenario, targets, turn, turnNumber, nextToken, reviewBroughtForward);
  } catch (error) {
    releasePracticeNonce(state.nonce);
    throw error;
  }
}
