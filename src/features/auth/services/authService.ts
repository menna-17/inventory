
import { supabase } from "../../../lib/supabase";

export type UserRole = "owner" | "manager" | "staff";

function isUserRole(role: unknown): role is UserRole {
  return (
    role === "owner" ||
    role === "manager" ||
    role === "staff"
  );
}

export async function signInWithPassword(
  email: string,
  password: string,
) {
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    throw new Error("Email address is required.");
  }

  if (!password) {
    throw new Error("Password is required.");
  }

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getCurrentUserRole(
  userId: string,
): Promise<UserRole> {
  if (
    typeof userId !== "string" ||
    userId.trim().length === 0
  ) {
    throw new Error(
      "Authenticated user was not found.",
    );
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) {
    console.error(
      "getCurrentUserRole Supabase error:",
      error,
    );

    throw new Error(
      "Unable to load your user profile.",
    );
  }

  if (!isUserRole(data?.role)) {
    throw new Error(
      "Your account does not have a valid role assigned.",
    );
  }

  return data.role;
}
