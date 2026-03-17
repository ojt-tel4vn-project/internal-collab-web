"use client";

import { useCallback, useEffect, useState } from "react";
import { ManagerSideNav } from "@/components/layout/navigation/ManagerSideNav";

type LeaveEmployee = {
    id: string;
    full_name: string;
    email: string;
    position: string;
    avatar_url: string;
};

type LeaveType = {
    id: string;
    name: string;
};

type LeaveRequest = {
    id: string;
    from_date: string;
    to_date: string;
    total_days: number;
    reason: string;
    contact_during_leave: string;
    status: string;
    approver_comment: string;
    submitted_at: string;
    employee: LeaveEmployee;
    leave_type: LeaveType;
    approver?: LeaveEmployee | null;
};

type LeaveOverview = {
    total_requests: number;
    pending: number;
    approved: number;
    rejected: number;
    employees_on_leave_today: number;
};

const FILTERS = ["All", "Pending"] as const;
type Filter = (typeof FILTERS)[number];

const LIMIT = 20;

function StatusPill({ status }: { status: string }) {
    const map: Record<string, string> = {
        pending: "bg-amber-100 text-amber-700",
        approved: "bg-emerald-100 text-emerald-700",
        rejected: "bg-rose-100 text-rose-700",
        canceled: "bg-slate-100 text-slate-500",
    };
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    return (
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[status] ?? "bg-slate-100 text-slate-600"}`}>
            {label}
        </span>
    );
}

function formatDateRange(from: string, to: string, days: number) {
    const fmt = (d: Date) =>
        d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (from === to) return `${fmt(fromDate)} (${days} day)`;
    return `${fmt(fromDate)} â€“ ${fmt(toDate)} (${days} days)`;
}

export default function ManagerLeaveApprovalsPage() {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [overview, setOverview] = useState<LeaveOverview | null>(null);
    const [activeFilter, setActiveFilter] = useState<Filter>("Pending");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectError, setRejectError] = useState<string | null>(null);
    const [rejectLoading, setRejectLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [pendingRes, overviewRes] = await Promise.all([
                fetch(`/api/manager/leave-requests/pending-approval?page=${page}&limit=${LIMIT}`),
                fetch("/api/manager/leave-overview"),
            ]);

            if (pendingRes.ok) {
                const data = (await pendingRes.json()) as { data: LeaveRequest[]; total?: number };
                setRequests(data.data ?? []);
                setTotal(data.total ?? data.data?.length ?? 0);
            } else {
                setError("Failed to load leave requests.");
            }

            if (overviewRes.ok) {
                const data = (await overviewRes.json()) as { data: LeaveOverview };
                setOverview(data.data);
            }
        } catch {
            setError("Unable to connect to server.");
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    const filteredRequests = requests.filter((r) => {
        if (activeFilter === "All") return true;
        return r.status === activeFilter.toLowerCase();
    });

    function extractErrorMessage(data: unknown): string {
        if (!data || typeof data !== "object") return "An unexpected error occurred.";
        const d = data as Record<string, unknown>;
        if (typeof d.detail === "string" && d.detail) return d.detail;
        if (Array.isArray(d.errors) && d.errors.length > 0) {
            const first = d.errors[0] as Record<string, unknown>;
            if (typeof first.message === "string") return first.message;
        }
        if (typeof d.message === "string" && d.message) return d.message;
        return "An unexpected error occurred.";
    }

    async function handleApprove(id: string) {
        setBusyId(id);
        setError(null);
        try {
            const res = await fetch(`/api/manager/leave-requests/${id}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "approve", comment: "" }),
            });
            if (res.ok) {
                await fetchData();
            } else {
                const data = await res.json();
                setError(extractErrorMessage(data));
            }
        } catch {
            setError("Unable to connect to server.");
        } finally {
            setBusyId(null);
        }
    }

    function openRejectModal(req: LeaveRequest) {
        setRejectTarget(req);
        setRejectReason("");
        setRejectError(null);
    }

    function closeRejectModal() {
        setRejectTarget(null);
        setRejectReason("");
        setRejectError(null);
    }

    async function handleRejectConfirm() {
        if (!rejectTarget) return;
        if (!rejectReason.trim()) {
            setRejectError("Rejection reason is required.");
            return;
        }
        setRejectLoading(true);
        setRejectError(null);
        try {
            const res = await fetch(`/api/manager/leave-requests/${rejectTarget.id}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "reject", comment: rejectReason.trim() }),
            });
            if (res.ok) {
                closeRejectModal();
                await fetchData();
            } else {
                const data = await res.json();
                setRejectError(extractErrorMessage(data));
            }
        } catch {
            setRejectError("Unable to connect to server.");
        } finally {
            setRejectLoading(false);
        }
    }

    const pendingCount = overview?.pending ?? requests.filter((r) => r.status === "pending").length;
    const approvedCount = overview?.approved ?? 0;
    const rejectedCount = overview?.rejected ?? 0;

    const summaryCards = [
        { label: "Pending Review", value: pendingCount, tone: "text-slate-900", accent: "border-amber-100" },
        { label: "Approved This Month", value: approvedCount, tone: "text-emerald-600", accent: "border-emerald-100" },
        { label: "Rejected This Month", value: rejectedCount, tone: "text-rose-500", accent: "border-rose-100" },
    ];

    const totalPages = Math.max(1, Math.ceil(total / LIMIT));

    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8">
                <ManagerSideNav />

                <section className="flex-1 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold">Leave Approvals</h1>
                        </div>
                    </div>

                    {/* Summary cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        {summaryCards.map((item) => (
                            <div key={item.label} className={`rounded-2xl border ${item.accent} bg-white p-5 shadow-sm`}>
                                <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                                <p className={`mt-2 text-3xl font-extrabold ${item.tone}`}>{item.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Error banner */}
                    {error && (
                        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {error}
                        </div>
                    )}

                    {/* Filters */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold">
                        <div className="flex items-center gap-2">
                            {FILTERS.map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setActiveFilter(f)}
                                    className={`rounded-full px-4 py-2 ${activeFilter === f ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm">All Members âŒ„</button>
                            <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm">Date Range âŒ„</button>
                        </div>
                    </div>

                    {/* Request list */}
                    {loading ? (
                        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-12 text-center text-sm text-slate-400 shadow-sm">
                            Loading...
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-400">
                            No pending leave requests found.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredRequests.map((req) => {
                                const isBusy = busyId === req.id;
                                const initials = req.employee?.full_name?.split(" ").map((n) => n[0]).join("") ?? "?";

                                return (
                                    <article key={req.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                        <div className="flex flex-wrap items-start gap-4">
                                            <div className="flex w-56 items-center gap-3">
                                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
                                                    {initials}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{req.employee?.full_name}</p>
                                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{req.employee?.position}</p>
                                                </div>
                                            </div>

                                            <div className="w-36 text-xs font-semibold text-slate-500">
                                                <p className="text-[11px] uppercase tracking-wide">Leave Type</p>
                                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{req.leave_type?.name}</span>
                                            </div>

                                            <div className="w-48 text-xs font-semibold text-slate-600">
                                                <p className="text-[11px] uppercase tracking-wide text-slate-400">Duration</p>
                                                <p className="text-[13px] text-slate-900">
                                                    {formatDateRange(req.from_date, req.to_date, req.total_days)}
                                                </p>
                                            </div>

                                            <div className="flex-1 text-sm font-semibold text-slate-600">
                                                <p className="text-[11px] uppercase tracking-wide text-slate-400">Notes</p>
                                                <p className="text-sm text-slate-700">&quot;{req.reason}&quot;</p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <StatusPill status={req.status} />
                                                {req.status === "pending" && (
                                                    <>
                                                        <button
                                                            onClick={() => void handleApprove(req.id)}
                                                            disabled={isBusy}
                                                            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                                                        >
                                                            {isBusy ? "..." : "Approve"}
                                                        </button>
                                                        <button
                                                            onClick={() => openRejectModal(req)}
                                                            disabled={isBusy}
                                                            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {req.approver_comment && (
                                            <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">
                                                Rejection reason: &quot;{req.approver_comment}&quot;
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && total > 0 && (
                        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-5 py-4 text-xs font-semibold text-slate-500">
                            <span>
                                Showing {Math.min((page - 1) * LIMIT + 1, total)}â€“{Math.min(page * LIMIT, total)} of {total} requests
                            </span>
                            <div className="flex items-center gap-2">
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
                                    <button
                                        key={n}
                                        onClick={() => setPage(n)}
                                        className={`h-7 w-7 rounded-md border text-xs font-semibold ${n === page ? "border-blue-200 bg-blue-50 text-blue-600" : "border-slate-200 bg-white text-slate-600"}`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {/* Reject Modal */}
            {rejectTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-slate-900">Reject Leave Request</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Rejecting leave for{" "}
                            <span className="font-semibold text-slate-700">{rejectTarget.employee?.full_name}</span>
                        </p>

                        <div className="mt-4 space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Reason for rejection <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Enter reason for rejection..."
                                rows={4}
                                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-rose-400"
                            />
                            {rejectError && (
                                <p className="text-xs font-semibold text-rose-600">{rejectError}</p>
                            )}
                        </div>

                        <div className="mt-5 flex gap-3">
                            <button
                                onClick={closeRejectModal}
                                disabled={rejectLoading}
                                className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => void handleRejectConfirm()}
                                disabled={rejectLoading}
                                className="flex-1 rounded-xl bg-rose-500 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-50"
                            >
                                {rejectLoading ? "Rejecting..." : "Confirm Reject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
