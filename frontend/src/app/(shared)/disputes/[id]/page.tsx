"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import api from "@/lib/api";
import toast from "react-hot-toast";

type Dispute = {
  _id: string;
  reason: string;
  description: string;
  status: "open" | "under_review" | "resolved" | "closed";
  resolution?: string;
  contract: { title: string; _id: string };
  milestone: { title: string; amount: number };
  client: { name: string };
  freelancer: { name: string };
  createdAt: string;
  messages: { sender: string; content: string; createdAt: string }[];
};

export default function DisputeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/disputes/${id}`);
        setDispute(data);
      } catch {
        setDispute(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetch();
  }, [id]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await api.post(`/disputes/${id}/message`, { content: newMessage.trim() });
      toast.success("Message sent");
      setNewMessage("");
    } catch {
      toast.error("Failed to send");
    }
  };

  const statusStyles: Record<string, { color: string; bg: string }> = {
    open: { color: "var(--color-danger)", bg: "var(--color-danger-lt)" },
    under_review: { color: "var(--color-accent)", bg: "var(--color-accent-lt)" },
    resolved: { color: "var(--color-primary)", bg: "var(--color-primary-lt)" },
    closed: { color: "var(--color-ink-3)", bg: "var(--color-surface)" },
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="max-w-3xl mx-auto space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ backgroundColor: "var(--color-surface)" }} />)}
        </div>
      </DashboardShell>
    );
  }

  if (!dispute) {
    return (
      <DashboardShell>
        <div className="max-w-3xl mx-auto text-center py-20">
          <p className="text-lg font-semibold mb-2">Dispute not found</p>
          <Link href="/client/dashboard" className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>← Back</Link>
        </div>
      </DashboardShell>
    );
  }

  const s = statusStyles[dispute.status] || statusStyles.open;

  return (
    <DashboardShell>
      <div className="max-w-3xl mx-auto">
        <Link href="/client/dashboard" className="text-xs font-medium mb-4 inline-block" style={{ color: "var(--color-ink-3)" }}>← Back</Link>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-display">Dispute</h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-ink-3)" }}>
              {dispute.contract?.title} · {dispute.milestone?.title}
            </p>
          </div>
          <span className="text-[10px] uppercase font-bold px-3 py-1 rounded-lg" style={{ backgroundColor: s.bg, color: s.color }}>
            {dispute.status?.replace("_", " ")}
          </span>
        </div>

        {/* Info */}
        <div className="card mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium uppercase mb-1" style={{ color: "var(--color-ink-3)" }}>Client</p>
              <p className="text-sm font-semibold">{dispute.client?.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase mb-1" style={{ color: "var(--color-ink-3)" }}>Freelancer</p>
              <p className="text-sm font-semibold">{dispute.freelancer?.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase mb-1" style={{ color: "var(--color-ink-3)" }}>Amount</p>
              <p className="text-sm font-mono font-bold">₹{dispute.milestone?.amount?.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase mb-1" style={{ color: "var(--color-ink-3)" }}>Filed</p>
              <p className="text-sm">{new Date(dispute.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="card mb-6">
          <h3 className="font-bold text-sm mb-2">Reason</h3>
          <p className="text-sm" style={{ color: "var(--color-ink-2)" }}>{dispute.reason}</p>
          {dispute.description && (
            <>
              <h3 className="font-bold text-sm mt-4 mb-2">Details</h3>
              <p className="text-sm" style={{ color: "var(--color-ink-2)" }}>{dispute.description}</p>
            </>
          )}
        </div>

        {/* Resolution */}
        {dispute.resolution && (
          <div className="card mb-6" style={{ borderColor: "var(--color-primary)", borderWidth: "2px" }}>
            <h3 className="font-bold text-sm mb-2" style={{ color: "var(--color-primary)" }}>Resolution</h3>
            <p className="text-sm" style={{ color: "var(--color-ink-2)" }}>{dispute.resolution}</p>
          </div>
        )}

        {/* Thread */}
        <div className="card">
          <h3 className="font-bold text-sm mb-4">Discussion</h3>
          {(dispute.messages || []).length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: "var(--color-ink-3)" }}>No messages yet</p>
          ) : (
            <div className="space-y-3 mb-4">
              {dispute.messages.map((m, i) => (
                <div key={i} className="p-3 rounded-xl" style={{ backgroundColor: "var(--color-surface)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold">{m.sender}</p>
                    <p className="text-[10px]" style={{ color: "var(--color-ink-3)" }}>
                      {new Date(m.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <p className="text-sm">{m.content}</p>
                </div>
              ))}
            </div>
          )}

          {(dispute.status === "open" || dispute.status === "under_review") && (
            <div className="flex gap-2 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Add to the discussion..."
                className="input-field flex-1 !text-sm"
              />
              <button onClick={sendMessage} className="btn-primary !px-4 !text-sm">Send</button>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
