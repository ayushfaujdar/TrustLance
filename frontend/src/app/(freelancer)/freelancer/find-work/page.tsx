"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import api from "@/lib/api";
import toast from "react-hot-toast";

type Job = {
  _id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number;
  budget_max: number;
  skills_required: string[];
  client?: { name: string };
  created_at: string;
  bids?: string[];
};

const CATEGORIES = [
  "All", "Web Development", "Mobile App", "UI/UX Design", "Graphic Design",
  "Content Writing", "Video Editing", "Data Entry", "SEO", "Digital Marketing",
];

export default function FindWorkPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [bidding, setBidding] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data } = await api.get("/jobs", {
          params: {
            category: selectedCategory === "All" ? undefined : selectedCategory,
            search: search || undefined,
          },
        });
        setJobs(data.data || []);
      } catch {
        // Use demo data when API not ready
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [selectedCategory, search]);

  const handleBid = async (jobId: string) => {
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      toast.error("Enter a valid bid amount");
      return;
    }
    try {
      await api.post(`/jobs/${jobId}/bid`, {
        amount: parseFloat(bidAmount),
        message: bidMessage.trim(),
      });
      toast.success("Bid submitted!");
      setBidding(null);
      setBidAmount("");
      setBidMessage("");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Failed to submit bid");
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <DashboardShell role="freelancer">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display">Find Work</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-ink-3)" }}>
            Browse available jobs and submit bids
          </p>
        </div>

        {/* Search & Filters */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <svg
                width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--color-ink-3)" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jobs by title or skill..."
                className="input-field !pl-10"
              />
            </div>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150"
                style={{
                  borderColor: selectedCategory === cat ? "var(--color-primary)" : "var(--color-border)",
                  backgroundColor: selectedCategory === cat ? "var(--color-primary-lt)" : "white",
                  color: selectedCategory === cat ? "var(--color-primary)" : "var(--color-ink-3)",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Job List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-5 w-2/3 rounded mb-3" style={{ backgroundColor: "var(--color-surface)" }} />
                <div className="h-3 w-full rounded mb-2" style={{ backgroundColor: "var(--color-surface)" }} />
                <div className="h-3 w-4/5 rounded" style={{ backgroundColor: "var(--color-surface)" }} />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="card text-center py-16">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "var(--color-accent-lt)" }}
            >
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="var(--color-accent)" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="font-semibold text-lg mb-1">No jobs found</p>
            <p className="text-sm" style={{ color: "var(--color-ink-3)" }}>
              {search ? "Try different keywords or clear filters" : "New jobs are posted regularly. Check back soon!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job._id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-base truncate">{job.title}</h3>
                    </div>
                    <p className="text-xs mb-3" style={{ color: "var(--color-ink-3)" }}>
                      {job.client?.name || "Client"} · {timeAgo(job.created_at)} · {job.bids?.length || 0} bids
                    </p>
                    <p className="text-sm line-clamp-2 mb-3" style={{ color: "var(--color-ink-2)" }}>
                      {job.description}
                    </p>
                    {job.skills_required?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {job.skills_required.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="text-[10px] font-medium px-2 py-0.5 rounded"
                            style={{ backgroundColor: "var(--color-surface)", color: "var(--color-ink-3)" }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-mono font-bold" style={{ color: "var(--color-primary)" }}>
                      ₹{job.budget_min?.toLocaleString("en-IN")}
                    </p>
                    <span
                      className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md inline-block mt-1"
                      style={{ backgroundColor: "var(--color-primary-lt)", color: "var(--color-primary)" }}
                    >
                      {job.category}
                    </span>
                  </div>
                </div>

                {/* Bid section */}
                {bidding === job._id ? (
                  <div
                    className="mt-4 pt-4 space-y-3"
                    style={{ borderTop: "1px solid var(--color-border)" }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder="Your bid (₹)"
                        className="input-field !text-sm"
                        min={1}
                      />
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          value={bidMessage}
                          onChange={(e) => setBidMessage(e.target.value)}
                          placeholder="Why are you the right fit?"
                          className="input-field !text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleBid(job._id)} className="btn-primary !py-2 !px-4 !text-sm">
                        Submit Bid
                      </button>
                      <button onClick={() => setBidding(null)} className="btn-outline !py-2 !px-4 !text-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
                    <button
                      onClick={() => setBidding(job._id)}
                      className="btn-primary !py-2 !px-5 !text-sm"
                    >
                      Place Bid
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
