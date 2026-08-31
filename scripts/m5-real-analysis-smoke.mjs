import { chromium } from "@playwright/test";

const baseURL = process.env.CANTU_SMOKE_BASE_URL ?? "http://localhost:3011";
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  await page.goto(`${baseURL}/app?mode=text`);
  await page.getByLabel("E-mail-cím").fill("smoke@cantu.local");
  await page.getByLabel("Jelszó").fill("smoke-only-password");
  await page.getByRole("button", { name: "Bejelentkezés" }).click();
  await page.getByRole("tab", { name: "Szöveg" }).click();
  await page.getByLabel("Olasz szöveg").fill("Non vedo l'ora di vederti domani.");
  await page.getByRole("button", { name: "Ezt értsük meg" }).click();
  await page.getByRole("button", { name: "Rendben, tovább" }).click();

  const [response] = await Promise.all([
    page.waitForResponse((candidate) => candidate.url().endsWith("/api/analyze")),
    page.getByRole("button", { name: "Értsük meg" }).click(),
  ]);
  const payload = await response.json();
  if (!response.ok() || !payload?.analysis || !payload?.generation) {
    throw new Error(`Real analysis smoke failed with HTTP ${response.status()}`);
  }

  const analysis = payload.analysis;
  const generation = payload.generation;
  process.stdout.write(`${JSON.stringify({
    status: "PASS",
    model: generation.model,
    reasoningEffort: generation.reasoningEffort,
    schemaVersion: generation.schemaVersion,
    promptVersion: generation.promptVersion,
    latencyMs: generation.latencyMs,
    analysisStatus: analysis.analysisStatus,
    chunkCount: analysis.chunks?.length ?? 0,
    grammarCount: analysis.grammar?.length ?? 0,
    transferCount: analysis.transfer?.length ?? 0,
    recallCount: analysis.recall?.length ?? 0,
    usage: generation.usage ?? null,
  })}\n`);
} finally {
  await browser.close();
}
