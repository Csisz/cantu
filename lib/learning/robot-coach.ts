import type { LessonStage } from "./player";

export const robotCoachStates = [
  "welcome",
  "source",
  "shortcut",
  "explain",
  "encourage",
  "challenge",
  "listen",
  "retry",
  "success",
  "completion",
] as const;

export type RobotCoachState = (typeof robotCoachStates)[number];

export type RobotCoachAsset = {
  staticSrc: string;
  animatedSrc: string | null;
  loop: boolean;
};

const asset = (state: RobotCoachState, loop: boolean): RobotCoachAsset => ({
  staticSrc: "/robot.png",
  animatedSrc: `/robot/coach-${state}.mp4`,
  loop,
});

export const ROBOT_COACH_ASSETS: Record<RobotCoachState, RobotCoachAsset> = {
  welcome: asset("welcome", true),
  source: asset("source", false),
  shortcut: asset("shortcut", false),
  explain: asset("explain", false),
  encourage: asset("encourage", false),
  challenge: asset("challenge", false),
  listen: asset("listen", true),
  retry: asset("retry", false),
  success: asset("success", false),
  completion: asset("completion", false),
};

export const ROBOT_COACH_COPY: Record<RobotCoachState, string> = {
  welcome: "Kezdjük azzal, amit tényleg hoztál.",
  source: "Nézzük meg, mi van ebben.",
  shortcut: "Először vigyük el belőle a lényeget.",
  explain: "Egy apró szerkezet sokat segít megérteni.",
  encourage: "Ezt már tudod használni egy új helyzetben is.",
  challenge: "Most nézzük meg, megmaradt-e aktívan.",
  listen: "Most mondd ki te.",
  retry: "Majdnem. Figyeld meg ezt a részt.",
  success: "Pontosan — ez már aktív tudás.",
  completion: "Ebből már van valami, amit magaddal vihetsz.",
};

export const ROBOT_STATE_BY_STAGE: Record<LessonStage, RobotCoachState | null> = {
  meaning: null,
  chunks: "shortcut",
  grammar: "explain",
  say: "listen",
  recall: "challenge",
  completed: "completion",
};

export function robotStateForRecall(correct: boolean): RobotCoachState {
  return correct ? "success" : "retry";
}
