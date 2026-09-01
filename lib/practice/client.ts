import type { PracticeScenarioId } from "./scenarios";
import type { PracticeClientResult } from "./types";

export type PracticeClientResponse =
  | { status: "success"; data: PracticeClientResult }
  | { status: "error"; code: string; message: string };

const errorMessages: Record<string, string> = {
  unauthenticated: "A valódi helyzet gyakorlásához jelentkezz be.",
  invalid_request: "Ezt a gyakorlási kérést nem tudjuk feldolgozni.",
  no_saved_phrases: "Előbb ments el legalább egy hasznos kifejezést.",
  session_invalid: "Ez a rövid gyakorlás lejárt. Indíts egy újat.",
  target_not_found: "A kiválasztott kifejezés már nem érhető el.",
  turn_limit_reached: "Ez a szituáció már véget ért.",
  duplicate_request: "Ezt a választ már elküldted.",
  not_configured: "A gyakorlási szolgáltató még nincs beállítva.",
  rate_limited: "Most sok gyakorlás indult. Tarts egy rövid szünetet, majd próbáld újra.",
  provider_timeout: "A válasz most túl sokáig tartott. Próbáld újra.",
  provider_unavailable: "A gyakorlópartner most nem érhető el. A mentett kifejezéseid megmaradtak.",
  invalid_provider_response: "A gyakorlóválasz most nem volt használható. Próbáld újra.",
  practice_invalid: "A gyakorlóválasz ellenőrzése nem sikerült. Indíts új szituációt.",
};

async function request(body: unknown): Promise<PracticeClientResponse> {
  try {
    const response = await fetch("/api/practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null) as PracticeClientResult | { error?: { code?: string } } | null;
    if (response.ok && payload && "turn" in payload) return { status: "success", data: payload };
    const code = payload && "error" in payload ? payload.error?.code ?? "provider_unavailable" : "provider_unavailable";
    return { status: "error", code, message: errorMessages[code] ?? errorMessages.provider_unavailable! };
  } catch {
    return { status: "error", code: "provider_unavailable", message: errorMessages.provider_unavailable! };
  }
}

export function startPracticeScenario(scenarioId: PracticeScenarioId) {
  return request({ action: "start", scenarioId });
}

export function submitPracticeResponse(stateToken: string, learnerResponse: string) {
  return request({ action: "respond", stateToken, learnerResponse });
}
