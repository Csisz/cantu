import { describe, expect, it } from "vitest";
import {
  ROBOT_COACH_ASSETS,
  ROBOT_STATE_BY_STAGE,
  robotCoachStates,
  robotStateForRecall,
} from "./robot-coach";

describe("Robot Coach domain mapping", () => {
  it("maps only purposeful learning transitions to coach states", () => {
    expect(ROBOT_STATE_BY_STAGE.meaning).toBeNull();
    expect(ROBOT_STATE_BY_STAGE.say).toBe("listen");
    expect(ROBOT_STATE_BY_STAGE.completed).toBe("completion");
    expect(robotStateForRecall(false)).toBe("retry");
    expect(robotStateForRecall(true)).toBe("success");
  });

  it("maps every state to the build-time animation contract and static fallback", () => {
    for (const state of robotCoachStates) {
      expect(ROBOT_COACH_ASSETS[state].staticSrc).toBe("/robot.png");
      expect(ROBOT_COACH_ASSETS[state].animatedSrc).toBe(`/robot/coach-${state}.mp4`);
    }
    expect(ROBOT_COACH_ASSETS.completion.loop).toBe(false);
    expect(ROBOT_COACH_ASSETS.listen.loop).toBe(true);
  });
});
