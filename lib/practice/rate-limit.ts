import { MAX_PRACTICE_CALLS_PER_HOUR } from "./types";

const rateKey = "__cantuPracticeRateLimit" as const;
const replayKey = "__cantuPracticeReplayGuard" as const;
const globalState = globalThis as typeof globalThis & {
  [rateKey]?: Map<string, number[]>;
  [replayKey]?: Map<string, number>;
};

function rateStore() {
  globalState[rateKey] ??= new Map();
  return globalState[rateKey];
}

function replayStore() {
  globalState[replayKey] ??= new Map();
  return globalState[replayKey];
}

export function consumePracticeRateLimit(userId: string, now = new Date()) {
  const boundary = now.getTime() - 60 * 60 * 1_000;
  const recent = (rateStore().get(userId) ?? []).filter((time) => time > boundary);
  if (recent.length >= MAX_PRACTICE_CALLS_PER_HOUR) return false;
  recent.push(now.getTime());
  rateStore().set(userId, recent);
  return true;
}

export function consumePracticeNonce(nonce: string, now = new Date()) {
  const store = replayStore();
  const boundary = now.getTime() - 60 * 60 * 1_000;
  for (const [key, consumedAt] of store) if (consumedAt <= boundary) store.delete(key);
  if (store.has(nonce)) return false;
  store.set(nonce, now.getTime());
  return true;
}

export function releasePracticeNonce(nonce: string) {
  replayStore().delete(nonce);
}

export function resetPracticeGuardsForTests() {
  rateStore().clear();
  replayStore().clear();
}
