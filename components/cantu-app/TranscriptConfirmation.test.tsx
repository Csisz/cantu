import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TranscriptConfirmation } from "./TranscriptConfirmation";

describe("TranscriptConfirmation", () => {
  it("surfaces non-Italian provider metadata without auto-confirming", () => {
    const onConfirm = vi.fn();
    render(
      <TranscriptConfirmation
        transcript={{ text: "Good morning.", detectedLanguage: "en" }}
        busy={false}
        onConfirm={onConfirm}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/valószínűleg nem olasz/i);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("requires non-empty corrected text and enforces the 2,000-character control limit", () => {
    const onConfirm = vi.fn();
    render(
      <TranscriptConfirmation
        transcript={{ text: "Ci vediamo." }}
        busy={false}
        onConfirm={onConfirm}
        onRetry={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Javítom" }));
    const editor = screen.getByLabelText("Javított olasz szöveg");
    expect(editor).toHaveAttribute("maxlength", "2000");
    fireEvent.change(editor, { target: { value: "   " } });
    expect(screen.getByRole("button", { name: "Javítás megerősítése" })).toBeDisabled();
  });
});
