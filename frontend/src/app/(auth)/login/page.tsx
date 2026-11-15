"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      localStorage.setItem("accessToken", data.accessToken);
      toast.success(`Welcome back, ${data.user.name}!`);

      // Route based on role
      const roles: string[] = data.user.role || [];
      if (roles.includes("admin")) router.push("/admin/dashboard");
      else if (roles.includes("freelancer")) router.push("/freelancer/dashboard");
      else router.push("/client/dashboard");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err?.response?.data?.message || "Login failed";
      toast.error(msg);

      // If unverified, offer to redirect
      if (msg.includes("verify")) {
        toast("Redirecting to verify...", { icon: "📧" });
        setTimeout(() => router.push("/register"), 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const { data } = await api.post("/auth/google", {
        credential: credentialResponse.credential,
      });

      localStorage.setItem("accessToken", data.accessToken);
      toast.success(`Welcome back, ${data.user.name}!`);

      const roles: string[] = data.user.role || [];
      if (roles.includes("admin")) router.push("/admin/dashboard");
      else if (roles.includes("freelancer")) router.push("/freelancer/dashboard");
      else router.push("/client/dashboard");
    } catch (error) {
      console.error("Google auth error", error);
      toast.error("Google login failed");
    }
  };

  return (
    <main className="min-h-screen flex">
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12"
        style={{ backgroundColor: "var(--color-ink)" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            T
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            Trust<span style={{ color: "var(--color-primary)" }}>Lance</span>
          </span>
        </Link>

        <div>
          <h2 className="text-4xl font-display text-white leading-tight mb-4">
            Welcome back
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
            Sign in to manage your projects, track escrow payments, and communicate with your team.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { value: "₹2.4Cr+", label: "In Escrow" },
              { value: "4,200+", label: "Completed" },
              { value: "98.2%", label: "Resolved" },
              { value: "12K+", label: "Users" },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                <p className="text-xl font-mono font-bold text-white">{stat.value}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          © {new Date().getFullYear()} TrustLance. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-10">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              T
            </div>
            <span className="text-base font-bold tracking-tight">
              Trust<span style={{ color: "var(--color-primary)" }}>Lance</span>
            </span>
          </Link>

          <div className="animate-fade-up">
            <h1 className="text-3xl font-display mb-2">Sign in</h1>
            <p className="text-sm mb-8" style={{ color: "var(--color-ink-3)" }}>
              Enter your credentials to access your account
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--color-ink-3)" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field"
                  autoFocus
                  autoComplete="email"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-ink-3)" }}>
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold"
                    style={{ color: "var(--color-primary)" }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input-field !pr-12"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                    style={{ color: "var(--color-ink-3)" }}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full !py-3.5 !rounded-2xl disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: "1px solid var(--color-border)" }} />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-3" style={{ backgroundColor: "var(--color-paper)", color: "var(--color-ink-3)" }}>or</span>
              </div>
            </div>

            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  toast.error("Google login failed");
                }}
                theme="outline"
                size="large"
                shape="rectangular"
                text="continue_with"
                width="300px"
              />
            </div>

            <p className="text-center text-sm mt-8" style={{ color: "var(--color-ink-3)" }}>
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold" style={{ color: "var(--color-primary)" }}>
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
