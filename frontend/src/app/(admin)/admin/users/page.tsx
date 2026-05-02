"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";

type User = {
  _id: string;
  name: string;
  email: string;
  role: string[];
  isVerified: boolean;
  createdAt: string;
  walletBalance?: number;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get("/admin/users", { params: { search: search || undefined } });
        setUsers(data.users || data || []);
      } catch { setUsers([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, [search]);

  const toggleBan = async (userId: string, isBanned: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/${isBanned ? "unban" : "ban"}`);
      toast.success(isBanned ? "User unbanned" : "User banned");
    } catch {
      toast.error("Action failed");
    }
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-display">Users</h1>
          <div className="relative max-w-xs w-full">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-ink-3)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="input-field !pl-10 !text-sm" />
          </div>
        </div>

        <div className="card !p-0 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ backgroundColor: "var(--color-surface)" }} />)}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: "var(--color-ink-3)" }}>No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "var(--color-surface)" }}>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase" style={{ color: "var(--color-ink-3)" }}>User</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase" style={{ color: "var(--color-ink-3)" }}>Role</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase" style={{ color: "var(--color-ink-3)" }}>Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase" style={{ color: "var(--color-ink-3)" }}>Joined</th>
                    <th className="text-right px-4 py-3 font-semibold text-xs uppercase" style={{ color: "var(--color-ink-3)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "var(--color-primary)" }}>{u.name.charAt(0)}</div>
                          <div>
                            <p className="font-semibold">{u.name}</p>
                            <p className="text-xs" style={{ color: "var(--color-ink-3)" }}>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: "var(--color-surface)" }}>
                          {u.role?.join(", ") || "user"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md" style={{
                          backgroundColor: u.isVerified ? "var(--color-primary-lt)" : "var(--color-accent-lt)",
                          color: u.isVerified ? "var(--color-primary)" : "var(--color-accent)",
                        }}>
                          {u.isVerified ? "Verified" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--color-ink-3)" }}>
                        {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => toggleBan(u._id, false)} className="text-xs font-semibold" style={{ color: "var(--color-danger)" }}>
                          Ban
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
