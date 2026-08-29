import "server-only";

import { z } from "zod";
import {
  TranscriptionError,
  transcriptResultSchema,
  type SpeechToTextInput,
  type SpeechToTextProvider,
} from "./types";

export const OPENAI_TRANSCRIPTION_MODEL = "gpt-transcribe";
export const OPENAI_TRANSCRIPTION_ENDPOINT = "https://api.openai.com/v1/audio/transcriptions";
export const DEFAULT_TRANSCRIPTION_TIMEOUT_MS = 25_000;

const openAIResponseSchema = z.object({
  text: z.string().trim().min(1),
  languages: z.array(z.object({ code: z.string().trim().min(2) })).optional(),
});

function extensionForMime(mimeType: string) {
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("mpeg")) return "mp3";
  return "webm";
}

export class OpenAISpeechToTextProvider implements SpeechToTextProvider {
  readonly name = "openai";

  constructor(
    private readonly apiKey: string,
    private readonly fetchImplementation: typeof fetch = fetch,
    private readonly timeoutMs = DEFAULT_TRANSCRIPTION_TIMEOUT_MS,
    private readonly model = OPENAI_TRANSCRIPTION_MODEL,
  ) {
    if (!apiKey.trim()) throw new TranscriptionError("not_configured");
  }

  async transcribe(input: SpeechToTextInput) {
    const timeoutSignal = AbortSignal.timeout(this.timeoutMs);
    const signal = input.signal ? AbortSignal.any([input.signal, timeoutSignal]) : timeoutSignal;
    const formData = new FormData();
    const bytes = input.bytes.slice();
    formData.append(
      "file",
      new Blob([bytes], { type: input.mimeType }),
      `cantu-clip.${extensionForMime(input.mimeType)}`,
    );
    formData.append("model", this.model);
    formData.append("language", input.languageHint ?? "it");
    formData.append("response_format", "json");

    let response: Response;
    try {
      response = await this.fetchImplementation(OPENAI_TRANSCRIPTION_ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}` },
        body: formData,
        signal,
      });
    } catch {
      if (signal.aborted) throw new TranscriptionError("provider_unavailable", "provider_timeout");
      throw new TranscriptionError("provider_unavailable");
    }

    if (response.status === 429) throw new TranscriptionError("rate_limited");
    if (response.status >= 500) throw new TranscriptionError("provider_unavailable");
    if (!response.ok) throw new TranscriptionError("transcription_failed");

    let providerPayload: unknown;
    try {
      providerPayload = await response.json();
    } catch {
      throw new TranscriptionError("transcription_failed");
    }
    const parsed = openAIResponseSchema.safeParse(providerPayload);
    if (!parsed.success) throw new TranscriptionError("transcription_failed");

    return transcriptResultSchema.parse({
      text: parsed.data.text,
      detectedLanguage: parsed.data.languages?.[0]?.code,
    });
  }
}
