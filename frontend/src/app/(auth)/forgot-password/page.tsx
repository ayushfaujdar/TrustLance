"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });
      setSent(true);
      toast.success("Reset instructions sent!");
    } catch {
      // We always show success to prevent email enumeration
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "var(--color-paper)" }}>
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-10 justify-center">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            T
          </div>
          <span className="text-lg font-bold tracking-tight">
            Trust<span style={{ color: "var(--color-primary)" }}>Lance</span>
          </span>
        </Link>

        {!sent ? (
          <div className="card animate-fade-up">
            <div className="text-center mb-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "var(--color-accent-lt)" }}
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--color-accent)" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 className="text-2xl font-display mb-1">Forgot password?</h1>
              <p className="text-sm" style={{ color: "var(--color-ink-3)" }}>
                No worries. Enter your email and we&apos;ll send reset instructions.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <label htmlFor="forgot-password-email" className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--color-ink-3)" }}>
                Email Address
              </label>
              <input
                id="forgot-password-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field mb-4"
                autoFocus
              />

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full !py-3.5 !rounded-2xl disabled:opacity-50"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <p className="text-center text-sm mt-6" style={{ color: "var(--color-ink-3)" }}>
              <Link href="/login" className="font-semibold" style={{ color: "var(--color-primary)" }}>
                ← Back to login
              </Link>
            </p>
          </div>
        ) : (
          <div className="card animate-fade-up text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "var(--color-primary-lt)" }}
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--color-primary)" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-display mb-2">Check your email</h1>
            <p className="text-sm mb-6" style={{ color: "var(--color-ink-3)" }}>
              If an account exists for <strong>{email}</strong>, we&apos;ve sent password reset instructions.
            </p>

            <Link href="/login" className="btn-primary w-full !py-3.5 !rounded-2xl inline-block text-center">
              Back to Login
            </Link>

            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="text-sm font-semibold mt-4 block mx-auto"
              style={{ color: "var(--color-ink-3)" }}
            >
              Try a different email
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
