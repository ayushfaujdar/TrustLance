"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

type Profile = {
  _id: string;
  name: string;
  bio: string;
  skills: string[];
  avatar?: string;
  rating: number;
  completedJobs: number;
  joinedAt: string;
  portfolio: { title: string; url: string }[];
};

export default function FreelancerProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/users/${id}/profile`);
        setProfile(data);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetch();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen p-6 flex items-center justify-center" style={{ backgroundColor: "var(--color-paper)" }}>
        <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full" style={{ color: "var(--color-primary)" }} />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen p-6 flex items-center justify-center" style={{ backgroundColor: "var(--color-paper)" }}>
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Profile not found</p>
          <Link href="/" className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>← Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 md:p-12" style={{ backgroundColor: "var(--color-paper)" }}>
      <div className="max-w-3xl mx-auto">
        {/* Header card */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-display">{profile.name}</h1>
              <p className="text-sm mt-1" style={{ color: "var(--color-ink-3)" }}>{profile.bio || "No bio provided"}</p>

              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" fill="var(--color-accent)" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  <span className="text-sm font-bold">{profile.rating?.toFixed(1) || "N/A"}</span>
                </div>
                <span className="text-sm" style={{ color: "var(--color-ink-3)" }}>
                  {profile.completedJobs || 0} jobs completed
                </span>
                <span className="text-sm" style={{ color: "var(--color-ink-3)" }}>
                  Joined {new Date(profile.joinedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Skills */}
        {profile.skills?.length > 0 && (
          <div className="card mb-6">
            <h3 className="font-bold text-sm mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span key={s} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: "var(--color-primary-lt)", color: "var(--color-primary)" }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio */}
        {profile.portfolio?.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-sm mb-3">Portfolio</h3>
            <div className="space-y-2">
              {profile.portfolio.map((p, i) => (
                <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-xl hover:bg-[var(--color-surface)] transition-colors">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span className="text-sm font-medium">{p.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
