
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { signInWithPassword } from "../services/authService";

// Replace these placeholders with your actual Supabase demo accounts.
const DEMO_ACCOUNTS = {
  manager: {
    email: "manager@mkinventory.com",
    password: "manager123",
  },
  staff: {
    email: "staff@mkinventory.com",
    password: "staff123",
  },
};

function LoginForm() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDemoOptions, setShowDemoOptions] = useState(false);

  function fillDemoAccount(role: "manager" | "staff") {
    setEmail(DEMO_ACCOUNTS[role].email);
    setPassword(DEMO_ACCOUNTS[role].password);
    setErrorMessage("");
    setShowDemoOptions(false);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSubmitting) return;

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await signInWithPassword(email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-mauve-600">
          Sign in
        </h1>

        <p className="mt-2 text-mauve-600">
          Sign in to your inventory account.
        </p>
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-md font-medium text-teal-900"
        >
          Email address
        </label>

        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={
            errorMessage ? "login-error" : undefined
          }
          disabled={isSubmitting}
          className="min-h-11 w-full rounded-lg border border-mauve-600 px-3 py-2 text-base outline-none transition focus:border-mauve-600 focus:ring-2 focus:ring-mauve-600 disabled:cursor-not-allowed disabled:bg-olive-50"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-md font-medium text-teal-900"
        >
          Password
        </label>

        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={
            errorMessage ? "login-error" : undefined
          }
          disabled={isSubmitting}
          className="min-h-11 w-full rounded-lg border border-mauve-600 px-3 py-2 text-base outline-none transition focus:border-mauve-600 focus:ring-2 focus:ring-mauve-600 disabled:cursor-not-allowed disabled:bg-olive-50"
        />
      </div>

      {errorMessage && (
        <p
          id="login-error"
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {errorMessage}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex min-h-11 flex-1 items-center justify-center rounded-lg bg-mauve-600 px-4 py-2 font-medium text-olive-50 transition hover:bg-mauve-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>

        <button
          type="button"
          onClick={() => setShowDemoOptions((current) => !current)}
          disabled={isSubmitting}
          aria-expanded={showDemoOptions}
          aria-controls="demo-options"
          className="flex min-h-11 flex-1 items-center justify-center rounded-lg border border-mauve-600 px-4 py-2 font-medium text-mauve-600 transition hover:bg-mauve-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Try Demo
        </button>
      </div>

      {showDemoOptions && (
        <div
          id="demo-options"
          className="space-y-3 rounded-xl border border-mauve-600 bg-olive-50 p-4"
        >
          <div>
            <h2 className="font-semibold text-mauve-600">
              Explore the Demo
            </h2>
            <p className="mt-1 text-sm text-mauve-600">
              Choose a role to fill in the login details.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fillDemoAccount("manager")}
            disabled={isSubmitting}
            className="min-h-10 w-full rounded-lg border border-mauve-600 bg-mauve-600 px-3 py-2 font-medium text-olive-50 transition hover:bg-mauve-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Auto-fill Manager
          </button>

          <button
            type="button"
            onClick={() => fillDemoAccount("staff")}
            disabled={isSubmitting}
            className="min-h-10 w-full rounded-lg border border-mauve-600 bg-mauve-600 px-3 py-2 font-medium text-olive-50 transition hover:bg-mauve-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Auto-fill Staff
          </button>

          <p className="text-xs text-mauve-600">
            Select a role, then click Sign in.
          </p>
        </div>
      )}
    </form>
  );
}

export default LoginForm;
