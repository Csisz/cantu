export function isTrustedMutationRequest(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function rejectUntrustedMutation(request: Request) {
  return isTrustedMutationRequest(request)
    ? null
    : Response.json({ error: { code: "invalid_origin" } }, { status: 403 });
}

export function exceedsDeclaredBodyLimit(request: Request, maxBytes: number) {
  const raw = request.headers.get("content-length");
  if (!raw) return false;
  const length = Number(raw);
  return !Number.isFinite(length) || length < 0 || length > maxBytes;
}
