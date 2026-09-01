export const PRACTICE_SCENARIO_IDS = [
  "restaurant",
  "shopping",
  "station",
  "meeting",
  "friends",
  "directions",
  "work_school",
  "messaging",
] as const;

export type PracticeScenarioId = (typeof PRACTICE_SCENARIO_IDS)[number];

export type PracticeScenario = {
  id: PracticeScenarioId;
  icon: string;
  titleHu: string;
  settingHu: string;
  partnerRoleHu: string;
  firstGoalHu: string;
};

export const PRACTICE_SCENARIOS: readonly PracticeScenario[] = [
  { id: "restaurant", icon: "☕", titleHu: "Kávézó / étterem", settingHu: "Rendelsz, kérdezel, majd természetesen reagálsz.", partnerRoleHu: "pincér", firstGoalHu: "Kezdeményezz vagy válaszolj röviden egy rendelési helyzetben." },
  { id: "shopping", icon: "◌", titleHu: "Vásárlás", settingHu: "Méretet, árat vagy egy másik lehetőséget kérsz.", partnerRoleHu: "eladó", firstGoalHu: "Mondd el röviden, mit keresel." },
  { id: "station", icon: "↗", titleHu: "Utazás / állomás", settingHu: "Jegyről, indulásról vagy útvonalról beszéltek.", partnerRoleHu: "állomási munkatárs", firstGoalHu: "Kérj egy konkrét utazási információt." },
  { id: "meeting", icon: "✦", titleHu: "Ismerkedés", settingHu: "Rövid, természetes első beszélgetés valakivel.", partnerRoleHu: "új ismerős", firstGoalHu: "Mutatkozz be vagy reagálj egy egyszerű kérdésre." },
  { id: "friends", icon: "○", titleHu: "Program a barátokkal", settingHu: "Közös tervet egyeztettek a közeljövőre.", partnerRoleHu: "barát", firstGoalHu: "Reagálj a tervre, és mondd el, mit szeretnél." },
  { id: "directions", icon: "◇", titleHu: "Útbaigazítás", settingHu: "Eligazítást kérsz vagy pontosítasz egy útvonalat.", partnerRoleHu: "helyi lakos", firstGoalHu: "Kérdezz rá udvariasan az útvonalra." },
  { id: "work_school", icon: "□", titleHu: "Munka / iskola", settingHu: "Egy rövid feladatról, időpontról vagy tervről egyeztettek.", partnerRoleHu: "kolléga vagy csoporttárs", firstGoalHu: "Egyeztess egy következő lépést." },
  { id: "messaging", icon: "…", titleHu: "Üzenet / hétköznapi terv", settingHu: "Rövid üzenetváltás egy hétköznapi programról.", partnerRoleHu: "ismerős", firstGoalHu: "Válaszolj röviden és természetesen az üzenetre." },
] as const;

export function getPracticeScenario(id: string) {
  return PRACTICE_SCENARIOS.find((scenario) => scenario.id === id) ?? null;
}
