
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { signInWithPassword } from "../services/authService";

function LoginForm() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          aria-invalid="false"
          aria-describedby={
            errorMessage ? "login-error" : undefined
          }
          disabled={isSubmitting}
          className="min-h-11 w-full rounded-lg border border-mauve-600 px-3 py-2 text-base outline-none transition focus:border-mauve-600 focus:ring-2 focus:ring-mauve-600 disabled:cursor-not-allowed disabled:bg-olive-50 "
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
          aria-invalid="false"
          aria-describedby={
            errorMessage ? "login-error" : undefined
          }
          disabled={isSubmitting}
          className="min-h-11 w-full rounded-lg border border-mauve-600  px-3 py-2 text-base outline-none transition focus:border-mauve-600  focus:ring-2 focus:ring-mauve-600  disabled:cursor-not-allowed disabled:bg-olive-50 "
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

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex min-h-11 w-full items-center justify-center rounded-lg bg-mauve-600  px-4 py-2 font-medium text-olive-50 transition hover:bg-mauve-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

export default LoginForm;
