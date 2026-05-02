"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";

type DisputeRow = {
  _id: string;
  reason: string;
  status: string;
  contract: { title: string };
  client: { name: string };
  freelancer: { name: string };
  milestone: { amount: number };
  createdAt: string;
};

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get("/admin/disputes");
        setDisputes(data.disputes || data || []);
      } catch { setDisputes([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const statusStyles: Record<string, { color: string; bg: string }> = {
    open: { color: "var(--color-danger)", bg: "var(--color-danger-lt)" },
    under_review: { color: "var(--color-accent)", bg: "var(--color-accent-lt)" },
    resolved: { color: "var(--color-primary)", bg: "var(--color-primary-lt)" },
    closed: { color: "var(--color-ink-3)", bg: "var(--color-surface)" },
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-paper)" }}>
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: "rgba(250,250,247,0.85)", backdropFilter: "blur(20px)", borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-sm font-medium" style={{ color: "var(--color-ink-3)" }}>← Dashboard</Link>
          <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: "var(--color-danger-lt)", color: "var(--color-danger)" }}>Admin</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 md:p-8">
        <h1 className="text-3xl font-display mb-6">Disputes</h1>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ backgroundColor: "var(--color-surface)" }} />)}
          </div>
        ) : disputes.length === 0 ? (
          <div className="card text-center py-16">
            <span className="text-3xl block mb-2">✅</span>
            <p className="font-semibold mb-1">No disputes</p>
            <p className="text-sm" style={{ color: "var(--color-ink-3)" }}>All clear!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {disputes.map((d) => {
              const s = statusStyles[d.status] || statusStyles.open;
              return (
                <Link key={d._id} href={`/disputes/${d._id}`} className="card flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{d.contract?.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-ink-3)" }}>
                      {d.client?.name} vs {d.freelancer?.name} · ₹{d.milestone?.amount?.toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--color-ink-3)" }}>{d.reason}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg" style={{ backgroundColor: s.bg, color: s.color }}>
                      {d.status?.replace("_", " ")}
                    </span>
                    <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                      {new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
