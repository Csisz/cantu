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
  const writeAscii = (offset: number, value: string) => [...value].forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
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
    const frequency = index < sampleRate * 15 ? 220 : 440;
    view.setInt16(44 + index * 2, Math.round(Math.sin((2 * Math.PI * frequency * index) / sampleRate) * 7_200), true);
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

async function loadAudio(page: Page, buffer = createGeneratedToneWav()) {
  await page.getByLabel("Hangfájl kiválasztása").setInputFiles({
    name: "full-source-never-upload.wav",
    mimeType: "audio/wav",
    buffer,
  });
  await expect(page.getByRole("img", { name: /Helyi hullámforma/i })).toBeVisible({ timeout: 30_000 });
}

async function setRange(page: Page, label: string, value: number) {
  await page.getByLabel(label).evaluate((element: HTMLInputElement, nextValue) => {
    element.value = String(nextValue);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

async function installMicrophoneStub(page: Page, denied = false) {
  await page.addInitScript(({ shouldDeny }) => {
    const track = { stop() {}, addEventListener() {} };
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => {
          if (shouldDeny) throw new DOMException("denied", "NotAllowedError");
          return { getTracks: () => [track] };
        },
      },
    });
    class Recorder extends EventTarget {
      static isTypeSupported(type: string) { return type.startsWith("audio/webm"); }
      state = "inactive";
      mimeType = "audio/webm";
      start() { this.state = "recording"; }
      stop() {
        if (this.state === "inactive") return;
        this.state = "inactive";
        const data = new Event("dataavailable");
        Object.defineProperty(data, "data", { value: new Blob([new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 1])], { type: this.mimeType }) });
        this.dispatchEvent(data);
        this.dispatchEvent(new Event("stop"));
      }
    }
    Object.defineProperty(window, "MediaRecorder", { configurable: true, value: Recorder });
  }, { shouldDeny: denied });
}

test("landing to text confirmation and learning preview", async ({ page }) => {
  const runtime = watchRuntime(page);
  await page.goto("/");
  const hero = page.getByRole("region", { name: /Értsd meg az olaszt/i });
  await expect(hero).toBeVisible();
  await expect(hero.getByRole("link", { name: "Hallgasd" })).toBeVisible();
  await expect(hero.getByRole("link", { name: "Hangfájl" })).toBeVisible();
  await hero.getByRole("link", { name: "Szöveg" }).click();
  await page.getByLabel("Olasz szöveg").fill("Ci vediamo domani mattina?");
  await page.getByRole("button", { name: "Ezt értsük meg" }).click();
  await expect(page.getByRole("heading", { name: "Ezt fogjuk elemezni" })).toBeVisible();
  await page.getByRole("button", { name: "Rendben, tovább" }).click();
  await expect(page.getByRole("heading", { name: /Innen épül majd fel/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(runtime()).toEqual({ pageErrors: [], consoleErrors: [] });
});

test("landing presents the Bring, Verify, Learn story", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Hozd azt, amit nem értesz" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Ellenőrizd, mit hallott/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Értsd meg, jegyezd meg, mondd ki" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("unauthenticated audio exploration stays local and reaches auth boundary", async ({ page }) => {
  const transcriptionRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/transcribe")) transcriptionRequests.push(request.url());
  });
  await page.goto("/app?mode=audio");
  await loadAudio(page);
  await expect(page.getByLabel("Végpont")).toHaveAttribute("aria-valuetext", "00:30.0");
  expect(transcriptionRequests).toEqual([]);
  await page.getByRole("button", { name: "Kijelölt rész átírása" }).click();
  await expect(page.getByRole("heading", { name: "Az átíráshoz jelentkezz be" })).toBeVisible();
  expect(transcriptionRequests).toEqual([]);
});

test("authenticated audio sends only selected clip and requires confirmation", async ({ page }) => {
  const runtime = watchRuntime(page);
  const fullFile = createGeneratedToneWav();
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    (window as typeof window & { __cantuTranscriptionRequest?: unknown }).__cantuTranscriptionRequest = null;
    window.fetch = async (input, init) => {
      if (String(input).endsWith("/api/transcribe") && init?.body instanceof FormData) {
        const clip = init.body.get("clip");
        (window as typeof window & { __cantuTranscriptionRequest?: unknown }).__cantuTranscriptionRequest = clip instanceof File
          ? {
              name: clip.name,
              type: clip.type,
              size: clip.size,
              durationMs: init.body.get("durationMs"),
              sourceType: init.body.get("sourceType"),
              fields: [...init.body.keys()],
            }
          : null;
      }
      return originalFetch(input, init);
    };
  });
  await signInWithDeterministicAuth(page);
  await page.getByRole("tab", { name: "Hangfájl" }).click();
  await loadAudio(page, fullFile);
  await page.getByLabel("Kezdőpont").focus();
  await page.keyboard.press("End");
  await expect(page.getByLabel("Kezdőpont")).toHaveValue("29000");
  await page.getByRole("button", { name: "Kijelölt rész átírása" }).click();
  await expect(page.getByRole("heading", { name: "Ezt hallottam" })).toBeVisible();
  await expect(page.getByText("Ci vediamo domani mattina?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Igen, pontos" })).toBeVisible();
  const sent = await page.evaluate(() => (window as typeof window & {
    __cantuTranscriptionRequest?: {
      name: string;
      type: string;
      size: number;
      durationMs: string;
      sourceType: string;
      fields: string[];
    };
  }).__cantuTranscriptionRequest);
  expect(sent).toEqual({
    name: "selected-clip.wav",
    type: "audio/wav",
    size: expect.any(Number),
    durationMs: "1000",
    sourceType: "audio_file",
    fields: ["clip", "sourceType", "durationMs"],
  });
  expect(sent!.size).toBeLessThan(fullFile.byteLength);
  expect(sent!.name).not.toBe("full-source-never-upload.wav");

  await page.getByRole("button", { name: "Igen, pontos" }).click();
  await expect(page.getByRole("heading", { name: /Innen épül majd fel/i })).toBeVisible();
  await expect(page.getByText(/metaadatai elmentve/i)).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(runtime()).toEqual({ pageErrors: [], consoleErrors: [] });
});

