import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthContext } from "@/lib/auth/types";
import { AccountSection } from "./AccountSection";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/app/actions", () => ({ signOutAction: vi.fn() }));
vi.mock("@/app/app/learning-actions", () => ({ deleteLearningSessionAction: vi.fn() }));

const auth: AuthContext = {
  status: "authenticated",
  configured: true,
  user: { id: "10000000-0000-4000-8000-000000000001", email: "a@cantu.test", displayName: "Ada" },
};

describe("AccountSection generalized history", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders a generalized empty state without active song terminology", () => {
    const { container } = render(<AccountSection auth={auth} history={{ status: "ready", items: [] }} />);
    expect(screen.getByRole("heading", { name: "Saját tanulásaim" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Még nincs elmentett tanulásod." })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/dal|előadó|dalszöveg/i);
  });

  it("shows metadata but never a source excerpt, and offers confirmed deletion", () => {
    const { container } = render(
      <AccountSection
        auth={auth}
        history={{
          status: "ready",
          items: [{
            id: "30000000-0000-4000-8000-000000000003",
            inputType: "text",
            sourceStatus: "ready",
            sourceDurationMs: null,
            sourceCharCount: 27,
            createdAt: "2026-08-27T12:00:00Z",
            progress: { stage: "new", percentComplete: 0, lastOpenedAt: null },
          }],
        }}
      />,
    );
    expect(screen.getByText("Szöveg")).toBeInTheDocument();
    expect(screen.getByText(/27 karakter/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Folytatom" })).toHaveAttribute(
      "href",
      "/app/learning/30000000-0000-4000-8000-000000000003",
    );
    expect(container.textContent).not.toContain("Questo contenuto è privato");
    fireEvent.click(screen.getByRole("button", { name: "Törlés" }));
    expect(screen.getByText("Biztosan törlöd?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Igen, törlöm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mégse" })).toBeInTheDocument();
  });
});
