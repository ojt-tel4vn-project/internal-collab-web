"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  NOTIFICATION_TYPES,
  type ListNotificationResponse,
  type NotificationItem,
  type UnreadCountResponse,
} from "@/types/notification";
import { logErrorToConsole, toUserFriendlyError, toUserFriendlyErrorMessage } from "@/lib/api/errors";

const LIMIT = 10;

type ReadFilter = "all" | "read" | "unread";
type TypeFilter = "all" | (typeof NOTIFICATION_TYPES)[number];

type NotificationCenterProps = {
  sideNav?: ReactNode;
  maxWidthClassName?: string;
  roleLabel?: string;
  tone?: "blue" | "emerald" | "violet" | "slate";
};

const TONE_STYLES = {
  blue: {
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    button: "bg-blue-600 hover:bg-blue-700",
    focus: "focus:border-blue-500",
    unreadValue: "text-blue-700",
    softRing: "ring-blue-100",
  },
  emerald: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    button: "bg-emerald-600 hover:bg-emerald-700",
    focus: "focus:border-emerald-500",
    unreadValue: "text-emerald-700",
    softRing: "ring-emerald-100",
  },
  violet: {
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    button: "bg-violet-600 hover:bg-violet-700",
    focus: "focus:border-violet-500",
    unreadValue: "text-violet-700",
    softRing: "ring-violet-100",
  },
  slate: {
    badge: "bg-slate-100 text-slate-700 border-slate-300",
    button: "bg-slate-700 hover:bg-slate-800",
    focus: "focus:border-slate-500",
    unreadValue: "text-slate-700",
    softRing: "ring-slate-200",
  },
} as const;

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function readApiMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "Unexpected server response.";
  }

  const data = payload as { message?: unknown; detail?: unknown; title?: unknown };
  if (typeof data.message === "string" && data.message.trim()) return data.message.trim();
  if (typeof data.detail === "string" && data.detail.trim()) return data.detail.trim();
  if (typeof data.title === "string" && data.title.trim()) return data.title.trim();
  return "Unexpected server response.";
}

