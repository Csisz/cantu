import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const REQUIRED_FILES = [
  "app/privacy/page.tsx", "app/terms/page.tsx", "app/acceptable-use/page.tsx",
  "docs/public-beta/PRIVACY_NOTICE_DRAFT.md", "docs/public-beta/TERMS_DRAFT.md",
  "docs/public-beta/SECURITY_CHECKLIST.md", "docs/public-beta/LEGAL_LAUNCH_CHECKLIST.md",
  "public/robot.png", "supabase/migrations/20260901120000_milestone_11_public_beta_hardening.sql",
  "app/pricing/page.tsx", "docs/billing/STRIPE_RUNBOOK.md",
  "supabase/migrations/20260901180000_milestone_12_billing_entitlements.sql",
];
const MOCK_FLAGS = ["CANTU_E2E_AUTH_MOCK", "CANTU_E2E_STT_MOCK", "CANTU_E2E_ANALYSIS_MOCK", "CANTU_E2E_PRACTICE_MOCK", "CANTU_E2E_BILLING_MOCK"];

export function evaluateReadiness({ root, env, production = false }) {
  const results = [];
  for (const file of REQUIRED_FILES) results.push({ level: fs.existsSync(path.join(root, file)) ? "PASS" : "BLOCK", message: `${file} ${fs.existsSync(path.join(root, file)) ? "exists" : "is missing"}` });
  const animations = fs.existsSync(path.join(root, "public/robot"))
    ? fs.readdirSync(path.join(root, "public/robot")).filter((name) => /^coach-.*\.mp4$/.test(name)).length : 0;
  results.push({ level: animations ? "PASS" : "WARN", message: animations ? `${animations} optional coach animations available` : "Optional coach videos missing; static robot fallback is available" });
  const unsafe = MOCK_FLAGS.filter((name) => env[name] === "1");
  results.push({ level: production && unsafe.length ? "BLOCK" : "PASS", message: production && unsafe.length ? "Production E2E mock flags are enabled" : "Production mock flags are safe" });
  const practiceSecret = env.PRACTICE_STATE_SECRET?.trim() ?? "";
  results.push({ level: production && practiceSecret.length < 32 ? "BLOCK" : practiceSecret.length >= 32 ? "PASS" : "WARN", message: practiceSecret.length >= 32 ? "Practice state signing secret has a production-safe shape" : "Practice state signing secret is not configured for production" });
  const contact = env.PUBLIC_CONTACT_EMAIL?.trim() ?? "";
  const unresolvedContact = !contact || contact.includes("CONTACT_EMAIL_REQUIRED") || !contact.includes("@");
  results.push({ level: production && unresolvedContact ? "BLOCK" : unresolvedContact ? "WARN" : "PASS", message: unresolvedContact ? "Public contact email is unresolved" : "Public contact email is configured" });
  for (const name of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY", "OPENAI_API_KEY"]) {
    const missing = !env[name]?.trim();
    results.push({ level: production && missing ? "BLOCK" : missing ? "WARN" : "PASS", message: `${name} ${missing ? "is not configured" : "is configured"}` });
  }
  const billingMode = env.CANTU_BILLING_MODE?.trim() || "disabled";
  if (!["disabled", "test", "live"].includes(billingMode)) {
    results.push({ level: "BLOCK", message: "CANTU_BILLING_MODE is invalid" });
  } else if (billingMode === "disabled") {
    results.push({ level: "WARN", message: "Billing is disabled; Cantu runs as a Free-only product" });
  } else {
    for (const name of ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_ID_CANTU_PLUS", "CANTU_PLUS_PRICE_LABEL"]) {
      const missing = !env[name]?.trim();
      results.push({ level: missing ? "BLOCK" : "PASS", message: `${name} ${missing ? "is required for enabled billing" : "is configured"}` });
    }
    const secretKey = env.STRIPE_SECRET_KEY?.trim() || "";
    const incoherent = billingMode === "test" ? secretKey.startsWith("sk_live_") : secretKey.startsWith("sk_test_");
    results.push({ level: incoherent ? "BLOCK" : "PASS", message: incoherent ? "Stripe key mode conflicts with CANTU_BILLING_MODE" : "Stripe key mode is coherent where detectable" });
  }
  results.push({ level: "WARN", message: "Stripe tax, VAT, invoicing, refund and accounting decisions require manual review" });
  results.push({ level: "WARN", message: "Professional legal and provider contractual review cannot be automated" });
  try {
    const tracked = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
    const suspicious = tracked.filter((file) => {
      if (/\.(png|jpe?g|gif|webp|mp4|wav|mp3|woff2?)$/i.test(file)) return false;
      if (!fs.existsSync(path.join(root, file))) return false;
      const content = fs.readFileSync(path.join(root, file), "utf8");
      return /Bearer[ \t]+sk-[A-Za-z0-9_-]{12,}|(?:HF_API_KEY_SECRET|OPENAI_API_KEY|SUPABASE_SECRET_KEY)[ \t]*=[ \t]*["']?[A-Za-z0-9_-]{16,}/.test(content);
    });
    results.push({ level: suspicious.length ? "BLOCK" : "PASS", message: suspicious.length ? `Potential tracked secret material in ${suspicious.length} file(s)` : "No obvious secret values found in tracked text files" });
  } catch {
    results.push({ level: "WARN", message: "Tracked-file secret scan could not run" });
  }
  return results;
}
