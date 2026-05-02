"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";

type Stats = {
  totalUsers: number;
  totalJobs: number;
  totalEscrow: number;
  activeDisputes: number;
  revenue: number;
  completedJobs: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalJobs: 0, totalEscrow: 0, activeDisputes: 0, revenue: 0, completedJobs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get("/admin/stats");
        setStats(data);
      } catch { /* defaults */ }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: "👥", color: "var(--color-primary)" },
    { label: "Active Jobs", value: stats.totalJobs, icon: "📋", color: "#6C63FF" },
    { label: "In Escrow", value: `₹${stats.totalEscrow.toLocaleString("en-IN")}`, icon: "🔒", color: "var(--color-accent)" },
    { label: "Disputes", value: stats.activeDisputes, icon: "⚠️", color: "var(--color-danger)" },
    { label: "Revenue", value: `₹${stats.revenue.toLocaleString("en-IN")}`, icon: "💰", color: "var(--color-primary)" },
    { label: "Completed", value: stats.completedJobs, icon: "✅", color: "var(--color-primary)" },
  ];

  const quickLinks = [
    { label: "Manage Users", href: "/admin/users", icon: "👥" },
    { label: "Disputes", href: "/admin/disputes", icon: "⚠️" },
    { label: "Analytics", href: "/admin/analytics", icon: "📊" },
  ];

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-paper)" }}>
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: "rgba(250,250,247,0.85)", backdropFilter: "blur(20px)", borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: "var(--color-primary)" }}>T</div>
            <span className="text-base font-bold tracking-tight">Trust<span style={{ color: "var(--color-primary)" }}>Lance</span></span>
          </Link>
          <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: "var(--color-danger-lt)", color: "var(--color-danger)" }}>Admin</span>
        </div>
        <button onClick={() => { localStorage.removeItem("accessToken"); window.location.href = "/login"; }} className="text-sm" style={{ color: "var(--color-ink-3)" }}>
          Sign Out
        </button>
      </header>

      <div className="max-w-6xl mx-auto p-6 md:p-8">
        <h1 className="text-3xl font-display mb-2">Admin Dashboard</h1>
        <p className="text-sm mb-8" style={{ color: "var(--color-ink-3)" }}>Platform overview and management</p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {cards.map((c) => (
            <div key={c.label} className="card text-center">
              <span className="text-2xl block mb-2">{c.icon}</span>
              <p className="text-xl font-mono font-bold" style={{ color: c.color }}>
                {loading ? "—" : c.value}
              </p>
              <p className="text-[10px] uppercase font-medium tracking-wider mt-1" style={{ color: "var(--color-ink-3)" }}>{c.label}</p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickLinks.map((l) => (
            <Link key={l.href} href={l.href} className="card group hover:shadow-md transition-shadow flex items-center gap-4">
              <span className="text-2xl">{l.icon}</span>
              <div>
                <p className="font-semibold text-sm">{l.label}</p>
                <p className="text-xs" style={{ color: "var(--color-ink-3)" }}>View & manage</p>
              </div>
              <svg className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
