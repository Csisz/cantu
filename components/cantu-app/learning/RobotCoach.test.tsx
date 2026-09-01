import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RobotCoach } from "./RobotCoach";

describe("animated Robot Coach", () => {
  it("uses the mapped muted inline video and falls back on media error", async () => {
    const { container } = render(<RobotCoach state="challenge" />);
    await waitFor(() => expect(container.querySelector("video")).not.toBeNull());
    const video = container.querySelector("video")!;
    expect(video).toHaveAttribute("src", "/robot/coach-challenge.mp4");
    expect(video.muted).toBe(true);
    expect(video).toHaveAttribute("playsinline");
    fireEvent.error(video);
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img")).not.toBeNull();
  });

  it("uses the static image when reduced motion is requested", async () => {
    vi.mocked(window.matchMedia).mockImplementationOnce((query: string) => ({
      matches: query.includes("prefers-reduced-motion"), media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    }));
    const { container } = render(<RobotCoach state="success" />);
    await waitFor(() => expect(container.querySelector("img")).not.toBeNull());
    expect(container.querySelector("video")).toBeNull();
  });
});
