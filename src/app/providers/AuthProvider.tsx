import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "../../lib/supabase";
import {
  getCurrentUserRole,
} from "../../features/auth/services/authService";

import {
  AuthContext,
  type Role,
} from "./auth-context";

type AuthProviderProps = {
  children: ReactNode;
};

const validRoles: Role[] = [
  "owner",
  "manager",
  "staff",
];

function isValidRole(
  value: string,
): value is Role {
  return validRoles.includes(
    value as Role,
  );
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [session, setSession] =
    useState<Session | null>(null);

  const [role, setRole] =
    useState<Role | null>(null);

  const [isInitializing, setIsInitializing] =
    useState(true);

  const [isRoleLoading, setIsRoleLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialSession() {
      const {
        data,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (sessionError) {
        console.error(
          "Failed to get initial session:",
          sessionError,
        );

        setError(
          "Unable to restore your session.",
        );
      }

      setSession(data.session);
      setIsInitializing(false);
    }

    void loadInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!isMounted) {
          return;
        }

        setSession(newSession);

        if (!newSession) {
          setRole(null);
          setError(null);
          setIsRoleLoading(false);
        }
      },
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadRole() {
      if (!session?.user.id) {
        setRole(null);
        setIsRoleLoading(false);
        return;
      }

      setIsRoleLoading(true);
      setError(null);

      try {
        const roleValue =
          await getCurrentUserRole(
            session.user.id,
          );

        if (!isMounted) {
          return;
        }

        if (!isValidRole(roleValue)) {
          throw new Error(
            `Unsupported account role: ${roleValue}`,
          );
        }

        setRole(roleValue);
      } catch (error) {
        console.error(
          "AuthProvider role error:",
          error,
        );

        if (!isMounted) {
          return;
        }

        setRole(null);

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load your account permissions.",
        );
      } finally {
        if (isMounted) {
          setIsRoleLoading(false);
        }
      }
    }

    void loadRole();

    return () => {
      isMounted = false;
    };
  }, [session?.user.id]);

  const isLoading =
    isInitializing ||
    (session !== null && isRoleLoading);

  const value = {
    session,
    user: session?.user ?? null,
    role,
    isLoading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}