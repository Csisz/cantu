import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { MAX_PRACTICE_TURNS, PRACTICE_STATE_TTL_MS } from "./types";
import { PRACTICE_SCENARIO_IDS } from "./scenarios";

const practiceStateSchema = z.object({
  version: z.literal(1),
  nonce: z.string().uuid(),
  userId: z.string().uuid(),
  scenarioId: z.enum(PRACTICE_SCENARIO_IDS),
  targetPhraseIds: z.array(z.string().uuid()).min(1).max(2),
  turnCount: z.number().int().min(0).max(MAX_PRACTICE_TURNS),
  partnerReplyIt: z.string().min(1).max(500),
  nextGoalHu: z.string().min(1).max(500).nullable(),
  struggleCounts: z.record(z.string().uuid(), z.number().int().min(0).max(MAX_PRACTICE_TURNS)),
  signaledPhraseIds: z.array(z.string().uuid()).max(2),
  expiresAt: z.number().int().positive(),
}).strict();

export type PracticeState = z.infer<typeof practiceStateSchema>;

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createPracticeStateToken(
  state: Omit<PracticeState, "version" | "nonce" | "expiresAt">,
  secret: string,
  now = new Date(),
) {
  const payload = Buffer.from(JSON.stringify({
    ...state,
    version: 1,
    nonce: randomUUID(),
    expiresAt: now.getTime() + PRACTICE_STATE_TTL_MS,
  }), "utf8").toString("base64url");
  return `${payload}.${signature(payload, secret)}`;
}

export function readPracticeStateToken(token: string, secret: string, now = new Date()) {
  const [payload, receivedSignature, extra] = token.split(".");
  if (!payload || !receivedSignature || extra) return null;
  const expected = signature(payload, secret);
  const receivedBuffer = Buffer.from(receivedSignature);
  const expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) return null;
  try {
    const parsed = practiceStateSchema.safeParse(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")));
    if (!parsed.success || parsed.data.expiresAt <= now.getTime()) return null;
    return parsed.data;
  } catch {
    return null;
  }
}
