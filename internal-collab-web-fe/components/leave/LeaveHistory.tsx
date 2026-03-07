"use client";

import { useEffect, useMemo, useState } from "react";
import type { LeaveHistoryItem } from "@/types/leave";

interface LeaveHistoryProps {
    items: LeaveHistoryItem[];
}

interface ToastState {
    message: string;
    tone: "success" | "error";
}

export function LeaveHistory({ items }: LeaveHistoryProps) {
    const [rows, setRows] = useState(items);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
    const [toast, setToast] = useState<ToastState | null>(null);

    useEffect(() => {
        setRows(items);
        setExpandedIds({});
    }, [items]);

    const statusClass = useMemo(() => ({
        Approved: "text-green-600",
        Pending: "text-orange-500",
        Rejected: "text-red-500",
        Cancelled: "text-slate-500",
    }), []);

    function showToast(message: string, tone: "success" | "error") {
        setToast({ message, tone });
        setTimeout(() => setToast(null), 3500);
    }

    function toggleDetail(id: string) {
        setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
    }

    async function handleCancel(id: string) {
        setBusyId(id);
        try {
            const res = await fetch(`/api/employee/leave-requests/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const raw = await res.text();
                throw new Error(raw || "Unable to cancel leave request");
            }
            setRows((prev) =>
                prev.map((r) => (r.id === id ? { ...r, status: { label: "Cancelled", tone: statusClass.Cancelled } } : r)),
            );
            showToast("Leave request cancelled", "success");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unable to cancel leave request";
            showToast(message, "error");
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div className="space-y-4 text-sm">
            {rows.map((item, idx) => {
                const isPending = item.status.label === "Pending";
                const isExpanded = Boolean(expandedIds[item.id]);
                return (
                    <div key={item.id} className={idx !== rows.length - 1 ? "border-b border-slate-100 pb-4" : ""}>
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="font-semibold text-slate-900">{item.title}</p>
                                <p className="text-[11px] text-slate-500">{item.range}</p>
                            </div>
                            <div className="text-right text-[11px] font-semibold uppercase text-slate-500">
                                <p className="text-slate-800">{item.duration}</p>
                                <p className={item.status.tone || statusClass[item.status.label as keyof typeof statusClass] || "text-slate-600"}>
                                    {item.status.label}
                                </p>
                            </div>
                        </div>
                        {isExpanded && (
                            <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Detail</p>
                                <div className="mt-2 grid gap-2 text-[11px] sm:grid-cols-2">
                                    <div>
                                        <p className="uppercase text-slate-400">Leave type</p>
                                        <p className="font-semibold text-slate-800">{item.leaveType}</p>
                                    </div>
                                    <div>
                                        <p className="uppercase text-slate-400">From date to date</p>
                                        <p className="font-semibold text-slate-800">
                                            {item.fromDate} - {item.toDate}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="uppercase text-slate-400">Reason</p>
                                        <p className="font-semibold text-slate-800">{item.reason || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="uppercase text-slate-400">Contact</p>
                                        <p className="font-semibold text-slate-800">{item.contact || "-"}</p>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <p className="uppercase text-slate-400">Comment</p>
                                        <p className="font-semibold text-slate-800">{item.comment || "-"}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => toggleDetail(item.id)}
                                aria-expanded={isExpanded}
                                className="text-xs font-semibold text-blue-600 hover:underline"
                            >
                                {isExpanded ? "Hide Detail" : "Detail"}
                            </button>
                            <button
                                type="button"
                                disabled={busyId === item.id || !isPending}
                                onClick={() => handleCancel(item.id)}
                                className={`text-xs font-semibold ${isPending ? "text-blue-600 hover:underline" : "text-slate-300"} disabled:cursor-not-allowed`}
                            >
                                {busyId === item.id ? "Cancelling..." : "Cancel"}
                            </button>
                        </div>
                    </div>
                );
            })}

            {toast && (
                <div
                    className={`fixed bottom-6 right-6 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${toast.tone === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                        }`}
                >
                    {toast.message}
                </div>
            )}
        </div>
    );
}
