"use client";

import { useEffect, useState } from "react";
import { DashboardCalendar } from "@/components/dashboard/home/Calendar";
import { LeaderboardCard } from "@/components/dashboard/home/Leaderboard";
import { ManagerSideNav } from "@/components/layout/navigation/ManagerSideNav";
import type { CalendarEvent, LeaderboardItem } from "@/types/dashboard";

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
    const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);

    useEffect(() => {
        async function fetchData() {
            const [overviewRes, teamRes, lbRes] = await Promise.all([
                fetch("/api/manager/leave-overview"),
                fetch("/api/manager/team"),
                fetch("/api/stickers/leaderboard?limit=3"),
            ]);

            if (overviewRes.ok) {
                const json = await overviewRes.json() as { data: LeaveOverview };
                setOverview(json.data);
            }

            if (teamRes.ok) {
                const json = await teamRes.json() as { total: number };
                setTeamTotal(json.total);
            }

            if (lbRes.ok) {
                const json = await lbRes.json() as { data: { employee_id: string; full_name: string; total: number }[] };
                setLeaderboard(
                    (json.data ?? []).map((e, i) => ({
                        name: e.full_name,
                        points: e.total,
                        rank: i + 1,
                    }))
                );
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

    const calendarEvents = useMemo<CalendarEvent[]>(() => {
        const events: CalendarEvent[] = [];
        for (const leave of upcomingLeaves) {
            const from = new Date(leave.from_date);
            const to = new Date(leave.to_date);
            const cursor = new Date(from);
            while (cursor <= to) {
                events.push({
                    id: `${leave.employee}-${cursor.toISOString()}`,
                    name: leave.employee,
                    date: cursor.toISOString(),
                });
                cursor.setDate(cursor.getDate() + 1);
            }
        }
        return events;
    }, [upcomingLeaves]);

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
                            <DashboardCalendar
                                viewMode={viewMode}
                                events={calendarEvents}
                                eventGroupLabel="team on leave"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                    <span className="text-blue-500">👥</span>
                                    <span>Upcoming Leaves</span>
                                </div>
                                <div className="mt-4 space-y-3">
                                    {upcomingLeaves.length === 0 && (
                                        <p className="text-sm text-slate-400">No upcoming leaves.</p>
                                    )}
                                    {upcomingLeaves.map((p) => (
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
                                </div>
                            </div>

                            <LeaderboardCard
                                entries={leaderboard}
                                viewAllHref="/manager/leaderboard"
                            />
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