export default function NotificationCenter({
  sideNav,
  maxWidthClassName = "max-w-7xl",
  roleLabel,
  tone = "blue",
}: NotificationCenterProps) {
  const styles = TONE_STYLES[tone];
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (readFilter === "read" && !item.is_read) return false;
      if (readFilter === "unread" && item.is_read) return false;
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      return true;
    });
  }, [notifications, readFilter, typeFilter]);

  const fetchUnreadCount = useCallback(async () => {
    const response = await fetch("/api/notifications/unread-count", { cache: "no-store" });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(readApiMessage(data));
    }

    const data = (await response.json()) as UnreadCountResponse;
    setUnreadCount(typeof data.count === "number" ? data.count : 0);
  }, []);

  const fetchNotifications = useCallback(async (nextPage: number) => {
    const response = await fetch(`/api/notifications?page=${nextPage}&limit=${LIMIT}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(readApiMessage(data));
    }

    const data = (await response.json()) as ListNotificationResponse;
    setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    setTotal(typeof data.total === "number" ? data.total : 0);
  }, []);

  const loadPage = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      setError("");
      setActionMessage("");
      try {
        await Promise.all([fetchNotifications(nextPage), fetchUnreadCount()]);
        setPage(nextPage);
      } catch (err) {
        logErrorToConsole("NotificationCenter.loadPage", err, { nextPage });
        setError(toUserFriendlyError(err, "We couldn't load notifications right now."));
      } finally {
        setLoading(false);
      }
    },
    [fetchNotifications, fetchUnreadCount],
  );

  useEffect(() => {
    void loadPage(1);
  }, [loadPage]);

  const markOneAsRead = async (id: string) => {
    const response = await fetch(`/api/notifications/${id}/read`, {
      method: "PUT",
      headers: {
        Accept: "application/json, application/problem+json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(readApiMessage(data));
    }

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              is_read: true,
              read_at: item.read_at ?? new Date().toISOString(),
            }
          : item,
      ),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleOpenNotification = async (item: NotificationItem) => {
    setActionMessage("");
    if (!item.is_read) {
      setActionLoading(true);
      try {
        await markOneAsRead(item.id);
        setSelectedNotification({
          ...item,
          is_read: true,
          read_at: item.read_at ?? new Date().toISOString(),
        });
      } catch (err) {
        logErrorToConsole("NotificationCenter.handleOpenNotification", err, { id: item.id });
        setError(toUserFriendlyError(err, "We couldn't update the notification right now."));
        setSelectedNotification(item);
      } finally {
        setActionLoading(false);
      }
      return;
    }

    setSelectedNotification(item);
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading(true);
    setError("");
    setActionMessage("");
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: {
          Accept: "application/json, application/problem+json",
          "Content-Type": "application/json",
        },
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(readApiMessage(data));
      }

      setActionMessage(
        toUserFriendlyErrorMessage(readApiMessage(data), "Notifications were marked as read."),
      );
      await Promise.all([fetchNotifications(page), fetchUnreadCount()]);
      setSelectedNotification((prev) => (prev ? { ...prev, is_read: true } : prev));
    } catch (err) {
      logErrorToConsole("NotificationCenter.handleMarkAllAsRead", err, { page });
      setError(toUserFriendlyError(err, "We couldn't update notifications right now."));
    } finally {
      setActionLoading(false);
    }
  };

  const content = (
    <section className="flex-1 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-2xl font-bold">Notifications</h1>
              {roleLabel ? (
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${styles.badge}`}>
                  {roleLabel}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-slate-500">Stay on top of updates across your workspace.</p>
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : null}

          {actionMessage ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {actionMessage}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className={`rounded-2xl border border-slate-100 bg-white p-5 shadow-sm ring-1 ${styles.softRing}`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Notifications</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">{total.toLocaleString()}</p>
            </div>
            <div className={`rounded-2xl border border-slate-100 bg-white p-5 shadow-sm ring-1 ${styles.softRing}`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unread</p>
              <p className={`mt-2 text-3xl font-extrabold ${styles.unreadValue}`}>{unreadCount.toLocaleString()}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={readFilter}
                  onChange={(event) => setReadFilter(event.target.value as ReadFilter)}
                  className={`rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none ${styles.focus}`}
                >
                  <option value="all">All status</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
                  className={`rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none ${styles.focus}`}
                >
                  <option value="all">All types</option>
                  {NOTIFICATION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={actionLoading || unreadCount === 0}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:opacity-60 ${styles.button}`}
              >
                Mark all as read
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Created at</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredNotifications.map((item) => {
                    const isHigh = item.priority.toLowerCase() === "high";
                    return (
                      <tr
                        key={item.id}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => handleOpenNotification(item)}
                      >
                        <td
                          className={`px-4 py-3 text-sm ${
                            item.is_read ? "font-medium" : "font-bold"
                          } ${isHigh ? "text-rose-600" : "text-slate-900"}`}
                        >
                          {item.title}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">{item.type}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{formatDateTime(item.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!loading && filteredNotifications.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">No notifications found for current filters.</div>
            ) : null}

            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <button
                type="button"
                onClick={() => loadPage(page - 1)}
                disabled={loading || page <= 1}
                className="h-9 w-9 rounded-full border border-slate-200 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                {"<"}
              </button>
              <span className="text-sm font-semibold text-slate-700">
                {page}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => loadPage(page + 1)}
                disabled={loading || page >= totalPages}
                className="h-9 w-9 rounded-full border border-slate-200 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                {">"}
              </button>
            </div>
          </div>
        </section>
  );

  return (
    <>
      {sideNav ? (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
          <div className={`mx-auto flex w-full ${maxWidthClassName} gap-6 px-4 py-8`}>
            {sideNav}
            {content}
          </div>
        </main>
      ) : content}

      {selectedNotification ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedNotification.title}</h2>
                <p className="mt-1 text-sm text-slate-500">Notification details</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="h-8 w-8 rounded-full border border-slate-200 text-slate-600"
                aria-label="Close"
              >
                X
              </button>
            </div>

            <div className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <p><span className="font-semibold">ID:</span> {selectedNotification.id}</p>
              <p><span className="font-semibold">Employee ID:</span> {selectedNotification.employee_id}</p>
              <p><span className="font-semibold">Type:</span> {selectedNotification.type}</p>
              <p><span className="font-semibold">Priority:</span> {selectedNotification.priority}</p>
              <p><span className="font-semibold">Read status:</span> {selectedNotification.is_read ? "Read" : "Unread"}</p>
              <p><span className="font-semibold">Action URL:</span> {selectedNotification.action_url || "-"}</p>
              <p><span className="font-semibold">Created at:</span> {formatDateTime(selectedNotification.created_at)}</p>
              <p>
                <span className="font-semibold">Read at:</span>{" "}
                {selectedNotification.read_at ? formatDateTime(selectedNotification.read_at) : "-"}
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Message</p>
              <p className="mt-2 text-sm text-slate-800">{selectedNotification.message}</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