test("transcript can be explicitly edited before verification", async ({ page }) => {
  await signInWithDeterministicAuth(page);
  await page.getByRole("tab", { name: "Hangfájl" }).click();
  await loadAudio(page);
  await setRange(page, "Végpont", 3_000);
  await page.getByRole("button", { name: "Kijelölt rész átírása" }).click();
  await expect(page.getByRole("heading", { name: "Ezt hallottam" })).toBeVisible();
  await page.getByRole("button", { name: "Javítom" }).click();
  await page.getByLabel("Javított olasz szöveg").fill("Ci vediamo domani sera?");
  await page.getByRole("button", { name: "Javítás megerősítése" }).click();
  await expect(page.getByText("Ci vediamo domani sera?")).toBeVisible();
  const history = page.getByRole("region", { name: "Saját tanulásaim" });
  await expect(history.getByText("Hangrészlet", { exact: true })).toBeVisible();
});

test("microphone starts only after explicit action and reaches transcript candidate", async ({ page }) => {
  await installMicrophoneStub(page);
  await signInWithDeterministicAuth(page);
  await page.getByRole("tab", { name: "Hallgasd" }).click();
  await expect(page.getByText("Felvétel folyamatban")).toHaveCount(0);
  await page.getByRole("button", { name: /Felvétel indítása/i }).click();
  await expect(page.getByText("Felvétel folyamatban")).toBeVisible();
  await page.getByRole("button", { name: "Felvétel leállítása" }).click();
  await expect(page.getByText("A rövid felvétel elkészült.")).toBeVisible();
  await page.getByRole("button", { name: "Felvétel átírása" }).click();
  await expect(page.getByRole("heading", { name: "Ezt hallottam" })).toBeVisible();
});

test("microphone permission denial offers audio and text recovery", async ({ page }) => {
  await installMicrophoneStub(page, true);
  await page.goto("/app?mode=listen");
  await page.getByRole("button", { name: /Felvétel indítása/i }).click();
  await expect(page.getByText(/A mikrofonengedélyt nem kaptuk meg/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Hangfájlt választok" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Szöveget írok" })).toBeVisible();
});

test("authentication history, metadata-only text save, deletion and sign-out remain functional", async ({ page }) => {
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
  await expect(history.getByText(privateText)).toHaveCount(0);
  expect(postBodies.some((body) => body.includes(privateText))).toBe(false);
  const textRow = history.locator("li").filter({ hasText: "Szöveg" }).first();
  await textRow.getByRole("button", { name: "Törlés" }).click();
  await textRow.getByRole("button", { name: "Igen, törlöm" }).click();
  await expect(history.getByText("Szöveg", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Kijelentkezés" }).click();
  await expect(page.getByRole("button", { name: "Bejelentkezés" })).toBeVisible();
});
