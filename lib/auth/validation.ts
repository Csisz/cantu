import { z } from "zod";
import type { AuthActionState, AuthField } from "./types";

const email = z
  .string()
  .trim()
  .email("Adj meg egy érvényes e-mail-címet.")
  .max(254, "Az e-mail-cím túl hosszú.");

const password = z
  .string()
  .min(8, "A jelszó legalább 8 karakter legyen.")
  .max(128, "A jelszó legfeljebb 128 karakter lehet.");

export const signInSchema = z
  .object({
    email,
    password,
  })
  .strict();

export const signUpSchema = z
  .object({
    displayName: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z
        .string()
        .trim()
        .min(2, "A megjelenített név legalább 2 karakter legyen.")
        .max(80, "A megjelenített név legfeljebb 80 karakter lehet.")
        .optional(),
    ),
    email,
    password,
  })
  .strict();

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

function fieldErrors(error: z.ZodError): AuthActionState["fieldErrors"] {
  const allowed: AuthField[] = ["displayName", "email", "password"];
  const errors: Partial<Record<AuthField, string[]>> = {};

  error.issues.forEach((issue) => {
    const candidate = issue.path[0];
    if (typeof candidate !== "string" || !allowed.includes(candidate as AuthField)) return;
    const field = candidate as AuthField;
    errors[field] = [...(errors[field] ?? []), issue.message];
  });

  return errors;
}

export function parseSignInForm(formData: FormData) {
  const result = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  return result.success
    ? { success: true as const, data: result.data }
    : { success: false as const, fieldErrors: fieldErrors(result.error) };
}

export function parseSignUpForm(formData: FormData) {
  const result = signUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  return result.success
    ? { success: true as const, data: result.data }
    : { success: false as const, fieldErrors: fieldErrors(result.error) };
}

export function authErrorMessage(code?: string) {
  switch (code) {
    case "invalid_credentials":
      return "Az e-mail-cím vagy a jelszó nem megfelelő.";
    case "email_not_confirmed":
      return "Előbb erősítsd meg az e-mail-címedet.";
    case "user_already_exists":
    case "email_exists":
      return "Ehhez az e-mail-címhez már tartozik fiók.";
    case "weak_password":
      return "Válassz erősebb, legalább 8 karakteres jelszót.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Túl sok próbálkozás történt. Próbáld meg később.";
    default:
      return "Most nem sikerült a fiókművelet. Próbáld meg újra.";
  }
}
