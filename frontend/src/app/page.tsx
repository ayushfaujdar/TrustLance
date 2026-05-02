"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const STATS = [
  { value: "₹2.4Cr+", label: "Secured in Escrow" },
  { value: "4,200+", label: "Projects Completed" },
  { value: "98.2%", label: "Disputes Resolved" },
  { value: "12,000+", label: "Trusted Users" },
];

const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Escrow Protection",
    description: "Funds are locked in escrow the moment a milestone is funded. Neither party can access them until delivery is approved.",
    color: "var(--color-primary)",
    bg: "var(--color-primary-lt)",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    title: "Watermarked Previews",
    description: "Clients see watermarked previews before approval. Original files are only unlocked after payment is released.",
    color: "var(--color-accent)",
    bg: "var(--color-accent-lt)",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Fair Dispute Resolution",
    description: "If things go wrong, our support team reviews evidence from both sides and splits the escrow fairly.",
    color: "#6C63FF",
    bg: "#EAE9FF",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Auto-Release Timer",
    description: "If a client doesn't review within 7 days, funds are automatically released to the freelancer. No ghosting.",
    color: "var(--color-danger)",
    bg: "var(--color-danger-lt)",
  },
];

const STEPS = [
  { step: "01", title: "Post a Job or Share an Escrow Link", description: "Describe your project with milestones, or create a direct escrow link for any payment." },
  { step: "02", title: "Fund the Escrow", description: "Client deposits funds into a secure escrow account. Freelancer can see the funds are locked." },
  { step: "03", title: "Deliver & Preview", description: "Freelancer submits watermarked deliverables. Client reviews without accessing originals." },
  { step: "04", title: "Approve & Release", description: "Client approves → payment releases instantly. Original files unlock for download." },
];

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* ─── Navbar ─── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrollY > 50 ? "rgba(250,250,247,0.85)" : "transparent",
          backdropFilter: scrollY > 50 ? "blur(20px) saturate(180%)" : "none",
          borderBottom: scrollY > 50 ? "1px solid var(--color-border)" : "1px solid transparent",
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              T
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: "var(--color-ink)" }}>
              Trust<span style={{ color: "var(--color-primary)" }}>Lance</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: "var(--color-ink-2)" }}>
            <a href="#features" className="hover:opacity-70 transition-opacity">Features</a>
            <a href="#how-it-works" className="hover:opacity-70 transition-opacity">How It Works</a>
            <a href="#stats" className="hover:opacity-70 transition-opacity">Stats</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors hover:bg-surface">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary text-sm !py-2.5 !px-5">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center pt-20">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, var(--color-primary-lt) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-15"
            style={{
              background: "radial-gradient(circle, var(--color-accent-lt) 0%, transparent 70%)",
            }}
          />
        </div>

        {/* Badge */}
        <div className="animate-fade-up mb-6">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: "var(--color-primary-lt)", color: "var(--color-primary)" }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--color-primary)" }} />
            Secure Escrow · Zero Fraud
          </span>
        </div>

        {/* Heading */}
        <h1
          className="text-5xl md:text-7xl lg:text-8xl font-display max-w-5xl leading-[1.05] animate-fade-up"
          style={{ color: "var(--color-ink)" }}
        >
          The escrow platform built on{" "}
          <span
            style={{
              background: "linear-gradient(135deg, var(--color-primary) 0%, #2D9D6F 50%, var(--color-accent) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            trust
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="mt-6 text-lg md:text-xl max-w-2xl leading-relaxed animate-fade-up-delay-1"
          style={{ color: "var(--color-ink-3)" }}
        >
          Funds locked in escrow. Watermarked previews. Auto-release timers. 
          Fair dispute resolution. Finally, freelancing without the fear.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-10 animate-fade-up-delay-2">
          <Link
            href="/register?role=client"
            className="btn-primary !py-4 !px-8 !text-base !rounded-2xl shadow-lg"
            style={{ boxShadow: "0 8px 30px rgba(26, 107, 74, 0.25)" }}
          >
            Post a Job — Free
          </Link>
          <Link
            href="/register?role=freelancer"
            className="btn-outline !py-4 !px-8 !text-base !rounded-2xl"
          >
            Find Work →
          </Link>
        </div>

        {/* Trust bar */}
        <div
          className="mt-16 flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm animate-fade-up-delay-2"
          style={{ color: "var(--color-ink-3)" }}
        >
          <span className="flex items-center gap-2">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Razorpay Secured
          </span>
          <span className="hidden sm:block w-1 h-1 rounded-full" style={{ backgroundColor: "var(--color-ink-3)" }} />
          <span className="flex items-center gap-2">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            256-bit Encryption
          </span>
          <span className="hidden sm:block w-1 h-1 rounded-full" style={{ backgroundColor: "var(--color-ink-3)" }} />
          <span>₹0 platform fee for first project</span>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section id="stats" className="py-16 px-6" style={{ backgroundColor: "var(--color-ink)" }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl md:text-4xl font-mono font-bold text-white mb-1">
                {stat.value}
              </p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--color-primary)" }}
            >
              Why TrustLance
            </span>
            <h2 className="text-4xl md:text-5xl font-display mt-3" style={{ color: "var(--color-ink)" }}>
              Built for trust, not just transactions
            </h2>
            <p className="text-lg mt-4 max-w-2xl mx-auto" style={{ color: "var(--color-ink-3)" }}>
              Every feature exists to protect both parties and make freelancing frictionless.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="card group cursor-default"
                style={{ borderColor: "transparent" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = feature.color;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 40px ${feature.color}15`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                  (e.currentTarget as HTMLElement).style.boxShadow = "";
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: feature.bg, color: feature.color }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--color-ink)" }}>
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-ink-3)" }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-24 px-6" style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--color-accent)" }}
            >
              How It Works
            </span>
            <h2 className="text-4xl md:text-5xl font-display mt-3" style={{ color: "var(--color-ink)" }}>
              Four steps to a safe transaction
            </h2>
          </div>

          <div className="space-y-8">
            {STEPS.map((step, index) => (
              <div
                key={step.step}
                className="flex gap-6 items-start"
              >
                <div
                  className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center font-mono font-bold text-lg"
                  style={{
                    backgroundColor: index === 0 ? "var(--color-primary)" : "white",
                    color: index === 0 ? "white" : "var(--color-ink-3)",
                    border: index !== 0 ? "2px solid var(--color-border)" : "none",
                  }}
                >
                  {step.step}
                </div>
                <div className="pt-1">
                  <h3 className="text-lg font-bold mb-1" style={{ color: "var(--color-ink)" }}>
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-ink-3)" }}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-display mb-4" style={{ color: "var(--color-ink)" }}>
            Ready to freelance without fear?
          </h2>
          <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: "var(--color-ink-3)" }}>
            Join thousands of freelancers and clients who trust TrustLance for secure, 
            transparent transactions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="btn-primary !py-4 !px-10 !text-base !rounded-2xl shadow-lg"
              style={{ boxShadow: "0 8px 30px rgba(26, 107, 74, 0.25)" }}
            >
              Create Free Account
            </Link>
            <Link
              href="/login"
              className="btn-outline !py-4 !px-10 !text-base !rounded-2xl"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer
        className="py-12 px-6"
        style={{
          backgroundColor: "var(--color-ink)",
          color: "rgba(255,255,255,0.4)",
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              T
            </div>
            <span className="text-sm text-white font-semibold">
              Trust<span style={{ color: "var(--color-primary)" }}>Lance</span>
            </span>
          </div>

          <div className="flex gap-8 text-xs">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>

          <p className="text-xs">
            © {new Date().getFullYear()} TrustLance. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
