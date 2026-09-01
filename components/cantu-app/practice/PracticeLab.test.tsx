import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PracticeClientResult, PracticeProviderTarget } from "@/lib/practice/types";
import { PracticeLab } from "./PracticeLab";

const startMock = vi.fn();
const respondMock = vi.fn();
vi.mock("@/lib/practice/client", () => ({
  startPracticeScenario: (scenario: string) => startMock(scenario),
  submitPracticeResponse: (token: string, response: string) => respondMock(token, response),
}));

const targets: PracticeProviderTarget[] = [{ referenceId: "target-1", italianChunk: "Non vedo l'ora", meaningHu: "alig várom", noteHu: null }];

function result(overrides: Partial<PracticeClientResult> = {}): PracticeClientResult {
  return {
    scenario: { id: "restaurant", titleHu: "Kávézó / étterem", settingHu: "Rendelés.", partnerRoleHu: "pincér" },
    targets,
    turn: {
      partnerReplyIt: "Cosa desidera ordinare?",
      partnerReplyHuHint: "Mit szeretne rendelni?",
      learnerFeedback: null,
      targetUsage: { targetPhraseId: null, usedSuccessfully: false },
      nextGoalHu: "Válaszolj röviden.",
      scenarioState: "continue",
    },
    turnCount: 0,
    maxTurns: 5,
    stateToken: "signed-state-token-that-is-long-enough-for-the-client",
    reviewBroughtForward: false,
    ...overrides,
  };
}

describe("Real-Life Practice Lab", () => {
  beforeEach(() => {
    startMock.mockReset().mockResolvedValue({ status: "success", data: result() });
    respondMock.mockReset().mockResolvedValue({ status: "success", data: result({
      turnCount: 1,
      turn: {
        partnerReplyIt: "Va bene. Desidera altro?",
        partnerReplyHuHint: null,
        learnerFeedback: { status: "needs_fix", correctedItalian: "Io vado alla stazione.", explanationHu: "Itt ragozott ige kell.", naturalAlternativeIt: "Vado alla stazione." },
        targetUsage: { targetPhraseId: "target-1", usedSuccessfully: false },
        nextGoalHu: "Válaszolj még egyszer.",
        scenarioState: "continue",
      },
    }) });
  });

  it("selects a bounded scenario, exposes a deterministic hint, and gives contextual correction", async () => {
    render(<PracticeLab suggestedTargets={targets} />);
    expect(screen.getAllByRole("button", { pressed: false }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Kezdem a gyakorlást" }));
    await screen.findByText("Cosa desidera ordinare?");
    fireEvent.click(screen.getByRole("button", { name: "Segíts egy kicsit" }));
    expect(screen.getByText("Non vedo l'ora")).toBeVisible();
    fireEvent.change(screen.getByLabelText("A válaszod olaszul"), { target: { value: "Io andare alla stazione." } });
    fireEvent.click(screen.getByRole("button", { name: "Elküldöm" }));
    await screen.findByText("Ezt finomítsuk.");
    expect(screen.getByText("Io vado alla stazione.")).toBeVisible();
    expect(screen.getByText("Vado alla stazione.")).toBeVisible();
    expect(respondMock).toHaveBeenCalledWith(expect.stringContaining("signed-state"), "Io andare alla stazione.");
  });

  it("keeps the response available after provider failure and prevents duplicate submit", async () => {
    respondMock.mockResolvedValueOnce({ status: "error", code: "provider_unavailable", message: "A gyakorlópartner most nem érhető el." });
    render(<PracticeLab suggestedTargets={targets} />);
    fireEvent.click(screen.getByRole("button", { name: "Kezdem a gyakorlást" }));
    await screen.findByText("Cosa desidera ordinare?");
    const textarea = screen.getByLabelText("A válaszod olaszul");
    fireEvent.change(textarea, { target: { value: "Vorrei un caffè." } });
    fireEvent.click(screen.getByRole("button", { name: "Elküldöm" }));
    await screen.findByText("A gyakorlópartner most nem érhető el.");
    expect(textarea).toHaveValue("Vorrei un caffè.");
    expect(respondMock).toHaveBeenCalledTimes(1);
  });
});
