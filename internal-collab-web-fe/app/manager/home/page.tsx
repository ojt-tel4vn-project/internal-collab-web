"use client";

import { useState } from "react";
import { DashboardCalendar } from "@/components/dashboard/home/Calendar";
import { ManagerSideNav } from "@/components/layout/navigation/ManagerSideNav";

type LeaveOverview = {
    pending: number;
    employees_on_leave_today: number;
    upcoming_leaves: {
        employee: string;
        from_date: string;
        to_date: string;
    }[];
};

export default function ManagerHomePage() {
    const [viewMode, setViewMode] = useState<"monthly" | "weekly">("monthly");
    const [overview, setOverview] = useState<LeaveOverview | null>(null);
    const [teamTotal, setTeamTotal] = useState<number | null>(null);

    useEffect(() => {
        async function fetchData() {
            const [overviewRes, teamRes] = await Promise.all([
                fetch("/api/manager/leave-overview"),
                fetch("/api/manager/team"),
            ]);

            if (overviewRes.ok) {
                const json = await overviewRes.json() as { data: LeaveOverview };
                setOverview(json.data);
            }

            if (teamRes.ok) {
                const json = await teamRes.json() as { total: number };
                setTeamTotal(json.total);
            }
        }

        void fetchData();
    }, []);

    const stats = [
        { label: "Team Members", value: teamTotal !== null ? String(teamTotal) : "—" },
        { label: "Pending Approvals", value: overview ? String(overview.pending) : "—" },
        { label: "On Leave", value: overview ? String(overview.employees_on_leave_today) : "—" },
        { label: "Attendance", value: "92%" },
    ];

    const upcomingLeaves = overview?.upcoming_leaves ?? [];
    const visibleLeaves = upcomingLeaves.slice(0, VISIBLE_LEAVE_COUNT);
    const hiddenCount = upcomingLeaves.length - visibleLeaves.length;

    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8">
                <ManagerSideNav />

                <section className="flex-1 space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {stats.map((item) => (
                            <div
                                key={item.label}
                                className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-white px-5 py-4 shadow-sm"
                            >
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                                <div className="mt-3 text-3xl font-extrabold text-slate-900">{item.value}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                    <span className="text-blue-500">📅</span>
                                    <span>Calendar</span>
                                </div>
                                <div className="inline-flex items-center rounded-full bg-slate-50 p-1 text-xs font-semibold text-slate-600">
                                    <button
                                        className={`rounded-full px-3 py-1 ${viewMode === "monthly" ? "bg-blue-600 text-white shadow" : ""}`}
                                        onClick={() => setViewMode("monthly")}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        className={`rounded-full px-3 py-1 ${viewMode === "weekly" ? "bg-blue-600 text-white shadow" : ""}`}
                                        onClick={() => setViewMode("weekly")}
                                    >
                                        Weekly
                                    </button>
                                </div>
                            </div>
                            <DashboardCalendar viewMode={viewMode} />
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                    <span className="text-blue-500">👥</span>
                                    <span>On Leave Today</span>
                                </div>
                                <div className="mt-4 space-y-3">
                                    {visibleLeaves.length === 0 && (
                                        <p className="text-sm text-slate-400">No one on leave today.</p>
                                    )}
                                    {visibleLeaves.map((p) => (
                                        <div key={p.employee} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
                                                {p.employee.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                            </span>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{p.employee}</p>
                                                <p className="text-xs font-semibold text-slate-500">
                                                    Until {new Date(p.to_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {hiddenCount > 0 && (
                                        <button className="mt-2 w-full rounded-xl border border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-500">
                                            +{hiddenCount} more
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
