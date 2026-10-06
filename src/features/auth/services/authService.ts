import { supabase } from "../../../lib/supabase";

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

export async function signOut() {
  const { error } =
    await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getCurrentUserRole(
  userId: string,
): Promise<string> {
  if (!userId) {
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

  if (!data?.role) {
    throw new Error(
      "Your account does not have a role assigned.",
    );
  }

  return data.role;
}