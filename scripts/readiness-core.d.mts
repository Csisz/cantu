export type ReadinessResult = { level: "PASS" | "WARN" | "BLOCK"; message: string };
export function evaluateReadiness(input: { root: string; env: Record<string, string | undefined>; production?: boolean }): ReadinessResult[];
