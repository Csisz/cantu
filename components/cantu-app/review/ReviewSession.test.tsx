import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReviewSnapshot } from "@/lib/review/types";
import { ReviewSession } from "./ReviewSession";

const persistReviewSubmission = vi.fn();
vi.mock("@/lib/review/client", () => ({
  persistReviewSubmission: (...args: unknown[]) => persistReviewSubmission(...args),
}));

const snapshot: ReviewSnapshot = {
  mode: "scheduled",
  dueCount: 2,
  phrases: [],
  items: [
    {
      phraseId: "10000000-0000-4000-8000-000000000001",
      activityType: "it_to_hu",
      prompt: "Non vedo l'ora",
      promptLanguage: "it",
      answerLabel: "Mit jelent magyarul?",
      options: [{ id: "choice-1", text: "Hány órakor?" }, { id: "choice-2", text: "Alig várom" }],
      correctOptionId: "choice-2",
      correctText: null,
      revealedAnswer: "Alig várom",
      noteHu: "Egyben érdemes megjegyezni.",
      register: "colloquial",
      state: "new",
      nextReviewAt: "2026-08-31T09:00:00Z",
    },
    {
      phraseId: "20000000-0000-4000-8000-000000000002",
      activityType: "hu_to_it",
      prompt: "Hány órakor?",
      promptLanguage: "hu",
      answerLabel: "Írd le olaszul",
      options: [],
      correctOptionId: null,
      correctText: "A che ora?",
      revealedAnswer: "A che ora?",
      noteHu: null,
      register: "neutral",
      state: "learning",
      nextReviewAt: "2026-08-31T09:00:00Z",
    },
  ],
};

describe("ReviewSession", () => {
  beforeEach(() => {
    persistReviewSubmission.mockReset();
    persistReviewSubmission.mockResolvedValue({ status: "success", message: "Mentve.", effectiveRating: "good" });
  });

  it("requires active recall, shows grounded feedback, accepts a rating and completes", async () => {
    const user = userEvent.setup();
    render(<ReviewSession snapshot={snapshot} />);
    expect(screen.getByRole("heading", { name: "2 kifejezés vár rád." })).toBeInTheDocument();
    expect(screen.queryByText("Alig várom")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Kezdem" }));
    await user.click(screen.getByLabelText("Alig várom"));
    await user.click(screen.getByRole("button", { name: "Ellenőrzöm" }));
    expect(screen.getByText("Pontosan.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ment" }));
    expect(persistReviewSubmission).toHaveBeenCalledWith(expect.objectContaining({
      phraseId: snapshot.items[0]!.phraseId,
      answer: "choice-2",
      rating: "good",
    }));

    await user.type(screen.getByLabelText("Írd le olaszul"), "A che ora?");
    await user.click(screen.getByRole("button", { name: "Ellenőrzöm" }));
    await user.click(screen.getByRole("button", { name: "Könnyű volt" }));
    expect(screen.getByRole("heading", { name: "Mai ismétlés kész" })).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  }, 15_000);

  it("automatically schedules an incorrect answer as again before allowing next", async () => {
    persistReviewSubmission.mockResolvedValue({ status: "success", message: "Hamarabb visszatér.", effectiveRating: "again" });
    const user = userEvent.setup();
    render(<ReviewSession snapshot={{ ...snapshot, items: [snapshot.items[1]!], dueCount: 1 }} />);
    await user.click(screen.getByRole("button", { name: "Kezdem" }));
    await user.type(screen.getByLabelText("Írd le olaszul"), "Dove sei?");
    await user.click(screen.getByRole("button", { name: "Ellenőrzöm" }));
    expect(await screen.findByText("Nézzük meg.")).toBeInTheDocument();
    expect(screen.getByText(/A che ora/)).toBeInTheDocument();
    expect(persistReviewSubmission).toHaveBeenCalledWith(expect.objectContaining({
      answer: "Dove sei?",
      manual: false,
    }));
    expect(persistReviewSubmission.mock.calls[0]![0]).not.toHaveProperty("rating");
    await user.click(await screen.findByRole("button", { name: "Befejezem" }));
    expect(screen.getByText("1", { selector: "strong" })).toBeInTheDocument();
  });

  it("renders the calm no-due state", () => {
    render(<ReviewSession snapshot={{ ...snapshot, dueCount: 0, items: [] }} />);
    expect(screen.getByRole("heading", { name: "Mára kész vagy." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tanulok valami újat" })).toHaveAttribute("href", "/app?mode=text");
  });

  it("keeps the answered card usable and offers retry after persistence failure", async () => {
    persistReviewSubmission.mockResolvedValue({ status: "error", message: "Most nem sikerült." });
    const user = userEvent.setup();
    render(<ReviewSession snapshot={{ ...snapshot, items: [snapshot.items[1]!], dueCount: 1 }} />);
    await user.click(screen.getByRole("button", { name: "Kezdem" }));
    await user.type(screen.getByLabelText("Írd le olaszul"), "Dove sei?");
    await user.click(screen.getByRole("button", { name: "Ellenőrzöm" }));
    expect(await screen.findByRole("button", { name: "Mentés újra" })).toBeInTheDocument();
    expect(screen.getByText("Nézzük meg.")).toBeInTheDocument();
  });

  it("starts a requested phrase immediately and marks it as manual practice", async () => {
    const user = userEvent.setup();
    render(<ReviewSession snapshot={{ ...snapshot, mode: "manual", items: [snapshot.items[1]!], dueCount: 0 }} />);
    expect(screen.queryByRole("button", { name: "Kezdem" })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Írd le olaszul"), "A che ora?");
    await user.click(screen.getByRole("button", { name: "Ellenőrzöm" }));
    expect(persistReviewSubmission).toHaveBeenCalledWith(expect.objectContaining({ manual: true }));
    expect(await screen.findByRole("button", { name: "Befejezem" })).toBeInTheDocument();
  });
});
