import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BillingSection } from "./BillingSection";
import type { BillingSnapshot } from "@/lib/billing/types";

vi.mock("./BillingActionButton", () => ({ BillingActionButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }));

const base: BillingSnapshot = {
  plan: "free", active: false, subscriptionStatus: null, cancelAtPeriodEnd: false,
  currentPeriodEnd: null, billingMode: "test", priceLabel: "Tesztár / hó",
  usagePeriod: { startsAt: "2026-09-01T00:00:00.000Z", endsAt: "2026-10-01T00:00:00.000Z" },
  usage: [
    { operation: "transcription", used: 1, limit: 8, remaining: 7 },
    { operation: "analysis", used: 2, limit: 4, remaining: 2 },
    { operation: "pronunciation", used: 0, limit: 8, remaining: 8 },
    { operation: "practice", used: 3, limit: 16, remaining: 13 },
  ],
};

describe("BillingSection", () => {
  it("shows a calm Free usage summary and upgrade entry", () => {
    render(<BillingSection snapshot={base} />);
    expect(screen.getByRole("heading", { name: "Free" })).toBeInTheDocument();
    expect(screen.getByText("2 maradt")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cantu Plus" })).toBeInTheDocument();
    expect(screen.getByText(/ismétlés nem fogyaszt/)).toBeInTheDocument();
  });
  it("shows cancellation and payment-action states without exposing payment details", () => {
    const snapshot = { ...base, plan: "free" as const, subscriptionStatus: "past_due" as const, cancelAtPeriodEnd: true, currentPeriodEnd: "2026-10-01T00:00:00.000Z" };
    render(<BillingSection snapshot={snapshot} />);
    expect(screen.getByRole("alert")).toHaveTextContent("rendezést igényel");
    expect(screen.getByRole("button", { name: "Előfizetés kezelése" })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/card|CVC|invoice/i);
  });
});
