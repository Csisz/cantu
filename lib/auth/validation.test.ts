import { describe, expect, it } from "vitest";
import { authErrorMessage, parseSignInForm, signUpSchema } from "./validation";

describe("authentication input validation", () => {
  it("accepts valid credentials and trims the email", () => {
    const form = new FormData();
    form.set("email", "  tanulo@example.com  ");
    form.set("password", "biztonsagos-jelszo");

    expect(parseSignInForm(form)).toEqual({
      success: true,
      data: { email: "tanulo@example.com", password: "biztonsagos-jelszo" },
    });
  });

  it("returns Hungarian field errors for invalid credentials", () => {
    const form = new FormData();
    form.set("email", "hibas");
    form.set("password", "rovid");

    const result = parseSignInForm(form);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors?.email?.[0]).toMatch(/e-mail/i);
      expect(result.fieldErrors?.password?.[0]).toMatch(/8 karakter/i);
    }
  });

  it("rejects arbitrary identity fields instead of trusting a client user id", () => {
    expect(
      signUpSchema.safeParse({
        displayName: "Teszt Tanuló",
        email: "tanulo@example.com",
        password: "biztonsagos-jelszo",
        userId: "10000000-0000-0000-0000-000000000001",
      }).success,
    ).toBe(false);
  });

  it("maps provider errors without exposing raw infrastructure messages", () => {
    expect(authErrorMessage("invalid_credentials")).toMatch(/jelszó/i);
    expect(authErrorMessage("unknown-provider-detail")).not.toContain("provider");
  });
});
