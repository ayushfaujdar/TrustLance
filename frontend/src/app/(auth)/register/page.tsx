"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";

type Role = "client" | "freelancer" | "escrow_user";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get("role") as Role) || "client";

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Role
  const [role, setRole] = useState<Role>(defaultRole);

  // Step 2: Details
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 3: OTP
  const [otp, setOtp] = useState("");

  const roles: { value: Role; label: string; description: string; icon: string }[] = [
    {
      value: "client",
      label: "I'm a Client",
      description: "I want to hire freelancers and pay securely",
      icon: "💼",
    },
    {
      value: "freelancer",
      label: "I'm a Freelancer",
      description: "I want to find work and get paid safely",
      icon: "🎨",
    },
    {
      value: "escrow_user",
      label: "Open Escrow Only",
      description: "I just want to send/receive secure payments",
      icon: "🔒",
    },
  ];

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!/[0-9]/.test(password)) {
      toast.error("Password must contain at least one number");
      return;
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      toast.error("Password must contain a special character");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
        role,
      });
      toast.success("Account created! Check your email for the OTP.");
      setStep(3);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/verify-email", {
        email: email.trim().toLowerCase(),
        otp,
      });
      localStorage.setItem("accessToken", data.accessToken);
      toast.success("Email verified! Welcome to TrustLance 🎉");

      if (role === "client") router.push("/client/dashboard");
      else if (role === "freelancer") router.push("/freelancer/dashboard");
      else router.push("/client/wallet");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Invalid OTP");
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
      toast.success(`Welcome to TrustLance, ${data.user.name}!`);

      const roles: string[] = data.user.role || [];
      if (roles.includes("admin")) router.push("/admin/dashboard");
      else if (roles.includes("freelancer")) router.push("/freelancer/dashboard");
      else router.push("/client/dashboard");
    } catch (error) {
      console.error("Google auth error", error);
      toast.error("Google registration failed");
    }
  };

  const passwordStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    if (password.length >= 12) score++;
    return score;
  };

  const strengthColors = ["var(--color-danger)", "var(--color-accent)", "var(--color-accent)", "var(--color-primary)"];
  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];

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
            Start your journey with trust
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
            Join thousands of freelancers and clients who use TrustLance for secure escrow payments,
            watermarked previews, and fair dispute resolution.
          </p>

          <div className="mt-10 space-y-4">
            {[
              "Funds secured in escrow before work begins",
              "Watermarked previews protect your deliverables",
              "Auto-release ensures freelancers always get paid",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{item}</span>
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
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
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

          {/* Progress */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: step >= s ? "var(--color-primary)" : "var(--color-surface)",
                }}
              />
            ))}
          </div>

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div className="animate-fade-up">
              <h1 className="text-3xl font-display mb-2">Create your account</h1>
              <p className="text-sm mb-8" style={{ color: "var(--color-ink-3)" }}>
                How will you use TrustLance?
              </p>

              <div className="space-y-3 mb-8">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className="w-full text-left p-4 rounded-2xl border-2 transition-all duration-150"
                    style={{
                      borderColor: role === r.value ? "var(--color-primary)" : "var(--color-border)",
                      backgroundColor: role === r.value ? "var(--color-primary-lt)" : "white",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{r.icon}</span>
                      <div>
                        <p className="font-semibold text-sm">{r.label}</p>
                        <p className="text-xs" style={{ color: "var(--color-ink-3)" }}>{r.description}</p>
                      </div>
                      {role === r.value && (
                        <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--color-primary)" }}>
                          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                className="btn-primary w-full !py-3.5 !rounded-2xl"
              >
                Continue
              </button>

              <p className="text-center text-sm mt-6" style={{ color: "var(--color-ink-3)" }}>
                Already have an account?{" "}
                <Link href="/login" className="font-semibold" style={{ color: "var(--color-primary)" }}>
                  Sign in
                </Link>
              </p>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="animate-fade-up">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm font-medium mb-6 hover:opacity-70 transition-opacity"
                style={{ color: "var(--color-ink-3)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <h1 className="text-3xl font-display mb-2">Your details</h1>
              <p className="text-sm mb-8" style={{ color: "var(--color-ink-3)" }}>
                Fill in your information to get started
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="register-name" className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--color-ink-3)" }}>
                    Full Name *
                  </label>
                  <input
                    id="register-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="input-field"
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="register-email" className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--color-ink-3)" }}>
                    Email Address *
                  </label>
                  <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field"
                  />
                </div>

                <div>
                  <label htmlFor="register-password" className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--color-ink-3)" }}>
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 chars, 1 number, 1 special"
                      className="input-field !pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
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
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{
                              backgroundColor: i < passwordStrength()
                                ? strengthColors[passwordStrength() - 1]
                                : "var(--color-surface)",
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-xs" style={{ color: strengthColors[passwordStrength() - 1] || "var(--color-ink-3)" }}>
                        {passwordStrength() > 0 ? strengthLabels[passwordStrength() - 1] : "Too short"}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="register-phone" className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--color-ink-3)" }}>
                    Phone (optional)
                  </label>
                  <input
                    id="register-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="input-field"
                  />
                </div>
              </div>

              <button
                onClick={handleRegister}
                disabled={isLoading}
                className="btn-primary w-full !py-3.5 !rounded-2xl mt-6 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>

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
                    toast.error("Google registration failed");
                  }}
                  theme="outline"
                  size="large"
                  shape="rectangular"
                  text="continue_with"
                  width="300px"
                />
              </div>

              <p className="text-center text-xs mt-4" style={{ color: "var(--color-ink-3)" }}>
                By creating an account, you agree to our{" "}
                <a href="#" className="underline">Terms</a> and{" "}
                <a href="#" className="underline">Privacy Policy</a>
              </p>
            </div>
          )}

          {/* Step 3: OTP Verification */}
          {step === 3 && (
            <div className="animate-fade-up text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: "var(--color-primary-lt)" }}
              >
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="var(--color-primary)" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h1 className="text-3xl font-display mb-2">Verify your email</h1>
              <p className="text-sm mb-8" style={{ color: "var(--color-ink-3)" }}>
                We sent a 6-digit code to <strong>{email}</strong>
              </p>

              <div className="max-w-[240px] mx-auto mb-6">
                <label htmlFor="register-otp" className="sr-only">
                  Verification code
                </label>
                <input
                  id="register-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="input-field !text-center !text-2xl !tracking-[0.5em] font-mono !py-4"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
                />
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={isLoading || otp.length !== 6}
                className="btn-primary w-full !py-3.5 !rounded-2xl disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Verify Email"}
              </button>

              <p className="text-sm mt-6" style={{ color: "var(--color-ink-3)" }}>
                Didn&apos;t receive the code?{" "}
                <button
                  onClick={handleRegister}
                  className="font-semibold"
                  style={{ color: "var(--color-primary)" }}
                >
                  Resend OTP
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full" style={{ color: "var(--color-primary)" }} />
      </main>
    }>
      <RegisterForm />
    </Suspense>
  );
}
