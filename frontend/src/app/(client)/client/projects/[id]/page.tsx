"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import api from "@/lib/api";
import toast from "react-hot-toast";

type Milestone = {
  _id: string;
  title: string;
  amount: number;
  status: "pending" | "funded" | "in_progress" | "review" | "completed" | "disputed" | "delivered" | "approved";
  description: string;
};

type Bid = {
  _id: string;
  freelancer_id: { _id: string; name: string } | string;
  amount: number;
  cover_letter: string;
  created_at: string;
};

type Project = {
  _id: string;
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  category: string;
  status: string;
  skills_required: string[];
  milestones: Milestone[];
  bids: Bid[];
  freelancer?: { _id: string; name: string };
  client?: { name: string };
  contract?: {
    _id: string;
    milestones: Milestone[];
  };
  created_at: string;
};

const getFreelancerId = (freelancerId: Bid["freelancer_id"]): string =>
  typeof freelancerId === "string" ? freelancerId : freelancerId._id;

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"milestones" | "bids">("milestones");
  const [messageTo, setMessageTo] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");

  const fetchProject = useCallback(async () => {
    try {
      const { data } = await api.get(`/jobs/${id}`);
      setProject(data);
    } catch {
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) void fetchProject();
  }, [fetchProject, id]);

  const fundMilestone = async (milestoneId: string) => {
    try {
      if (!project?.contract?._id) throw new Error("Contract not found");
      setActionLoading(`fund-${milestoneId}`);
      await api.post(`/escrow/fund-milestone`, { contractId: project.contract._id, milestoneId });
      toast.success("Milestone funded!");
      await fetchProject();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || (error instanceof Error ? error.message : "Failed to fund milestone"));
    } finally {
      setActionLoading(null);
    }
  };

  const approveMilestone = async (milestoneId: string) => {
    try {
      if (!project?.contract?._id) throw new Error("Contract not found");
      setActionLoading(`approve-${milestoneId}`);
      await api.post(`/escrow/approve`, { contractId: project.contract._id, milestoneId });
      toast.success("Milestone approved! Payment released.");
      await fetchProject();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || (error instanceof Error ? error.message : "Failed to approve"));
    } finally {
      setActionLoading(null);
    }
  };

  const acceptBid = async (bidId: string) => {
    try {
      setActionLoading(`bid-${bidId}`);
      await api.post(`/jobs/${id}/accept-bid`, { bidId });
      toast.success("Bid accepted! Contract created.");
      await fetchProject();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Failed to accept bid");
    } finally {
      setActionLoading(null);
    }
  };

  const sendInitialMessage = async (freelancerId: string) => {
    if (!messageText.trim()) return;
    try {
      setActionLoading(`msg-${freelancerId}`);
      // Use jobId_freelancerId as a unique thread ID for this project discussion
      const threadId = `${id}_${freelancerId}`;
      await api.post(`/messages/${threadId}`, { 
        content: messageText.trim(),
        receiverId: freelancerId 
      });
      toast.success("Message sent! Check your Messages tab.");
      setMessageTo(null);
      setMessageText("");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Failed to send message");
    } finally {
      setActionLoading(null);
    }
  };

  const statusColor: Record<string, { color: string; bg: string }> = {
    pending: { color: "var(--color-ink-3)", bg: "var(--color-surface)" },
    funded: { color: "var(--color-accent)", bg: "var(--color-accent-lt)" },
    in_progress: { color: "#6C63FF", bg: "#EAE9FF" },
    review: { color: "var(--color-accent)", bg: "var(--color-accent-lt)" },
    completed: { color: "var(--color-primary)", bg: "var(--color-primary-lt)" },
    disputed: { color: "var(--color-danger)", bg: "var(--color-danger-lt)" },
    open: { color: "var(--color-accent)", bg: "var(--color-accent-lt)" },
  };

  if (loading) {
    return (
      <DashboardShell role="client">
        <div className="max-w-4xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ backgroundColor: "var(--color-surface)" }} />
          ))}
        </div>
      </DashboardShell>
    );
  }

  if (!project) {
    return (
      <DashboardShell role="client">
        <div className="max-w-4xl mx-auto text-center py-20">
          <p className="text-lg font-semibold mb-2">Project not found</p>
          <Link href="/client/dashboard" className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
            ← Back to Dashboard
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const pStatus = statusColor[project.status] || statusColor.pending;

  return (
    <DashboardShell role="client">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <Link href="/client/dashboard" className="text-xs font-medium mb-2 inline-block" style={{ color: "var(--color-ink-3)" }}>
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-display">{project.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span
                className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: pStatus.bg, color: pStatus.color }}
              >
                {project.status?.replace("_", " ")}
              </span>
              <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                ₹{project.budget_min?.toLocaleString("en-IN")} · {project.category}
              </span>
            </div>
          </div>
          {project.freelancer && (
            <div className="card !p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "var(--color-primary)" }}>
                {project.freelancer.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold">{project.freelancer.name}</p>
                <p className="text-[10px] uppercase" style={{ color: "var(--color-ink-3)" }}>Freelancer</p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="card mb-6">
          <h3 className="font-bold text-sm mb-2">Description</h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-ink-2)" }}>{project.description}</p>
          {project.skills_required?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {project.skills_required.map((s) => (
                <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-ink-3)" }}>
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ backgroundColor: "var(--color-surface)" }}>
          {(["milestones", "bids"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-150 capitalize"
              style={{
                backgroundColor: activeTab === tab ? "white" : "transparent",
                color: activeTab === tab ? "var(--color-ink)" : "var(--color-ink-3)",
                boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {tab} ({tab === "milestones" ? project.milestones?.length || 0 : project.bids?.length || 0})
            </button>
          ))}
        </div>

        {/* Milestones */}
        {activeTab === "milestones" && (
          <div className="space-y-3">
            {(() => {
              const displayMilestones = project.contract?.milestones?.length ? project.contract.milestones : project.milestones || [];
              if (displayMilestones.length === 0) {
                return (
                  <div className="card text-center py-8">
                    <p className="text-sm" style={{ color: "var(--color-ink-3)" }}>No milestones defined</p>
                  </div>
                );
              }
              return displayMilestones.map((m: Milestone, i: number) => {
                const ms = statusColor[m.status] || statusColor.pending;
                return (
                  <div key={m._id || i} className="card">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold" style={{ color: "var(--color-ink-3)" }}>#{i + 1}</span>
                          <h4 className="font-semibold text-sm">{m.title}</h4>
                        </div>
                        <p className="text-xs" style={{ color: "var(--color-ink-3)" }}>{m.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-mono font-bold text-sm">₹{m.amount?.toLocaleString("en-IN")}</p>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md inline-block mt-1" style={{ backgroundColor: ms.bg, color: ms.color }}>
                          {m.status?.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
                      {m.status === "pending" && project.status === "in_progress" && (
                        <button 
                          onClick={() => fundMilestone(m._id)} 
                          disabled={!!actionLoading}
                          className="btn-primary !py-1.5 !px-4 !text-xs disabled:opacity-50"
                        >
                          {actionLoading === `fund-${m._id}` ? "Funding..." : "Fund Milestone"}
                        </button>
                      )}
                      {m.status === "review" && (
                        <>
                          <button 
                            onClick={() => approveMilestone(m._id)} 
                            disabled={!!actionLoading}
                            className="btn-primary !py-1.5 !px-4 !text-xs disabled:opacity-50"
                          >
                            {actionLoading === `approve-${m._id}` ? "Approving..." : "Approve & Release"}
                          </button>
                          <Link href={`/disputes/new?milestone=${m._id}`} className="btn-outline !py-1.5 !px-4 !text-xs" style={{ color: "var(--color-danger)" }}>
                            Dispute
                          </Link>
                        </>
                      )}
                      {m.status === "completed" && (
                        <span className="text-xs font-medium" style={{ color: "var(--color-primary)" }}>✓ Completed</span>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* Bids */}
        {activeTab === "bids" && (
          <div className="space-y-3">
            {(project.bids || []).length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-sm" style={{ color: "var(--color-ink-3)" }}>No bids received yet</p>
              </div>
            ) : (
              project.bids.map((b) => (
                <div key={b._id} className="card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: "var(--color-accent)" }}>
                        {typeof b.freelancer_id === 'object' ? (b.freelancer_id as { name: string }).name?.charAt(0) : '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{typeof b.freelancer_id === 'object' ? (b.freelancer_id as { name: string }).name : 'Freelancer'}</p>
                        <p className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                          {new Date(b.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </div>
                    <p className="font-mono font-bold" style={{ color: "var(--color-primary)" }}>
                      ₹{b.amount.toLocaleString("en-IN")}
                    </p>
                  </div>
                  {b.cover_letter && (
                    <p className="text-sm mt-3 p-3 rounded-xl" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-ink-2)" }}>
                      {b.cover_letter}
                    </p>
                  )}
                  {!project.freelancer && (
                    <div className="mt-3 pt-3 flex flex-col gap-3" style={{ borderTop: "1px solid var(--color-border)" }}>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => acceptBid(b._id)} 
                          disabled={!!actionLoading}
                          className="btn-primary !py-1.5 !px-4 !text-xs disabled:opacity-50"
                        >
                          {actionLoading === `bid-${b._id}` ? "Accepting..." : "Accept Bid"}
                        </button>
                        
                        <button 
                          onClick={() => setMessageTo(messageTo === b._id ? null : b._id)} 
                          className="btn-outline !py-1.5 !px-4 !text-xs"
                        >
                          {messageTo === b._id ? "Cancel Message" : "Message"}
                        </button>
                      </div>

                      {messageTo === b._id && (
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder="Type a message to start the conversation..."
                            className="input-field flex-1 !text-sm !py-1.5"
                          />
                          <button 
                            onClick={() => sendInitialMessage(getFreelancerId(b.freelancer_id))}
                            disabled={!messageText.trim() || !!actionLoading}
                            className="btn-primary !py-1.5 !px-4 !text-xs disabled:opacity-50"
                          >
                            {actionLoading === `msg-${getFreelancerId(b.freelancer_id)}` ? "Sending..." : "Send"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
