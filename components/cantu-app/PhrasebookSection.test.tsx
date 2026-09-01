import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PhrasebookSnapshot } from "@/lib/review/types";
import { PhrasebookSection } from "./PhrasebookSection";

const refresh = vi.fn();
const deleteSavedPhrase = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/lib/review/client", () => ({
  deleteSavedPhrase: (...args: unknown[]) => deleteSavedPhrase(...args),
}));

const snapshot: PhrasebookSnapshot = {
  status: "ready",
  dueCount: 1,
  items: [{
    id: "10000000-0000-4000-8000-000000000001",
    italianChunk: "Non vedo l'ora",
    meaningHu: "Alig várom",
    noteHu: "Egyben érdemes megjegyezni.",
    register: "colloquial",
    sourceSessionId: null,
    createdAt: "2026-08-30T10:00:00Z",
    review: {
      phraseId: "10000000-0000-4000-8000-000000000001",
      state: "learning",
      nextReviewAt: "2026-08-30T10:00:00Z",
      lastReviewedAt: null,
      reviewCount: 1,
      successCount: 0,
      lapseCount: 1,
      intervalDays: 1,
      difficulty: 2.4,
      lastRating: "again",
      createdAt: "2026-08-30T10:00:00Z",
      updatedAt: "2026-08-30T10:00:00Z",
    },
  }],
};

describe("PhrasebookSection", () => {
  beforeEach(() => {
    refresh.mockReset();
    deleteSavedPhrase.mockReset();
    deleteSavedPhrase.mockResolvedValue({ status: "success", message: "Törölve." });
  });

  it("shows private derived phrase memory, due CTA and manual practice", () => {
    const { container } = render(<PhrasebookSection snapshot={snapshot} />);
    expect(screen.getByRole("heading", { name: "Mentett kifejezéseim" })).toBeInTheDocument();
    expect(screen.getByText("Gyakorlom")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /1 kifejezés vár rád/i })).toHaveAttribute("href", "/app/review");
    expect(screen.getByRole("link", { name: "Gyakorlom most" })).toHaveAttribute("href", `/app/review?phrase=${snapshot.items[0]!.id}`);
    expect(container.textContent).not.toMatch(/teljes forrás|audio|waveform/i);
  });

  it("deletes a phrase only after confirmation and removes it locally", async () => {
    const user = userEvent.setup();
    render(<PhrasebookSection snapshot={snapshot} />);
    await user.click(screen.getByRole("button", { name: "Törlés" }));
    await user.click(screen.getByRole("button", { name: "Igen, törlöm" }));
    expect(deleteSavedPhrase).toHaveBeenCalledWith(snapshot.items[0]!.id);
    expect(screen.queryByText("Non vedo l'ora")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Törölve.");
  });
});
