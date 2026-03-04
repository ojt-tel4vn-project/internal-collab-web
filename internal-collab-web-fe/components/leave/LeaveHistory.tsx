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
    const [toast, setToast] = useState<ToastState | null>(null);

    useEffect(() => {
        setRows(items);
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

    async function handleCancel(id: string) {
        setBusyId(id);
        try {
            const res = await fetch(`/api/leave-requests/${id}`, { method: "DELETE" });
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
                        {item.managerComment && (item.status.label === "Approved" || item.status.label === "Rejected") && (
                            <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                                Manager comment: {item.managerComment}
                            </p>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">&nbsp;</span>
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
