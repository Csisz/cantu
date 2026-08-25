import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MOCK_RECOGNITION_DELAY_MS } from "@/lib/recognition/mock";
import { SongRecognitionFlow } from "./SongRecognitionFlow";

async function advanceMockStep() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(MOCK_RECOGNITION_DELAY_MS);
  });
}

describe("SongRecognitionFlow", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("renders Listen entry and progresses through listening and identifying without auto-confirming", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<SongRecognitionFlow initialMode="listen" />);

    expect(screen.getByRole("heading", { name: /Játssz le kb. 10 másodpercet/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Mock hallgatás indítása/i }));
    expect(screen.getByRole("heading", { name: "Figyelek…" })).toBeInTheDocument();

    await advanceMockStep();
    expect(screen.getByRole("heading", { name: "Megpróbálom felismerni…" })).toBeInTheDocument();

    await advanceMockStep();
    expect(screen.getByRole("heading", { name: /Szerintem ezt a dalt hallottam/i })).toBeInTheDocument();
    expect(screen.getByText("Sotto le stelle")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Dal megerősítve" })).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("confirms only after the explicit primary action", async () => {
    render(<SongRecognitionFlow initialMode="listen" />);
    fireEvent.click(screen.getByRole("button", { name: /Mock hallgatás indítása/i }));
    await advanceMockStep();
    await advanceMockStep();
    fireEvent.click(screen.getByRole("button", { name: "Igen, ez az" }));
    expect(screen.getByRole("heading", { name: "Dal megerősítve" })).toBeInTheDocument();
    expect(screen.getByText(/A dal elfogadásáig tart/i)).toBeInTheDocument();
  });

  it("enters the rejected recovery state and can retry", async () => {
    render(<SongRecognitionFlow initialMode="listen" />);
    fireEvent.click(screen.getByRole("button", { name: /Mock hallgatás indítása/i }));
    await advanceMockStep();
    await advanceMockStep();
    fireEvent.click(screen.getByRole("button", { name: "Nem ez" }));
    expect(screen.getByRole("heading", { name: "Nem ez a dal." })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Újra meghallgatom" }));
    expect(screen.getByRole("heading", { name: /Játssz le kb. 10 másodpercet/i })).toBeInTheDocument();
  });

  it("renders the reusable no-match state with every recovery route", () => {
    render(<SongRecognitionFlow initialMode="listen" />);
    fireEvent.click(screen.getByRole("button", { name: /Nincs találat/i }));
    expect(screen.getByRole("heading", { name: "Most nem sikerült felismerni." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Újra meghallgatom" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Feltöltöm inkább" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keresés kézzel" })).toBeInTheDocument();
  });

  it("creates a local candidate from manual title and artist", () => {
    render(<SongRecognitionFlow initialMode="listen" />);
    fireEvent.click(screen.getByRole("button", { name: "Keresés kézzel" }));
    fireEvent.change(screen.getByLabelText("Dal címe"), { target: { value: "Volare" } });
    fireEvent.change(screen.getByLabelText("Előadó"), { target: { value: "Domenico Modugno" } });
    fireEvent.click(screen.getByRole("button", { name: "Jelölt létrehozása" }));
    expect(screen.getByText("Volare")).toBeInTheDocument();
    expect(screen.getByText("Domenico Modugno")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Igen, ez az" })).toBeInTheDocument();
  });

  it("keeps an Upload selection local and converges on the same candidate flow", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<SongRecognitionFlow initialMode="upload" />);

    expect(screen.getByRole("heading", { name: /Válassz egy dalt erről az eszközről/i })).toBeInTheDocument();
    const file = new File(["mock audio bytes"], "italiano.mp3", { type: "audio/mpeg" });
    fireEvent.change(screen.getByLabelText("Hangfájl kiválasztása"), {
      target: { files: [file] },
    });
    expect(screen.getByText("italiano.mp3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mock felismerés indítása" }));
    expect(screen.getByRole("heading", { name: "Megpróbálom felismerni…" })).toBeInTheDocument();
    await advanceMockStep();
    expect(screen.getByRole("button", { name: "Igen, ez az" })).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
