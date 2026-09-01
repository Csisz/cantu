import { describe, expect, it } from "vitest";
import { exceedsDeclaredBodyLimit, isTrustedMutationRequest } from "./request";

describe("mutation request hardening", () => {
  it("accepts same-origin browser mutations", () => expect(isTrustedMutationRequest(new Request("https://cantu.test/api/analyze", { method: "POST", headers: { origin: "https://cantu.test", "sec-fetch-site": "same-origin" } }))).toBe(true));
  it("rejects cross-site and mismatched origins", () => {
    expect(isTrustedMutationRequest(new Request("https://cantu.test/api/analyze", { method: "POST", headers: { "sec-fetch-site": "cross-site" } }))).toBe(false);
    expect(isTrustedMutationRequest(new Request("https://cantu.test/api/analyze", { method: "POST", headers: { origin: "https://evil.test" } }))).toBe(false);
  });
  it("fails closed for invalid or oversized declared lengths", () => {
    expect(exceedsDeclaredBodyLimit(new Request("https://cantu.test", { headers: { "content-length": "12001" } }), 12_000)).toBe(true);
    expect(exceedsDeclaredBodyLimit(new Request("https://cantu.test", { headers: { "content-length": "12" } }), 12_000)).toBe(false);
  });
});
