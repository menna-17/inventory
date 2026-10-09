
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "../../lib/supabase";
import { getCurrentUserRole } from "../../features/auth/services/authService";

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

function isValidRole(value: unknown): value is Role {
  return (
    typeof value === "string" &&
    validRoles.includes(value as Role)
  );
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [session, setSession] =
    useState<Session | null>(null);

  const [role, setRole] =
    useState<Role | null>(null);

  const [roleUserId, setRoleUserId] =
    useState<string | null>(null);

  const [isInitializing, setIsInitializing] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let authEventReceived = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        authEventReceived = true;

        if (!isMounted) return;

        setSession(newSession);
      },
    );

    async function loadInitialSession() {
      try {
        const {
          data,
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (sessionError) {
          throw sessionError;
        }

        // Preserve a newer session received through an auth event.
        if (!authEventReceived) {
          setSession(data.session);
        }
      } catch (sessionError) {
        console.error(
          "Failed to restore initial session:",
          sessionError,
        );

        if (isMounted) {
          setError("Unable to restore your session.");
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    void loadInitialSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;
    const userId = session?.user.id;

    if (!userId) {
      return () => {
        isCurrent = false;
      };
    }

    async function loadRole() {
      try {
        const roleValue =
          await getCurrentUserRole(userId);

        if (!isCurrent) return;

        if (!isValidRole(roleValue)) {
          throw new Error(
            "Your account has an invalid role.",
          );
        }

        setRole(roleValue);
        setRoleUserId(userId);
        setError(null);
      } catch (roleError) {
        console.error(
          "AuthProvider role error:",
          roleError,
        );

        if (!isCurrent) return;

        setRole(null);
        setRoleUserId(null);
        setError(
          "Unable to load your account permissions. Please try again.",
        );
      }
    }

    void loadRole();

    return () => {
      isCurrent = false;
    };
  }, [session?.user.id]);

  const currentUserId = session?.user.id ?? null;

  const currentRole =
    currentUserId !== null &&
    currentUserId === roleUserId
      ? role
      : null;

  const hasRoleError =
    currentUserId !== null &&
    error !== null;

  const isLoading =
    isInitializing ||
    (currentUserId !== null &&
      currentRole === null &&
      !hasRoleError);

  const value = {
    session,
    user: session?.user ?? null,
    role: currentRole,
    isLoading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
