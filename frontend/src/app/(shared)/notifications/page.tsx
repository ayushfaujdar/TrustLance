"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import api from "@/lib/api";

type Notification = {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get("/notifications");
        setNotifications(data.data || []);
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const markRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* silent */ }
  };

  const typeIcon: Record<string, { icon: string; color: string; bg: string }> = {
    payment: { icon: "💰", color: "var(--color-primary)", bg: "var(--color-primary-lt)" },
    escrow: { icon: "🔒", color: "#6C63FF", bg: "#EAE9FF" },
    bid: { icon: "📝", color: "var(--color-accent)", bg: "var(--color-accent-lt)" },
    dispute: { icon: "⚠️", color: "var(--color-danger)", bg: "var(--color-danger-lt)" },
    message: { icon: "💬", color: "var(--color-accent)", bg: "var(--color-accent-lt)" },
    system: { icon: "🔔", color: "var(--color-ink-3)", bg: "var(--color-surface)" },
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DashboardShell>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display">Notifications</h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-ink-3)" }}>
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ backgroundColor: "var(--color-surface)" }} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--color-surface)" }}>
              <span className="text-3xl">🔔</span>
            </div>
            <p className="font-semibold text-lg mb-1">No notifications</p>
            <p className="text-sm" style={{ color: "var(--color-ink-3)" }}>
              You&apos;re all caught up! Notifications will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const style = typeIcon[n.type] || typeIcon.system;
              return (
                <div
                  key={n._id}
                  onClick={() => !n.read && markRead(n._id)}
                  className="card flex items-start gap-4 cursor-pointer transition-all duration-150"
                  style={{
                    backgroundColor: n.read ? "white" : "var(--color-primary-lt)",
                    borderColor: n.read ? "var(--color-border)" : "var(--color-primary)",
                    borderWidth: n.read ? "1px" : "1.5px",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ backgroundColor: style.bg }}
                  >
                    {style.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{n.title}</p>
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--color-primary)" }} />
                      )}
                    </div>
                    <p className="text-sm mt-0.5" style={{ color: "var(--color-ink-3)" }}>{n.message}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--color-ink-3)" }}>
                      {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
