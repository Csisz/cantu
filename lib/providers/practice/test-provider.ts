import "server-only";

import { normalizePhraseIdentity } from "@/lib/learning/player";
import type { PracticeResponseInput, PracticeStartInput, PracticeTurn } from "@/lib/practice/types";
import { PracticeError, type ConversationPracticeProvider } from "./types";

const openingByScenario: Record<string, [string, string]> = {
  restaurant: ["Buongiorno! Cosa desidera ordinare?", "Jó napot! Mit szeretne rendelni?"],
  shopping: ["Buongiorno! Posso aiutarla?", "Jó napot! Segíthetek?"],
  station: ["Buongiorno, dove deve andare?", "Jó napot, hová szeretne utazni?"],
  meeting: ["Ciao! È la prima volta che vieni qui?", "Szia! Először jársz itt?"],
  friends: ["Che programmi hai per domani?", "Mit tervezel holnapra?"],
  directions: ["Certo, dove vuoi arrivare?", "Persze, hová szeretnél eljutni?"],
  work_school: ["Quando possiamo finire questo lavoro?", "Mikor tudjuk befejezni ezt a munkát?"],
  messaging: ["Ci vediamo domani?", "Találkozunk holnap?"],
};

export class TestConversationPracticeProvider implements ConversationPracticeProvider {
  readonly name = "test";
  readonly model = "cantu-test-practice";

  async startScenario(input: PracticeStartInput): Promise<PracticeTurn> {
    const opening = openingByScenario[input.scenario.id] ?? openingByScenario.messaging!;
    return {
      partnerReplyIt: opening[0],
      partnerReplyHuHint: opening[1],
      learnerFeedback: null,
      targetUsage: { targetPhraseId: null, usedSuccessfully: false },
      nextGoalHu: input.scenario.firstGoalHu,
      scenarioState: "continue",
    };
  }

  async respond(input: PracticeResponseInput): Promise<PracticeTurn> {
    if (input.learnerResponse.includes("PROVIDER_FAIL")) throw new PracticeError("provider_unavailable");
    const injection = /ignore|system:|api key|chiave api/iu.test(input.learnerResponse);
    const target = input.targets.find((item) => (
      normalizePhraseIdentity(input.learnerResponse).includes(normalizePhraseIdentity(item.italianChunk))
    ));
    const grammarError = /\bio andare\b/iu.test(input.learnerResponse);
    const status = grammarError ? "needs_fix" : target ? "good" : "understandable";
    const complete = input.turnNumber >= 3;
    return {
      partnerReplyIt: complete ? "Perfetto, allora ci siamo. A presto!" : input.turnNumber === 1 ? "Bene. E che cosa preferisci fare dopo?" : "Capisco. Vuoi aggiungere qualcos'altro?",
      partnerReplyHuHint: complete ? "Rendben, akkor megvagyunk. Hamarosan találkozunk!" : null,
      learnerFeedback: {
        status,
        correctedItalian: grammarError ? "Io vado alla stazione." : null,
        explanationHu: grammarError
          ? "Érthető, de az „andare” alapforma helyett itt a ragozott „vado” kell."
          : injection
            ? "Az utasításszerű szöveget is egyszerű nyelvi válaszként kezeltem."
            : status === "good"
              ? "Természetesen használtad a mentett kifejezést ebben a helyzetben."
              : "Érthető és a helyzetbe illik; nem kell mindenáron átírni.",
        naturalAlternativeIt: grammarError ? "Vado alla stazione." : null,
      },
      targetUsage: { targetPhraseId: target?.referenceId ?? null, usedSuccessfully: Boolean(target) },
      nextGoalHu: complete ? null : "Válaszolj még egy rövid, természetes mondattal.",
      scenarioState: complete ? "complete" : "continue",
    };
  }
}
