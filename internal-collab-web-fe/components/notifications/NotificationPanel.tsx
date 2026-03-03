"use client";

import { useMemo, useState } from "react";
import type { NotificationItem } from "@/types/notification";

interface NotificationPanelProps {
    heading: string;
    items: NotificationItem[];
    roleLabel?: string;
}

export function NotificationPanel({ heading, items, roleLabel }: NotificationPanelProps) {
    const [list, setList] = useState(items);

    const stats = useMemo(() => {
        const total = list.length;
        const unread = list.filter((i) => i.unread).length;
        return { total, unread };
    }, [list]);

    function markAllRead() {
        setList((prev) => prev.map((i) => ({ ...i, unread: false })));
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900">{heading}</h1>
                    <p className="text-sm text-slate-500">Stay on top of updates across your workspace.</p>
                    {roleLabel ? <p className="text-xs font-semibold text-slate-400">{roleLabel}</p> : null}
                </div>
                <button
                    onClick={markAllRead}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
                >
                    <span>✓</span>
                    <span>Mark all as read</span>
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Notifications</p>
                    <p className="mt-2 text-3xl font-extrabold text-slate-900">{stats.total.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unread</p>
                    <p className="mt-2 text-3xl font-extrabold text-amber-600">{stats.unread.toLocaleString()}</p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                        <p className="text-sm font-semibold text-slate-900">Recent Activity</p>
                        <p className="text-xs text-slate-500">Latest updates across teams</p>
                    </div>
                    <button className="text-xs font-semibold text-blue-600">Filter by type</button>
                </div>

                <div className="divide-y divide-slate-100">
                    {list.map((item) => (
                        <div key={item.id} className="flex gap-4 px-5 py-4">
                            <div className="flex flex-col items-center">
                                {item.unread ? <span className={`mt-1 h-2 w-2 rounded-full ${item.accent}`} /> : <span className="mt-1 h-2 w-2 rounded-full bg-transparent" />}
                                <span className="mt-2 h-full w-px bg-slate-100" aria-hidden />
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                                    <span className="text-[11px] uppercase tracking-wide text-slate-400">{item.timeAgo}</span>
                                </div>
                                <p className="text-sm text-slate-600">{item.description}</p>
                                {item.meta ? <p className="text-xs text-slate-400">{item.meta}</p> : null}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-center border-t border-slate-100 px-5 py-3">
                    <button className="text-sm font-semibold text-blue-600">Load older notifications</button>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                System status: <span className="font-semibold text-emerald-600">All systems operational</span>. Updated moments ago.
            </div>
        </div>
    );
}
