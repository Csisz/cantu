import { z } from "zod";
import { PRACTICE_SCENARIO_IDS, type PracticeScenario, type PracticeScenarioId } from "./scenarios";

export const MAX_PRACTICE_TURNS = 5;
export const MIN_PRACTICE_TURNS = 3;
export const MAX_PRACTICE_TARGETS = 2;
export const MAX_PRACTICE_RESPONSE_CHARACTERS = 600;
export const MAX_PRACTICE_CALLS_PER_HOUR = 24;
export const PRACTICE_STATE_TTL_MS = 30 * 60 * 1_000;

export const practiceFeedbackStatusSchema = z.enum(["good", "understandable", "needs_fix"]);
export type PracticeFeedbackStatus = z.infer<typeof practiceFeedbackStatusSchema>;

const nullableBoundedText = (max: number) => z.string().trim().min(1).max(max).nullable();

export const practiceTurnSchema = z.object({
  partnerReplyIt: z.string().trim().min(1).max(500),
  partnerReplyHuHint: nullableBoundedText(500),
  learnerFeedback: z.object({
    status: practiceFeedbackStatusSchema,
    correctedItalian: nullableBoundedText(500),
    explanationHu: nullableBoundedText(700),
    naturalAlternativeIt: nullableBoundedText(500),
  }).strict().nullable(),
  targetUsage: z.object({
    targetPhraseId: z.string().trim().regex(/^target-[1-3]$/).nullable(),
    usedSuccessfully: z.boolean(),
  }).strict(),
  nextGoalHu: nullableBoundedText(500),
  scenarioState: z.enum(["continue", "complete"]),
}).strict();

export type PracticeTurn = z.infer<typeof practiceTurnSchema>;

export const practiceTurnJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["partnerReplyIt", "partnerReplyHuHint", "learnerFeedback", "targetUsage", "nextGoalHu", "scenarioState"],
  properties: {
    partnerReplyIt: { type: "string", minLength: 1, maxLength: 500 },
    partnerReplyHuHint: { type: ["string", "null"], minLength: 1, maxLength: 500 },
    learnerFeedback: {
      anyOf: [
        {
          type: "object",
          additionalProperties: false,
          required: ["status", "correctedItalian", "explanationHu", "naturalAlternativeIt"],
          properties: {
            status: { type: "string", enum: ["good", "understandable", "needs_fix"] },
            correctedItalian: { type: ["string", "null"], minLength: 1, maxLength: 500 },
            explanationHu: { type: ["string", "null"], minLength: 1, maxLength: 700 },
            naturalAlternativeIt: { type: ["string", "null"], minLength: 1, maxLength: 500 },
          },
        },
        { type: "null" },
      ],
    },
    targetUsage: {
      type: "object",
      additionalProperties: false,
      required: ["targetPhraseId", "usedSuccessfully"],
      properties: {
        targetPhraseId: { type: ["string", "null"], pattern: "^target-[1-3]$" },
        usedSuccessfully: { type: "boolean" },
      },
    },
    nextGoalHu: { type: ["string", "null"], minLength: 1, maxLength: 500 },
    scenarioState: { type: "string", enum: ["continue", "complete"] },
  },
} as const;

export type PracticeTarget = {
  phraseId: string;
  referenceId: `target-${number}`;
  italianChunk: string;
  meaningHu: string;
  noteHu: string | null;
};

export type PracticeProviderTarget = Omit<PracticeTarget, "phraseId">;

export type PracticeStartInput = {
  scenario: PracticeScenario;
  targets: PracticeProviderTarget[];
};

export type PracticeResponseInput = PracticeStartInput & {
  turnNumber: number;
  partnerReplyIt: string;
  currentGoalHu: string | null;
  learnerResponse: string;
};

export const practiceStartRequestSchema = z.object({
  action: z.literal("start"),
  scenarioId: z.enum(PRACTICE_SCENARIO_IDS),
}).strict();

export const practiceRespondRequestSchema = z.object({
  action: z.literal("respond"),
  stateToken: z.string().min(40).max(8_000),
  learnerResponse: z.string().trim().min(1).max(MAX_PRACTICE_RESPONSE_CHARACTERS),
}).strict();

export const practiceRequestSchema = z.discriminatedUnion("action", [
  practiceStartRequestSchema,
  practiceRespondRequestSchema,
]);

export type PracticeClientResult = {
  scenario: { id: PracticeScenarioId; titleHu: string; settingHu: string; partnerRoleHu: string };
  targets: Array<Omit<PracticeTarget, "phraseId">>;
  turn: PracticeTurn;
  turnCount: number;
  maxTurns: number;
  stateToken: string | null;
  reviewBroughtForward: boolean;
};
