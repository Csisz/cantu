import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { evaluateReadiness } from "./readiness-core.mjs";
describe("public beta readiness", () => {
  const root = process.cwd();
  it("recognizes checked-in policy and fallback assets", () => { const results = evaluateReadiness({ root, env: {}, production: false }); expect(results.filter((item) => item.message.includes("is missing"))).toEqual([]); });
  it("blocks unresolved production contact, mocks and secrets", () => { const results = evaluateReadiness({ root, production: true, env: { CANTU_E2E_AUTH_MOCK: "1", PUBLIC_CONTACT_EMAIL: "[CONTACT_EMAIL_REQUIRED]" } }); expect(results.filter((item) => item.level === "BLOCK").length).toBeGreaterThan(2); });
  it("warns safely when billing is disabled", () => { const results = evaluateReadiness({ root, env: { CANTU_BILLING_MODE: "disabled" } }); expect(results).toContainEqual(expect.objectContaining({ level: "WARN", message: expect.stringContaining("Free-only") })); });
  it("blocks enabled billing with missing or incoherent Stripe configuration", () => { const results = evaluateReadiness({ root, env: { CANTU_BILLING_MODE: "live", STRIPE_SECRET_KEY: "sk_test_placeholder" } }); expect(results.filter((item) => item.level === "BLOCK").map((item) => item.message).join(" ")).toMatch(/STRIPE_WEBHOOK_SECRET|conflicts/); });
  it("contains no runtime Higgsfield integration", () => { const runtimeRoots = ["app", "components", "lib"]; const source = runtimeRoots.flatMap((dir) => fs.readdirSync(path.join(root, dir), { recursive: true }).filter((name) => /\.(ts|tsx)$/.test(String(name))).map((name) => fs.readFileSync(path.join(root, dir, String(name)), "utf8"))).join("\n"); expect(source).not.toMatch(/platform\.higgsfield|HF_API_KEY/); });
});
