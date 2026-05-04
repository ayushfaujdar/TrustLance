"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import api from "@/lib/api";

type Stats = {
  activeContracts: number;
  earnings: number;
  pending: number;
  completedContracts: number;
};

type Contract = {
  _id: string;
  title: string;
  status: string;
  budget: number;
  agreed_price?: number;
  client?: { name: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client_id?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  job_id?: any;
  updatedAt: string;
};

export default function FreelancerDashboard() {
  const [stats, setStats] = useState<Stats>({ activeContracts: 0, earnings: 0, pending: 0, completedContracts: 0 });
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, contractsRes] = await Promise.allSettled([
          api.get("/freelancer/stats"),
          api.get("/freelancer/contracts"),
        ]);
        if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
        if (contractsRes.status === "fulfilled") setContracts(contractsRes.value.data.slice(0, 5));
      } catch {
        // defaults
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: "Active Contracts", value: stats.activeContracts || 0, color: "var(--color-ink)", icon: "📋" },
    { label: "Total Earned", value: `₹${(stats.earnings || 0).toLocaleString("en-IN")}`, color: "var(--color-primary)", icon: "💰" },
    { label: "Pending Payments", value: `₹${(stats.pending || 0).toLocaleString("en-IN")}`, color: "var(--color-accent)", icon: "⏳" },
    { label: "Completed Jobs", value: stats.completedContracts || 0, color: "#6C63FF", icon: "✅" },
  ];

  const statusColor: Record<string, string> = {
    active: "#6C63FF",
    in_progress: "var(--color-accent)",
    review: "var(--color-accent)",
    completed: "var(--color-primary)",
    disputed: "var(--color-danger)",
  };

  return (
    <DashboardShell role="freelancer">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display">Dashboard</h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-ink-3)" }}>
              Your freelancing overview at a glance
            </p>
          </div>
          <Link href="/freelancer/find-work" className="btn-primary !py-2.5 !px-5 !text-sm">
            🔍 Find Work
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((s) => (
            <div key={s.label} className="card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-ink-3)" }}>
                  {s.label}
                </p>
                <span className="text-lg">{s.icon}</span>
              </div>
              <p className="text-2xl font-mono font-bold" style={{ color: s.color }}>
                {loading ? "—" : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Active Contracts */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold">Active Contracts</h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: "var(--color-surface)" }} />
              ))}
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-12">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "var(--color-accent-lt)" }}
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--color-accent)" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-semibold mb-1">No active contracts</p>
              <p className="text-sm mb-4" style={{ color: "var(--color-ink-3)" }}>
                Browse available jobs and submit your first bid
              </p>
              <Link href="/freelancer/find-work" className="btn-primary !py-2.5 !px-6 !text-sm">
                Find Work
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {contracts.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between p-4 rounded-xl transition-colors hover:bg-[var(--color-surface)] cursor-default"
                >
                  <div className="flex-1 min-w-0">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <p className="font-semibold text-sm truncate">{c.job_id ? (c.job_id as any).title : c.title}</p>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-ink-3)" }}>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(c.client_id as any)?.name || c.client?.name || "Client"} · ₹{c.agreed_price?.toLocaleString("en-IN") || c.budget?.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span
                    className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg"
                    style={{
                      backgroundColor: `${statusColor[c.status] || "var(--color-ink-3)"}15`,
                      color: statusColor[c.status] || "var(--color-ink-3)",
                    }}
                  >
                    {c.status?.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/freelancer/earnings" className="card group hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--color-primary-lt)" }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--color-primary)" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm">Earnings</p>
                <p className="text-xs" style={{ color: "var(--color-ink-3)" }}>Track income & withdrawals</p>
              </div>
            </div>
          </Link>
          <Link href="/messages" className="card group hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--color-accent-lt)" }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--color-accent)" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm">Messages</p>
                <p className="text-xs" style={{ color: "var(--color-ink-3)" }}>Chat with clients</p>
              </div>
            </div>
          </Link>
          <Link href="/freelancer/find-work" className="card group hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#EAE9FF" }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#6C63FF" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm">Browse Jobs</p>
                <p className="text-xs" style={{ color: "var(--color-ink-3)" }}>Find new opportunities</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
