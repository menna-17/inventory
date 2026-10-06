import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export type Role =
  | "owner"
  | "manager"
  | "staff";

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  role: Role | null;
  isLoading: boolean;
  error: string | null;
};

export const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  );