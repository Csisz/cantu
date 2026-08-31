import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PronunciationFeedbackError } from "@/lib/pronunciation/types";
import { ShadowingPractice } from "./ShadowingPractice";

const { requestFeedback } = vi.hoisted(() => ({ requestFeedback: vi.fn() }));

vi.mock("@/lib/pronunciation/client", () => ({
  requestPronunciationFeedback: (input: unknown, signal: AbortSignal) => requestFeedback(input, signal),
}));

class RecorderStub extends EventTarget {
  static isTypeSupported(type: string) { return type.startsWith("audio/webm"); }
  state: RecordingState = "inactive";
  mimeType = "audio/webm";
  start() { this.state = "recording"; }
  stop() {
    if (this.state === "inactive") return;
    this.state = "inactive";
    const event = new Event("dataavailable");
    Object.defineProperty(event, "data", {
      value: new Blob([new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 1])], { type: this.mimeType }),
    });
    this.dispatchEvent(event);
    this.dispatchEvent(new Event("stop"));
  }
}

const feedback = {
  understoodText: "Non vedo l'ora.",
  targetMatch: {
    matchedTokens: ["non", "vedo", "l'ora"],
    missingTokens: [],
    extraTokens: [],
    orderCorrect: true,
  },
  timing: { learnerDurationMs: 1_800 },
  observations: [{ code: "all_words_recognized", messageHu: "Minden szót elcsíptem." }],
};

const sessionId = "10000000-0000-4000-8000-000000000001";

describe("ShadowingPractice", () => {
  const stopTrack = vi.fn();
  const getUserMedia = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    requestFeedback.mockResolvedValue(feedback);
    getUserMedia.mockResolvedValue({ getTracks: () => [{ stop: stopTrack, addEventListener: vi.fn() }] });
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
    Object.defineProperty(window, "MediaRecorder", { configurable: true, value: RecorderStub });
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:learner") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  });

  async function record() {
    fireEvent.click(screen.getByRole("button", { name: "Felveszem" }));
    await screen.findByText("Felvétel");
    fireEvent.click(screen.getByRole("button", { name: "Leállítom" }));
    await screen.findByText("A saját felvételed elkészült.");
  }

  it("records, replays, requests explicit feedback, and sends no arbitrary target", async () => {
    render(<ShadowingPractice sessionId={sessionId} chunkIndex={0} authenticated onNext={vi.fn()} />);
    expect(getUserMedia).not.toHaveBeenCalled();
    await record();
    expect(screen.getByLabelText("Saját gyakorlófelvételem visszahallgatása")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Nézzük meg" }));
    const feedbackHeading = await screen.findByRole("heading", { name: "Ezt értettem:" });
    await waitFor(() => expect(feedbackHeading).toHaveFocus());
    expect(screen.getByText("Non vedo l'ora.")).toBeVisible();
    expect(screen.getByText("Minden szót elcsíptem.")).toBeVisible();
    const payload = requestFeedback.mock.calls[0]?.[0];
    expect(payload).toMatchObject({ sessionId, chunkIndex: 0 });
    expect(payload).not.toHaveProperty("targetText");
    expect(payload).not.toHaveProperty("sourceText");
    expect(payload.recording).toBeInstanceOf(Blob);
  });

  it("shows evidence-based missing-token feedback and supports a fresh retry", async () => {
    requestFeedback.mockResolvedValueOnce({
      ...feedback,
      understoodText: "Non vedo",
      targetMatch: { matchedTokens: ["non", "vedo"], missingTokens: ["l'ora"], extraTokens: [], orderCorrect: true },
      observations: [{ code: "some_words_missing", messageHu: "Ezt a részt most nem értettem biztosan: l'ora. Próbáld újra egy kicsit lassabban." }],
    });
    render(<ShadowingPractice sessionId={sessionId} chunkIndex={0} authenticated onNext={vi.fn()} />);
    await record();
    fireEvent.click(screen.getByRole("button", { name: "Nézzük meg" }));
    expect(await screen.findByText(/nem értettem biztosan: l'ora/i)).toBeVisible();
    expect(screen.queryByText(/fonéma.*rossz|akcentus.*rossz/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Újra megpróbálom" }));
    const recordButton = screen.getByRole("button", { name: "Felveszem" });
    expect(recordButton).toBeVisible();
    await waitFor(() => expect(recordButton).toHaveFocus());
  });

  it("retains local replay after provider failure and allows skip", async () => {
    const onNext = vi.fn();
    requestFeedback.mockRejectedValueOnce(new PronunciationFeedbackError("feedback_failed"));
    render(<ShadowingPractice sessionId={sessionId} chunkIndex={0} authenticated onNext={onNext} />);
    await record();
    fireEvent.click(screen.getByRole("button", { name: "Nézzük meg" }));
    expect(await screen.findByRole("heading", { name: "A visszajelzés megakadt" })).toBeVisible();
    expect(screen.getByLabelText("Saját gyakorlófelvételem visszahallgatása")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Most kihagyom" }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("keeps local recording available while unauthenticated feedback reaches auth boundary", async () => {
    render(<ShadowingPractice sessionId={sessionId} chunkIndex={0} authenticated={false} onNext={vi.fn()} />);
    await record();
    fireEvent.click(screen.getByRole("button", { name: "Nézzük meg" }));
    expect(await screen.findByRole("heading", { name: "A visszajelzéshez jelentkezz be" })).toBeVisible();
    expect(requestFeedback).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Saját gyakorlófelvételem visszahallgatása")).toBeVisible();
  });

  it("handles permission denial without trapping the learner", async () => {
    const onNext = vi.fn();
    getUserMedia.mockRejectedValueOnce(new DOMException("denied", "NotAllowedError"));
    render(<ShadowingPractice sessionId={sessionId} chunkIndex={0} authenticated onNext={onNext} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Felveszem" })); });
    expect(await screen.findByText(/mikrofonengedélyt nem kaptuk meg/i)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Most kihagyom" }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
