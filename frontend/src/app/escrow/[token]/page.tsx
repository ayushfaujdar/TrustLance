"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useRazorpay } from "@/lib/useRazorpay";
import toast from "react-hot-toast";

type EscrowData = {
  _id: string;
  title: string;
  description: string;
  amount: number;
  status: "pending" | "funded" | "released" | "disputed" | "refunded";
  creator: { name: string };
  createdAt: string;
};

export default function OpenEscrowPage() {
  const params = useParams();
  const token = params.token as string;
  const [escrow, setEscrow] = useState<EscrowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { openCheckout } = useRazorpay();

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/open-escrow/${token}`);
        setEscrow(data);
      } catch {
        setError("This escrow link is invalid or has expired.");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetch();
  }, [token]);

  const handlePay = async () => {
    if (!escrow) return;
    try {
      await openCheckout(escrow.amount);
      toast.success("Payment successful! Funds locked in escrow.");
      setEscrow((prev) => prev ? { ...prev, status: "funded" } : prev);
    } catch {
      toast.error("Payment failed");
    }
  };

  const statusStyles: Record<string, { color: string; bg: string; label: string }> = {
    pending: { color: "var(--color-accent)", bg: "var(--color-accent-lt)", label: "Awaiting Payment" },
    funded: { color: "var(--color-primary)", bg: "var(--color-primary-lt)", label: "Funds Locked" },
    released: { color: "var(--color-primary)", bg: "var(--color-primary-lt)", label: "Released" },
    disputed: { color: "var(--color-danger)", bg: "var(--color-danger-lt)", label: "Disputed" },
    refunded: { color: "var(--color-ink-3)", bg: "var(--color-surface)", label: "Refunded" },
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-paper)" }}>
        <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full" style={{ color: "var(--color-primary)" }} />
      </main>
    );
  }

  if (error || !escrow) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "var(--color-paper)" }}>
        <div className="card max-w-md w-full text-center p-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--color-danger-lt)" }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--color-danger)" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-display mb-2">Link Invalid</h2>
          <p className="text-sm mb-6" style={{ color: "var(--color-ink-3)" }}>{error}</p>
          <Link href="/" className="btn-primary !py-3 !px-6">Go to Home</Link>
        </div>
      </main>
    );
  }

  const s = statusStyles[escrow.status] || statusStyles.pending;

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "var(--color-paper)" }}>
      <div className="w-full max-w-lg">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: "var(--color-primary)" }}>T</div>
          <span className="text-lg font-bold tracking-tight">Trust<span style={{ color: "var(--color-primary)" }}>Lance</span></span>
        </Link>

        <div className="card p-8">
          {/* Status */}
          <div className="text-center mb-6">
            <span className="text-xs uppercase font-bold px-3 py-1 rounded-lg" style={{ backgroundColor: s.bg, color: s.color }}>
              {s.label}
            </span>
          </div>

          {/* Amount */}
          <div className="text-center mb-6">
            <p className="text-4xl font-mono font-bold" style={{ color: "var(--color-primary)" }}>
              ₹{escrow.amount.toLocaleString("en-IN")}
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--color-ink-3)" }}>
              Escrow Payment
            </p>
          </div>

          {/* Details */}
          <div className="space-y-3 mb-8 p-4 rounded-xl" style={{ backgroundColor: "var(--color-surface)" }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--color-ink-3)" }}>Title</span>
              <span className="font-semibold">{escrow.title}</span>
            </div>
            {escrow.description && (
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--color-ink-3)" }}>Description</span>
                <span className="text-right max-w-[60%]">{escrow.description}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--color-ink-3)" }}>From</span>
              <span className="font-semibold">{escrow.creator.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--color-ink-3)" }}>Created</span>
              <span>{new Date(escrow.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
          </div>

          {/* Action */}
          {escrow.status === "pending" && (
            <button onClick={handlePay} className="btn-primary w-full !py-4 !text-base !rounded-2xl" style={{ boxShadow: "0 8px 30px rgba(26, 107, 74, 0.25)" }}>
              Pay ₹{escrow.amount.toLocaleString("en-IN")} Securely
            </button>
          )}

          {escrow.status === "funded" && (
            <div className="text-center p-4 rounded-2xl" style={{ backgroundColor: "var(--color-primary-lt)" }}>
              <p className="font-semibold text-sm" style={{ color: "var(--color-primary)" }}>
                ✓ Funds are securely locked in escrow
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--color-ink-3)" }}>
                Funds will be released upon approval
              </p>
            </div>
          )}

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 mt-6 text-[10px] uppercase tracking-wider" style={{ color: "var(--color-ink-3)" }}>
            <span className="flex items-center gap-1">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Secured
            </span>
            <span>•</span>
            <span>256-bit Encrypted</span>
            <span>•</span>
            <span>Razorpay</span>
          </div>
        </div>
      </div>
    </main>
  );
}
