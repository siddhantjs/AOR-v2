"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/common/LogoMark";
import { controlClass, errorClass, hintClass, labelClass } from "@/components/ui";
import { api } from "@/lib/api";

export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      const data = await api.login({
        email: email.trim(),
        username: username.trim(),
      });
      router.push(data.redirectTo ?? `/dashboard/${data.userId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-muted)] text-[var(--ink)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
        <div className="mx-auto flex h-[var(--header-h)] max-w-[var(--max)] items-center px-[22px]">
          <Link href="/" className="flex items-center gap-1">
            <LogoMark />
            <span className="font-[family-name:var(--font-display)] text-[17px] font-extrabold tracking-[-0.02em] text-[var(--navy)]">
              AOR<span className="text-[var(--red)]">Track</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-[var(--max-narrow)] flex-col px-[22px] pt-10 pb-[100px]">
        <div className="mb-6">
          <div className="text-xs font-bold tracking-[0.09em] text-[var(--red)] uppercase">
            Welcome back
          </div>
          <h1 className="mt-1.5 mb-1 text-[28px] font-extrabold tracking-[-0.03em] text-[var(--navy)]">
            Open your timeline
          </h1>
          <p className="m-0 text-sm text-[var(--muted)]">
            Enter the email and username you used when you started tracking.
          </p>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-7 shadow-[var(--shadow-md)] sm:px-8"
        >
          <div className="grid gap-5">
            <div>
              <label htmlFor="login-email" className={labelClass()}>
                Email <span className="text-[var(--red)]">*</span>
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                className={controlClass(Boolean(error))}
                value={email}
                placeholder="you@example.com"
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                required
              />
            </div>

            <div>
              <label htmlFor="login-username" className={labelClass()}>
                Username <span className="text-[var(--red)]">*</span>
              </label>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                className={controlClass(Boolean(error))}
                value={username}
                placeholder="your_username"
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                required
              />
              <p className={hintClass()}>
                Same public display name you chose on the application step.
              </p>
            </div>
          </div>

          {error ? (
            <p className={errorClass()} role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/track"
              className="text-[13px] font-semibold text-[var(--muted)] underline-offset-2 hover:text-[var(--navy)] hover:underline"
            >
              New here? Start tracking
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-[10px] bg-[var(--red)] px-[22px] py-[11px] font-[family-name:var(--font-display)] text-sm font-bold text-[var(--on-navy)] transition-[var(--ease)] hover:bg-[var(--red2)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {submitting ? "Checking…" : "Open dashboard"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
