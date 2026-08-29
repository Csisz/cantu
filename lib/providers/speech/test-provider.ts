import "server-only";

import type { SpeechToTextProvider } from "./types";

export class TestSpeechToTextProvider implements SpeechToTextProvider {
  readonly name = "test";

  async transcribe() {
    return {
      text: "Ci vediamo domani mattina?",
      detectedLanguage: "it",
    };
  }
}
