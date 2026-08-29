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

function createGeneratedToneWav(durationSeconds = 31, sampleRate = 8_000) {
  const sampleCount = durationSeconds * sampleRate;
  const buffer = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(buffer);
  const writeAscii = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeAscii(0, "RIFF");
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(36, "data");
  view.setUint32(40, sampleCount * 2, true);

  for (let index = 0; index < sampleCount; index += 1) {
    const sample = Math.sin((2 * Math.PI * 220 * index) / sampleRate) * 0.22;
    view.setInt16(44 + index * 2, Math.round(sample * 32_767), true);
  }
  return Buffer.from(buffer);
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function signInWithDeterministicAuth(page: Page) {
  await page.goto("/app");
  await page.getByLabel("E-mail-cím").fill("tanulo@example.com");
  await page.getByLabel("Jelszó").fill("biztonsagos-jelszo");
  await page.getByRole("button", { name: "Bejelentkezés" }).click();
  await expect(page.getByRole("button", { name: "Kijelentkezés" })).toBeVisible();
}

test("landing to text confirmation and learning preview", async ({ page }) => {
  const runtime = watchRuntime(page);
  await page.goto("/");
  const hero = page.getByRole("region", { name: /Értsd meg az olaszt/i });
  await expect(hero).toBeVisible();
  await expect(hero.getByRole("link", { name: "Hallgasd" })).toBeVisible();
  await expect(hero.getByRole("link", { name: "Hangfájl" })).toBeVisible();
  await expect(hero.getByRole("link", { name: "Szöveg" })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await hero.getByRole("link", { name: "Szöveg" }).click();
  await expect(page).toHaveURL(/\/app\?mode=text/);
  await page.getByLabel("Olasz szöveg").fill("Ci vediamo domani mattina?");
  await page.getByRole("button", { name: "Ezt értsük meg" }).click();
  await expect(page.getByRole("heading", { name: "Ezt fogjuk elemezni" })).toBeVisible();
  await expect(page.getByText("Ci vediamo domani mattina?")).toBeVisible();
  await page.getByRole("button", { name: "Rendben, tovább" }).click();
  await expect(page.getByRole("heading", { name: /Innen épül majd fel/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mit jelent?" })).toBeVisible();
  await expect(page.getByText(/szerkezeti előnézet, nem elkészült AI-elemzés/i)).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const errors = runtime();
  expect(errors.pageErrors).toEqual([]);
  expect(errors.consoleErrors).toEqual([]);
});

test("landing presents the Bring, Verify, Learn story", async ({ page }) => {
  const runtime = watchRuntime(page);
  await page.goto("/");
  const firstStep = page.getByRole("heading", { name: "Hozd azt, amit nem értesz" });
  await firstStep.scrollIntoViewIfNeeded();
  await expect(firstStep).toBeVisible();
  await expect(page.getByRole("heading", { name: /Ellenőrizd, mit hallott/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Értsd meg, jegyezd meg, mondd ki" })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const errors = runtime();
  expect(errors.pageErrors).toEqual([]);
  expect(errors.consoleErrors).toEqual([]);
});

test("audio file stays local, renders waveform, previews and confirms bounded selection", async ({ page }) => {
  const runtime = watchRuntime(page);
  const nonGetRequests: string[] = [];
  await page.goto("/app?mode=audio");
  page.on("request", (request) => {
    if (request.method() !== "GET") nonGetRequests.push(`${request.method()} ${request.url()}`);
  });

  await page.getByLabel("Hangfájl kiválasztása").setInputFiles({
    name: "generated-cantu-tone.wav",
    mimeType: "audio/wav",
    buffer: createGeneratedToneWav(),
  });
  await expect(page.getByRole("img", { name: /Helyi hullámforma/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("generated-cantu-tone.wav")).toBeVisible();
  await expect(page.getByLabel("Kezdőpont")).toHaveAttribute("aria-valuetext", "00:00.0");
  await expect(page.getByLabel("Végpont")).toHaveAttribute("aria-valuetext", "00:30.0");

  await page.getByLabel("Végpont").evaluate((element: HTMLInputElement) => {
    element.value = "40000";
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(page.getByLabel("Végpont")).toHaveValue("30000");

  await expect(page.getByRole("button", { name: /Lejátszás/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Szünet/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Leállítás/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Újrajátszás/i })).toBeVisible();
  await page.getByRole("button", { name: /Lejátszás/i }).click();
  await page.getByRole("button", { name: /Leállítás/i }).click();
  expect(nonGetRequests).toEqual([]);

  await page.getByRole("button", { name: "Ezt a részt értsük meg" }).click();
  await expect(page.getByRole("heading", { name: "Ezt a forrást választottad" })).toBeVisible();
  await expect(page.getByText(/Átirat a következő mérföldkőben/i)).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(nonGetRequests).toEqual([]);

  const errors = runtime();
  expect(errors.pageErrors).toEqual([]);
  expect(errors.consoleErrors).toEqual([]);
});

test("Listen mode remains explicit and does not request the microphone", async ({ page }) => {
  const runtime = watchRuntime(page);
  await page.goto("/app?mode=listen");
  await expect(page.getByRole("heading", { name: /Vegyél fel egy rövid olasz részletet/i })).toBeVisible();
  await expect(page.getByText(/mikrofon nem kapcsol be/i)).toBeVisible();
  await page.getByRole("button", { name: /A folyamat előnézete/i }).click();
  await expect(page.getByText(/nincs felvétel/i)).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const errors = runtime();
  expect(errors.pageErrors).toEqual([]);
  expect(errors.consoleErrors).toEqual([]);
});

test("authentication boundary exposes empty learning space and signs out", async ({ page }) => {
  const runtime = watchRuntime(page);
  await page.goto("/app");

  await page.getByRole("heading", { name: "Saját tanulásaim" }).scrollIntoViewIfNeeded();
  await page.getByLabel("E-mail-cím").fill("tanulo@example.com");
  await page.getByLabel("Jelszó").fill("biztonsagos-jelszo");
  await page.getByRole("button", { name: "Bejelentkezés" }).click();

  await expect(page.getByRole("heading", { name: "Még nincs elmentett tanulásod." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Kijelentkezés" })).toBeVisible();
  await page.getByRole("button", { name: "Kijelentkezés" }).click();
  await expect(page.getByRole("button", { name: "Bejelentkezés" })).toBeVisible();

  const errors = runtime();
  expect(errors.pageErrors).toEqual([]);
  expect(errors.consoleErrors).toEqual([]);
});

test("authenticated text session saves metadata only and can be deleted", async ({ page }) => {
  const runtime = watchRuntime(page);
  const privateText = "Possiamo parlarne domani?";
  const postBodies: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") postBodies.push(request.postData() ?? "");
  });

  await signInWithDeterministicAuth(page);
  await page.getByRole("tab", { name: "Szöveg" }).click();
  await page.getByLabel("Olasz szöveg").fill(privateText);
  await page.getByRole("button", { name: "Ezt értsük meg" }).click();
  await page.getByRole("button", { name: "Rendben, tovább" }).click();
  await page.getByRole("button", { name: "Mentés a tanulásaim közé" }).click();
  await expect(page.getByRole("button", { name: "Elmentve" })).toBeVisible();

  const history = page.getByRole("region", { name: "Saját tanulásaim" });
  await expect(history.getByText("Szöveg", { exact: true })).toBeVisible();
  await expect(history.getByText(/25 karakter/)).toBeVisible();
  await expect(history.getByText(privateText)).toHaveCount(0);
  expect(postBodies.some((body) => body.includes(privateText))).toBe(false);

  await history.getByRole("button", { name: "Törlés" }).click();
  await history.getByRole("button", { name: "Igen, törlöm" }).click();
  await expect(history.getByRole("heading", { name: "Még nincs elmentett tanulásod." })).toBeVisible();

  const errors = runtime();
  expect(errors.pageErrors).toEqual([]);
  expect(errors.consoleErrors).toEqual([]);
});

test("authenticated audio save persists selected duration without source content", async ({ page }) => {
  const runtime = watchRuntime(page);
  const localFileName = "never-upload-this-name.wav";
  const postBodies: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") postBodies.push(request.postData() ?? "");
  });

  await signInWithDeterministicAuth(page);
  await page.getByRole("tab", { name: "Hangfájl" }).click();
  await page.getByLabel("Hangfájl kiválasztása").setInputFiles({
    name: localFileName,
    mimeType: "audio/wav",
    buffer: createGeneratedToneWav(),
  });
  await expect(page.getByRole("img", { name: /Helyi hullámforma/i })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Ezt a részt értsük meg" }).click();
  await page.getByRole("button", { name: "Rendben, tovább" }).click();
  await page.getByRole("button", { name: "Mentés a tanulásaim közé" }).click();
  await expect(page.getByRole("button", { name: "Elmentve" })).toBeVisible();

  const history = page.getByRole("region", { name: "Saját tanulásaim" });
  await expect(history.getByText("Hangrészlet", { exact: true })).toBeVisible();
  await expect(history.getByText(/30\.0 mp/)).toBeVisible();
  await expect(history.getByText(localFileName)).toHaveCount(0);
  expect(postBodies.some((body) => body.includes(localFileName) || body.includes("RIFF"))).toBe(false);

  const errors = runtime();
  expect(errors.pageErrors).toEqual([]);
  expect(errors.consoleErrors).toEqual([]);
});
