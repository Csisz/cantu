import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  OPENAI_TRANSCRIPTION_ENDPOINT,
  OPENAI_TRANSCRIPTION_MODEL,
  OpenAISpeechToTextProvider,
} from "./openai";
import { TranscriptionError } from "./types";

const input = {
  bytes: new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4]),
  mimeType: "audio/wav",
  durationMs: 1_000,
  languageHint: "it" as const,
};

describe("OpenAI SpeechToTextProvider", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("normalizes a supported transcription response", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (requestInput, requestInit) => {
      void requestInput;
      void requestInit;
      return Response.json({
        text: "Ci vediamo domani.",
        languages: [{ code: "it", name: "Italian" }],
        provider_internal: "not exposed",
      });
    });
    const provider = new OpenAISpeechToTextProvider("test-key", fetchMock);

    await expect(provider.transcribe(input)).resolves.toEqual({
      text: "Ci vediamo domani.",
      detectedLanguage: "it",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0]!;
    expect(url).toBe(OPENAI_TRANSCRIPTION_ENDPOINT);
    expect(request?.headers).toEqual({ Authorization: "Bearer test-key" });
    const body = request?.body as FormData;
    expect(body.get("model")).toBe(OPENAI_TRANSCRIPTION_MODEL);
    expect(body.get("language")).toBe("it");
  });

  it("rejects a missing or invalid transcript without leaking the payload", async () => {
    const secretPayload = "provider-debug-secret";
    const provider = new OpenAISpeechToTextProvider(
      "test-key",
      vi.fn(async () => Response.json({ error: secretPayload }, { status: 400 })) as typeof fetch,
    );
    const error = await provider.transcribe(input).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(TranscriptionError);
    expect((error as TranscriptionError).code).toBe("transcription_failed");
    expect(String(error)).not.toContain(secretPayload);

    const invalid = new OpenAISpeechToTextProvider(
      "test-key",
      vi.fn(async () => Response.json({ language: "it" })) as typeof fetch,
    );
    await expect(invalid.transcribe(input)).rejects.toMatchObject({ code: "transcription_failed" });
  });

  it("maps rate limits and provider failures", async () => {
    const rateLimited = new OpenAISpeechToTextProvider(
      "test-key",
      vi.fn(async () => new Response(null, { status: 429 })) as typeof fetch,
    );
    await expect(rateLimited.transcribe(input)).rejects.toMatchObject({ code: "rate_limited" });

    const unavailable = new OpenAISpeechToTextProvider(
      "test-key",
      vi.fn(async () => new Response(null, { status: 503 })) as typeof fetch,
    );
    await expect(unavailable.transcribe(input)).rejects.toMatchObject({ code: "provider_unavailable" });
  });

  it("times out a hanging provider request", async () => {
    const hangingFetch = vi.fn((_url: unknown, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
    }));
    const provider = new OpenAISpeechToTextProvider("test-key", hangingFetch as typeof fetch, 5);
    await expect(provider.transcribe(input)).rejects.toMatchObject({ code: "provider_unavailable" });
  });

  it("fails closed when the server key is not configured", () => {
    expect(() => new OpenAISpeechToTextProvider(" ")).toThrowError(
      expect.objectContaining({ code: "not_configured" }),
    );
  });
});
