"use client";

import { useEffect, useState } from "react";
import { PencilIcon } from "@/components/dashboard/home/Icons";
import { ManagerSideNav } from "@/components/layout/navigation/ManagerSideNav";

type Subordinate = {
    id: string;
    full_name: string;
    email: string;
    position: string;
    department: string;
    status: string;
};

type TeamData = {
    total: number;
    subordinates: Subordinate[];
};

const STATUS_LABEL: Record<string, string> = {
    active: "Active",
    inactive: "Inactive",
    pending: "Pending",
};

const STATUS_STYLE: Record<string, string> = {
    Active: "bg-emerald-50 text-emerald-600",
    Pending: "bg-amber-50 text-amber-600",
    Inactive: "bg-slate-100 text-slate-500",
};

const PAGE_SIZE = 5;

function StatusBadge({ status }: { status: string }) {
    const label = STATUS_LABEL[status] ?? status;
    return (
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[label] ?? "bg-slate-100 text-slate-500"}`}>
            {label}
        </span>
    );
}

function ProductivityBar({ value }: { value: number }) {
    return (
        <div className="flex items-center gap-2">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-blue-500" style={{ width: `${Math.min(value, 100)}%` }} />
            </div>
            <span className="text-xs font-semibold text-slate-700">{value ? `${value}%` : "-"}</span>
        </div>
    );
}

export default function ManagerTeamPage() {
    const [teamData, setTeamData] = useState<TeamData | null>(null);
    const [onLeaveCount, setOnLeaveCount] = useState(0);
    const [page, setPage] = useState(1);

    useEffect(() => {
        async function fetchData() {
            const [teamRes, overviewRes] = await Promise.all([
                fetch("/api/manager/team"),
                fetch("/api/manager/leave-overview"),
            ]);

            if (teamRes.ok) {
                const json = await teamRes.json() as TeamData;
                setTeamData(json);
            }

            if (overviewRes.ok) {
                const json = await overviewRes.json() as { data: { employees_on_leave_today: number } };
                setOnLeaveCount(json.data.employees_on_leave_today);
            }
        }

        void fetchData();
    }, []);

    const subordinates = teamData?.subordinates ?? [];
    const total = teamData?.total ?? 0;
    const activeCount = subordinates.filter((m) => m.status === "active").length;
    const inactiveCount = subordinates.filter((m) => m.status === "inactive").length;
    const totalPages = Math.max(1, Math.ceil(subordinates.length / PAGE_SIZE));
    const paginated = subordinates.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const startIdx = subordinates.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const endIdx = Math.min(page * PAGE_SIZE, subordinates.length);

    const stats = [
        { label: "Total Members", value: total, icon: "👥" },
        { label: "Active Today", value: activeCount, icon: "✅" },
        { label: "On Leave", value: onLeaveCount, icon: "📅", cta: "View Requests" },
        { label: "Inactive", value: inactiveCount, icon: "🚫" },
    ];

    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8">
                <ManagerSideNav />

                <section className="flex-1 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold">Team Directory</h1>
                            <p className="text-sm text-slate-500">
                                Showing {total} member{total !== 1 ? "s" : ""} in your workspace
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                            <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm">
                                <span>Department: All</span>
                                <span className="text-slate-400">⌄</span>
                            </button>
                            <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm">
                                <span>Status: All</span>
                                <span className="text-slate-400">⌄</span>
                            </button>
                            <button className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-white shadow">
                                + Add Member
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {stats.map((item) => (
                            <div key={item.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
                                    <span className="text-slate-400">{item.icon}</span>
                                    {item.cta ? <button className="text-xs font-semibold text-blue-600">{item.cta}</button> : null}
                                </div>
                                <p className="mt-2 text-[12px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                                <p className="text-3xl font-extrabold text-slate-900">{item.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            <span className="w-48">Member</span>
                            <span className="w-40">Position</span>
                            <span className="w-32">Department</span>
                            <span className="w-36">Productivity</span>
                            <span className="w-28">Status</span>
                            <span className="w-16 text-right">Action</span>
                        </div>

                        <div className="divide-y divide-slate-100 text-sm font-semibold text-slate-800">
                            {paginated.length === 0 && (
                                <p className="px-5 py-8 text-center text-sm text-slate-400">No team members found.</p>
                            )}
                            {paginated.map((m) => (
                                <div key={m.id} className="flex items-center gap-4 px-5 py-4">
                                    <div className="w-48 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
                                                {m.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-slate-900">{m.full_name}</p>
                                                <p className="truncate text-xs font-semibold text-slate-500">{m.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-40 truncate text-slate-700">{m.position}</div>
                                    <div className="w-32">
                                        <span className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{m.department}</span>
                                    </div>
                                    <div className="w-36">
                                        <ProductivityBar value={0} />
                                    </div>
                                    <div className="w-28">
                                        <StatusBadge status={m.status} />
                                    </div>
                                    <div className="flex w-16 justify-end">
                                        <button className="rounded-full border border-slate-200 p-2 text-slate-500 hover:border-slate-300">
                                            <PencilIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-xs font-semibold text-slate-500">
                            <span>
                                {subordinates.length === 0
                                    ? "No members"
                                    : `Showing ${startIdx} - ${endIdx} of ${subordinates.length} members`}
                            </span>
                            <div className="flex items-center gap-2">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
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
                    </div>
                </section>
            </div>
        </main>
    );
}
