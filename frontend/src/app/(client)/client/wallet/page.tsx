"use client";

import { useState, useEffect } from "react";
import { useRazorpay } from "@/lib/useRazorpay";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface WalletTransaction {
  _id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000, 25000];

export default function WalletPage() {
  const [walletBalance, setWalletBalance] = useState(0);
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [customAmount, setCustomAmount] = useState("");
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isLoadingTx, setIsLoadingTx] = useState(true);

  const { openCheckout, isProcessing } = useRazorpay({
    onSuccess: () => {
      // Refresh balance & transactions after successful payment
      fetchBalance();
      fetchTransactions();
    },
  });

  const fetchBalance = async () => {
    try {
      const { data } = await api.get("/wallet/balance");
      setWalletBalance(data.wallet_balance);
      setEscrowBalance(data.escrow_balance);
    } catch {
      // Not logged in or error — show zeros
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data } = await api.get("/wallet/transactions?limit=20");
      setTransactions(data.data || []);
    } catch {
      // Silently fail
    } finally {
      setIsLoadingTx(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  const handleDeposit = (amountInRupees: number) => {
    if (amountInRupees < 1) {
      toast.error("Minimum deposit is ₹1");
      return;
    }
    openCheckout(amountInRupees);
  };

  const handleCustomDeposit = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount < 1) {
      toast.error("Enter a valid amount (min ₹1)");
      return;
    }
    handleDeposit(amount);
  };

  const formatAmount = (paise: number) => {
    return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      deposit: { label: "Deposit", color: "var(--color-primary)" },
      escrow_lock: { label: "Escrow Lock", color: "var(--color-accent)" },
      escrow_release: { label: "Escrow Release", color: "var(--color-primary)" },
      withdrawal: { label: "Withdrawal", color: "var(--color-danger)" },
      refund: { label: "Refund", color: "var(--color-primary)" },
      platform_fee: { label: "Platform Fee", color: "var(--color-ink-3)" },
    };
    return labels[type] || { label: type, color: "var(--color-ink-3)" };
  };

  return (
    <main className="min-h-screen px-4 py-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-display mb-2">Wallet</h1>
        <p className="text-sm" style={{ color: "var(--color-ink-3)" }}>
          Manage your funds, add money, and track all transactions
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-ink-3)" }}>
            Available Balance
          </p>
          <p className="text-3xl font-mono font-bold" style={{ color: "var(--color-primary)" }}>
            {isLoadingBalance ? (
              <span className="skeleton inline-block w-32 h-8 rounded" />
            ) : (
              formatAmount(walletBalance)
            )}
          </p>
        </div>

        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-ink-3)" }}>
            In Escrow
          </p>
          <p className="text-3xl font-mono font-bold" style={{ color: "var(--color-accent)" }}>
            {isLoadingBalance ? (
              <span className="skeleton inline-block w-32 h-8 rounded" />
            ) : (
              formatAmount(escrowBalance)
            )}
          </p>
        </div>

        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-ink-3)" }}>
            Total Value
          </p>
          <p className="text-3xl font-mono font-bold">
            {isLoadingBalance ? (
              <span className="skeleton inline-block w-32 h-8 rounded" />
            ) : (
              formatAmount(walletBalance + escrowBalance)
            )}
          </p>
        </div>
      </div>

      {/* Add Funds Section */}
      <div className="card mb-10">
        <h2 className="text-xl font-display mb-4">Add Funds</h2>
        <p className="text-sm mb-6" style={{ color: "var(--color-ink-3)" }}>
          Select a preset amount or enter a custom amount. Payments are processed securely via Razorpay.
        </p>

        {/* Preset Amounts */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {PRESET_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => handleDeposit(amount)}
              disabled={isProcessing}
              className="py-3 px-4 rounded-xl font-mono font-semibold text-sm border-2 transition-all duration-150 hover:shadow-md active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: "var(--color-primary)",
                color: "var(--color-primary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-primary-lt)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              ₹{amount.toLocaleString()}
            </button>
          ))}
        </div>

        {/* Custom Amount */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-xs">
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-sm"
              style={{ color: "var(--color-ink-3)" }}
            >
              ₹
            </span>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Enter amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCustomDeposit()}
              className="input-field pl-8 font-mono"
              disabled={isProcessing}
            />
          </div>
          <button
            onClick={handleCustomDeposit}
            disabled={isProcessing || !customAmount}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </span>
            ) : (
              "Add Funds"
            )}
          </button>
        </div>

        {/* Security Note */}
        <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: "var(--color-ink-3)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Secured by Razorpay. 256-bit encryption. Test mode active.
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display">Transaction History</h2>
          <button
            onClick={() => { setIsLoadingTx(true); fetchTransactions(); }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "var(--color-primary)", backgroundColor: "var(--color-primary-lt)" }}
          >
            Refresh
          </button>
        </div>

        {isLoadingTx ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg mb-1" style={{ color: "var(--color-ink-3)" }}>No transactions yet</p>
            <p className="text-sm" style={{ color: "var(--color-ink-3)" }}>
              Add funds to get started
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const typeInfo = getTypeLabel(tx.type);
              const isPositive = tx.amount > 0;

              return (
                <div
                  key={tx._id}
                  className="flex items-center justify-between py-3 px-4 rounded-xl transition-colors hover:bg-surface"
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        backgroundColor: isPositive ? "var(--color-primary-lt)" : "var(--color-danger-lt)",
                        color: isPositive ? "var(--color-primary)" : "var(--color-danger)",
                      }}
                    >
                      {isPositive ? "+" : "−"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{tx.description}</p>
                      <p className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                        <span style={{ color: typeInfo.color }} className="font-medium">
                          {typeInfo.label}
                        </span>
                        {" · "}
                        {new Date(tx.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-sm font-mono font-bold"
                      style={{ color: isPositive ? "var(--color-primary)" : "var(--color-danger)" }}
                    >
                      {isPositive ? "+" : ""}
                      {formatAmount(Math.abs(tx.amount))}
                    </p>
                    <p className="text-xs font-mono" style={{ color: "var(--color-ink-3)" }}>
                      Bal: {formatAmount(tx.balance_after)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
