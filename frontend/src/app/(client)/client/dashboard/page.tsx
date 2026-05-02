"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import api from "@/lib/api";

type Project = {
  _id: string;
  title: string;
  status: string;
  budget_min: number;
  budget_max: number;
  freelancer?: { name: string };
  created_at: string;
};

type Stats = {
  activeProjects: number;
  totalSpent: number;
  inEscrow: number;
  completed: number;
};

export default function ClientDashboard() {
  const [stats, setStats] = useState<Stats>({ activeProjects: 0, totalSpent: 0, inEscrow: 0, completed: 0 });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, projectsRes] = await Promise.allSettled([
          api.get("/jobs/client-stats"),
          api.get("/jobs/my-jobs"),
        ]);
        if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
        if (projectsRes.status === "fulfilled") setProjects(projectsRes.value.data.slice(0, 5));
      } catch {
        // API not ready yet — use defaults
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: "Active Projects", value: stats.activeProjects, color: "var(--color-ink)" },
    { label: "Total Spent", value: `₹${stats.totalSpent.toLocaleString("en-IN")}`, color: "var(--color-ink)" },
    { label: "In Escrow", value: `₹${stats.inEscrow.toLocaleString("en-IN")}`, color: "var(--color-accent)" },
    { label: "Completed", value: stats.completed, color: "var(--color-primary)" },
  ];

  const statusColor: Record<string, string> = {
    open: "var(--color-accent)",
    in_progress: "#6C63FF",
    completed: "var(--color-primary)",
    disputed: "var(--color-danger)",
  };

  return (
    <DashboardShell role="client">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display">Dashboard</h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-ink-3)" }}>
              Welcome back! Here&apos;s your project overview.
            </p>
          </div>
          <Link href="/client/post-job" className="btn-primary !py-2.5 !px-5 !text-sm">
            + Post a Job
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((s) => (
            <div key={s.label} className="card">
              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--color-ink-3)" }}>
                {s.label}
              </p>
              <p className="text-2xl font-mono font-bold" style={{ color: s.color }}>
                {loading ? "—" : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Recent Projects */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold">Recent Projects</h2>
            <Link href="/client/post-job" className="text-xs font-semibold" style={{ color: "var(--color-primary)" }}>
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: "var(--color-surface)" }} />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "var(--color-primary-lt)" }}
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--color-primary)" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="font-semibold mb-1">No projects yet</p>
              <p className="text-sm mb-4" style={{ color: "var(--color-ink-3)" }}>
                Post your first job to get started with TrustLance
              </p>
              <Link href="/client/post-job" className="btn-primary !py-2.5 !px-6 !text-sm">
                Post a Job
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((p) => (
                <Link
                  key={p._id}
                  href={`/client/projects/${p._id}`}
                  className="flex items-center justify-between p-4 rounded-xl transition-colors hover:bg-[var(--color-surface)]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-ink-3)" }}>
                      {p.freelancer?.name || "No freelancer assigned"} · ₹{p.budget_min?.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span
                    className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg"
                    style={{
                      backgroundColor: `${statusColor[p.status] || "var(--color-ink-3)"}15`,
                      color: statusColor[p.status] || "var(--color-ink-3)",
                    }}
                  >
                    {p.status?.replace("_", " ")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Link href="/client/wallet" className="card group hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--color-primary-lt)" }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--color-primary)" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm">Wallet</p>
                <p className="text-xs" style={{ color: "var(--color-ink-3)" }}>Add funds & view history</p>
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
                <p className="text-xs" style={{ color: "var(--color-ink-3)" }}>Chat with freelancers</p>
              </div>
            </div>
          </Link>
          <Link href="/notifications" className="card group hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#EAE9FF" }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#6C63FF" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm">Notifications</p>
                <p className="text-xs" style={{ color: "var(--color-ink-3)" }}>Stay updated</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
