import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";

function watchRuntime(page: Page) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message: ConsoleMessage) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  return () => ({ pageErrors, consoleErrors });
}

test("landing to confirmed mocked Listen flow", async ({ page }) => {
  const runtime = watchRuntime(page);
  await page.goto("/");
  const hero = page.getByRole("region", {
    name: /Tanulj olaszul a kedvenc dalaidból/i,
  });
  await expect(hero).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await hero.getByRole("link", { name: "Hallgasd meg" }).click();
  await expect(page).toHaveURL(/\/app\?mode=listen/);
  await expect(page.getByRole("heading", { name: /Játssz le kb. 10 másodpercet/i })).toBeVisible();
  await page.getByRole("button", { name: /Mock hallgatás indítása/i }).click();
  await expect(page.getByRole("heading", { name: "Figyelek…" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Megpróbálom felismerni…" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Igen, ez az" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Dal megerősítve" })).toHaveCount(0);
  await page.getByRole("button", { name: "Igen, ez az" }).click();
  await expect(page.getByRole("heading", { name: "Dal megerősítve" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  const errors = runtime();
  expect(errors.pageErrors).toEqual([]);
  expect(errors.consoleErrors).toEqual([]);
});

test("landing exposes the recognition-first three-step story", async ({ page }) => {
  const runtime = watchRuntime(page);
  await page.goto("/");
  const firstStep = page.getByRole("heading", { name: "Hallgasd meg vagy töltsd fel" });

  await firstStep.scrollIntoViewIfNeeded();
  await expect(firstStep).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  const errors = runtime();
  expect(errors.pageErrors).toEqual([]);
  expect(errors.consoleErrors).toEqual([]);
});

test("authentication boundary exposes an empty library and signs out", async ({ page }) => {
  const runtime = watchRuntime(page);
  await page.goto("/app");

  await page.getByRole("heading", { name: "Saját dalaim" }).scrollIntoViewIfNeeded();
  await page.getByLabel("E-mail-cím").fill("tanulo@example.com");
  await page.getByLabel("Jelszó").fill("biztonsagos-jelszo");
  await page.getByRole("button", { name: "Bejelentkezés" }).click();

  await expect(page.getByRole("heading", { name: "Még nincs elmentett dalod." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Kijelentkezés" })).toBeVisible();
  await page.getByRole("button", { name: "Kijelentkezés" }).click();
  await expect(page.getByRole("button", { name: "Bejelentkezés" })).toBeVisible();

  const errors = runtime();
  expect(errors.pageErrors).toEqual([]);
  expect(errors.consoleErrors).toEqual([]);
});

test("wrong candidate exposes recovery actions", async ({ page }) => {
  const runtime = watchRuntime(page);
  await page.goto("/app?mode=listen");
  await page.getByRole("button", { name: /Mock hallgatás indítása/i }).click();
  await expect(page.getByRole("button", { name: "Nem ez" })).toBeVisible();
  await page.getByRole("button", { name: "Nem ez" }).click();
  await expect(page.getByRole("heading", { name: "Nem ez a dal." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Újra meghallgatom" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Feltöltöm inkább" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Keresés kézzel" })).toBeVisible();

  const errors = runtime();
  expect(errors.pageErrors).toEqual([]);
  expect(errors.consoleErrors).toEqual([]);
});
