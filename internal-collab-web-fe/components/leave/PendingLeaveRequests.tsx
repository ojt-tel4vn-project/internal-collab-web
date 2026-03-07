"use client";

import { useEffect, useState } from "react";
import type { LeaveStatusMeta } from "@/types/leave";

type PendingLeaveRequestItem = {
    id: string;
    leaveType: string;
    status: LeaveStatusMeta;
    dateRange: string;
    fromDate: string;
    toDate: string;
    reason: string;
    contact: string;
    comment: string;
    days: number;
};

type Props = {
    items: PendingLeaveRequestItem[];
};

function extractErrorMessage(raw: string, fallback: string) {
    if (!raw) return fallback;
    try {
        const parsed = JSON.parse(raw) as { message?: string; detail?: string; title?: string; error?: string };
        return parsed.message || parsed.detail || parsed.title || parsed.error || fallback;
    } catch {
        return raw.slice(0, 200);
    }
}

export function PendingLeaveRequests({ items }: Props) {
    const [rows, setRows] = useState(items);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setRows(items);
        setExpandedIds({});
    }, [items]);

    function toggleDetail(id: string) {
        setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
    }

    async function handleCancel(id: string) {
        setBusyId(id);
        setError(null);
        try {
            const res = await fetch(`/api/employee/leave-requests/${encodeURIComponent(id)}`, { method: "DELETE" });
            if (res.ok || res.status === 204) {
                setRows((prev) => prev.filter((request) => request.id !== id));
                window.location.reload();
                return;
            }

            if (!res.ok) {
                const raw = await res.text();
                throw new Error(extractErrorMessage(raw, "Unable to cancel leave request"));
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unable to cancel leave request";
            if (message.includes("204")) {
                window.location.reload();
                return;
            }
            setError(message);
        } finally {
            setBusyId(null);
        }
    }

    if (rows.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-4 text-sm text-slate-500">
                No pending leave requests.
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm space-y-3">
            <div className="text-sm font-semibold text-slate-900">Pending Leave Requests</div>
            {error && (
                <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
            )}
            <div className="divide-y divide-slate-100 text-sm text-slate-700">
                {rows.slice(0, 5).map((request, index) => {
                    const isBusy = busyId === request.id;
                    const isExpanded = Boolean(expandedIds[request.id]);
                    return (
                        <div key={request.id || `request-${index}`} className="space-y-3 py-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <div className="text-xs uppercase text-slate-400">Status</div>
                                    <div className={`font-semibold ${request.status.tone}`}>{request.status.label}</div>
                                </div>
                                <div className="flex items-end justify-between gap-2">
                                    <div>
                                        <div className="text-xs uppercase text-slate-400">Days</div>
                                        <div className="font-semibold">{request.days}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => toggleDetail(request.id)}
                                            aria-expanded={isExpanded}
                                            className="text-xs font-semibold text-blue-600 hover:underline"
                                        >
                                            {isExpanded ? "Hide Detail" : "Detail"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleCancel(request.id)}
                                            disabled={isBusy}
                                            className="text-xs font-semibold text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-400"
                                        >
                                            {isBusy ? "Cancelling..." : "Cancel"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Detail</p>
                                    <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                                        <div>
                                            <p className="uppercase text-slate-400">Leave type</p>
                                            <p className="font-semibold text-slate-800">{request.leaveType}</p>
                                        </div>
                                        <div>
                                            <p className="uppercase text-slate-400">From date to date</p>
                                            <p className="font-semibold text-slate-800">
                                                {request.fromDate} - {request.toDate}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="uppercase text-slate-400">Reason</p>
                                            <p className="font-semibold text-slate-800">{request.reason || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="uppercase text-slate-400">Contact</p>
                                            <p className="font-semibold text-slate-800">{request.contact || "-"}</p>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <p className="uppercase text-slate-400">Comment</p>
                                            <p className="font-semibold text-slate-800">{request.comment || "-"}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
