export type AuthUserDTO = {
  id: string;
  email: string;
  displayName: string | null;
};

export type AuthContext =
  | { status: "authenticated"; configured: true; user: AuthUserDTO }
  | { status: "unauthenticated"; configured: boolean };

export type AuthField = "displayName" | "email" | "password";

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<AuthField, string[]>>;
};

export const initialAuthActionState: AuthActionState = { status: "idle" };
