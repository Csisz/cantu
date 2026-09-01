import { describe, expect, it } from "vitest";
import { accountDeletionSchema } from "./validation";
describe("account deletion confirmation", () => { it("requires the explicit Hungarian destructive phrase", () => { expect(accountDeletionSchema.safeParse({ confirmation: "TÖRLÉS" }).success).toBe(true); expect(accountDeletionSchema.safeParse({ confirmation: "törlés" }).success).toBe(true); expect(accountDeletionSchema.safeParse({ confirmation: "igen" }).success).toBe(false); }); });
