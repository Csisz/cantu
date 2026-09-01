import { z } from "zod";

export const ACCOUNT_DELETE_CONFIRMATION = "TÖRLÉS";

export const accountDeletionSchema = z.object({
  confirmation: z.string().transform((value) => value.trim().toLocaleUpperCase("hu-HU"))
    .refine((value) => value === ACCOUNT_DELETE_CONFIRMATION, "A megerősítés nem egyezik."),
});

export type AccountActionState = { status: "idle" | "error"; message?: string };
export const initialAccountActionState: AccountActionState = { status: "idle" };
