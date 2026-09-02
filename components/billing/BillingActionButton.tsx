"use client";

import { useState } from "react";

export function BillingActionButton({ action, children, className }: { action: "checkout" | "portal"; children: React.ReactNode; className?: string }) {
  const [state, setState] = useState<"idle" | "pending" | "error">("idle");
  async function run() {
    if (state === "pending") return;
    setState("pending");
    try {
      const response = await fetch(`/api/billing/${action}`, {
        method: "POST",
        headers: action === "checkout" ? { "content-type": "application/json" } : undefined,
        body: action === "checkout" ? JSON.stringify({ plan: "cantu_plus" }) : undefined,
      });
      const payload = await response.json() as { url?: string };
      if (!response.ok || !payload.url) throw new Error("billing_action_failed");
      window.location.assign(payload.url);
    } catch {
      setState("error");
    }
  }
  return <div>
    <button className={className} type="button" onClick={run} disabled={state === "pending"}>
      {state === "pending" ? "Egy pillanat…" : children}
    </button>
    {state === "error" ? <p role="alert">A számlázási oldal most nem nyitható meg. Próbáld újra később.</p> : null}
  </div>;
}
