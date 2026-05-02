"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import api from "@/lib/api";
import toast from "react-hot-toast";

type Transaction = {
  _id: string;
  type: "earning" | "withdrawal" | "refund" | "deposit";
  amount: number;
  description: string;
  status: string;
  created_at: string;
};

export default function EarningsPage() {
  const [balance, setBalance] = useState(0);
  const [pending, setPending] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [balRes, txRes] = await Promise.allSettled([
          api.get("/wallet/balance"),
          api.get("/wallet/transactions"),
        ]);
        if (balRes.status === "fulfilled") {
          setBalance(balRes.value.data.balance || 0);
          setPending(balRes.value.data.pending || 0);
          setTotalEarned(balRes.value.data.totalEarned || 0);
        }
        if (txRes.status === "fulfilled") setTransactions(txRes.value.data.data || txRes.value.data || []);
      } catch {
        // defaults
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt < 100) return toast.error("Minimum withdrawal is ₹100");
    if (amt > balance) return toast.error("Insufficient balance");
    try {
      await api.post("/wallet/withdraw", { amount: amt });
      toast.success("Withdrawal initiated!");
      setBalance((b) => b - amt);
      setShowWithdraw(false);
      setWithdrawAmount("");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Withdrawal failed");
    }
  };

  const typeStyles: Record<string, { color: string; bg: string; label: string }> = {
    earning: { color: "var(--color-primary)", bg: "var(--color-primary-lt)", label: "Earning" },
    withdrawal: { color: "var(--color-accent)", bg: "var(--color-accent-lt)", label: "Withdrawal" },
    refund: { color: "var(--color-danger)", bg: "var(--color-danger-lt)", label: "Refund" },
  };

  return (
    <DashboardShell role="freelancer">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display">Earnings</h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-ink-3)" }}>Track your income and withdrawals</p>
          </div>
          <button onClick={() => setShowWithdraw(!showWithdraw)} className="btn-primary !py-2.5 !px-5 !text-sm">
            Withdraw Funds
          </button>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card" style={{ borderLeft: "4px solid var(--color-primary)" }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-ink-3)" }}>Available Balance</p>
            <p className="text-3xl font-mono font-bold" style={{ color: "var(--color-primary)" }}>
              {loading ? "—" : `₹${balance.toLocaleString("en-IN")}`}
            </p>
          </div>
          <div className="card" style={{ borderLeft: "4px solid var(--color-accent)" }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-ink-3)" }}>Pending in Escrow</p>
            <p className="text-3xl font-mono font-bold" style={{ color: "var(--color-accent)" }}>
              {loading ? "—" : `₹${pending.toLocaleString("en-IN")}`}
            </p>
          </div>
          <div className="card" style={{ borderLeft: "4px solid var(--color-ink)" }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-ink-3)" }}>Total Earned</p>
            <p className="text-3xl font-mono font-bold">
              {loading ? "—" : `₹${totalEarned.toLocaleString("en-IN")}`}
            </p>
          </div>
        </div>

        {/* Withdraw panel */}
        {showWithdraw && (
          <div className="card mb-6 animate-fade-up" style={{ borderColor: "var(--color-primary)", borderWidth: "2px" }}>
            <h3 className="font-bold mb-3">Withdraw to Bank Account</h3>
            <div className="flex gap-3">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Amount (₹)"
                className="input-field flex-1"
                min={100}
                max={balance}
              />
              <button onClick={handleWithdraw} className="btn-primary !px-6">Withdraw</button>
              <button onClick={() => setShowWithdraw(false)} className="btn-outline">Cancel</button>
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--color-ink-3)" }}>
              Minimum ₹100. Processed within 2-3 business days.
            </p>
          </div>
        )}

        {/* Transaction History */}
        <div className="card">
          <h2 className="text-lg font-bold mb-5">Transaction History</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl animate-pulse" style={{ backgroundColor: "var(--color-surface)" }} />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "var(--color-ink-3)" }}>No transactions yet. Complete a project to start earning!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const style = typeStyles[tx.type] || typeStyles.earning;
                return (
                  <div key={tx._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--color-surface)] transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: style.bg, color: style.color }}>
                        {style.label}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{tx.description}</p>
                        <p className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                          {new Date(tx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <p className="font-mono font-bold text-sm" style={{ color: tx.type === "earning" ? "var(--color-primary)" : "var(--color-ink)" }}>
                      {tx.type === "earning" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
