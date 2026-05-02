"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";

type AnalyticsData = {
  monthlyRevenue: { month: string; amount: number }[];
  userGrowth: { month: string; count: number }[];
  topCategories: { name: string; count: number }[];
  escrowVolume: number;
  disputeRate: number;
  avgProjectSize: number;
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    monthlyRevenue: [],
    userGrowth: [],
    topCategories: [],
    escrowVolume: 0,
    disputeRate: 0,
    avgProjectSize: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: d } = await api.get("/admin/analytics");
        setData(d);
      } catch { /* defaults */ }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const metricCards = [
    { label: "Escrow Volume", value: `₹${data.escrowVolume.toLocaleString("en-IN")}`, color: "var(--color-primary)", icon: "🔒" },
    { label: "Dispute Rate", value: `${data.disputeRate}%`, color: data.disputeRate > 5 ? "var(--color-danger)" : "var(--color-primary)", icon: "⚖️" },
    { label: "Avg Project Size", value: `₹${data.avgProjectSize.toLocaleString("en-IN")}`, color: "var(--color-accent)", icon: "📊" },
  ];

  const maxRevenue = Math.max(...(data.monthlyRevenue.map((r) => r.amount)), 1);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-paper)" }}>
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: "rgba(250,250,247,0.85)", backdropFilter: "blur(20px)", borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-sm font-medium" style={{ color: "var(--color-ink-3)" }}>← Dashboard</Link>
          <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: "var(--color-danger-lt)", color: "var(--color-danger)" }}>Admin</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 md:p-8">
        <h1 className="text-3xl font-display mb-2">Analytics</h1>
        <p className="text-sm mb-8" style={{ color: "var(--color-ink-3)" }}>Platform performance metrics</p>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {metricCards.map((m) => (
            <div key={m.label} className="card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-ink-3)" }}>{m.label}</p>
                <span className="text-lg">{m.icon}</span>
              </div>
              <p className="text-3xl font-mono font-bold" style={{ color: m.color }}>
                {loading ? "—" : m.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart (CSS bar chart) */}
          <div className="card">
            <h3 className="font-bold text-sm mb-4">Monthly Revenue</h3>
            {loading ? (
              <div className="h-48 rounded-xl animate-pulse" style={{ backgroundColor: "var(--color-surface)" }} />
            ) : data.monthlyRevenue.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "var(--color-ink-3)" }}>No revenue data yet</p>
            ) : (
              <div className="flex items-end gap-2 h-48">
                {data.monthlyRevenue.map((r) => (
                  <div key={r.month} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div
                      className="w-full rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${(r.amount / maxRevenue) * 100}%`,
                        minHeight: "4px",
                        backgroundColor: "var(--color-primary)",
                        opacity: 0.8,
                      }}
                    />
                    <p className="text-[9px] mt-2 font-medium" style={{ color: "var(--color-ink-3)" }}>{r.month}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Categories */}
          <div className="card">
            <h3 className="font-bold text-sm mb-4">Top Categories</h3>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-8 rounded-lg animate-pulse" style={{ backgroundColor: "var(--color-surface)" }} />)}
              </div>
            ) : data.topCategories.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "var(--color-ink-3)" }}>No category data yet</p>
            ) : (
              <div className="space-y-3">
                {data.topCategories.map((cat, i) => {
                  const maxCount = Math.max(...data.topCategories.map((c) => c.count), 1);
                  const colors = ["var(--color-primary)", "var(--color-accent)", "#6C63FF", "var(--color-danger)", "var(--color-ink-3)"];
                  return (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{cat.name}</p>
                        <p className="text-xs font-mono" style={{ color: "var(--color-ink-3)" }}>{cat.count}</p>
                      </div>
                      <div className="h-2 rounded-full" style={{ backgroundColor: "var(--color-surface)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(cat.count / maxCount) * 100}%`,
                            backgroundColor: colors[i % colors.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
