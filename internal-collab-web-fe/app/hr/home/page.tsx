"use client";

import { useState } from "react";
import { TaskList } from "@/components/home/TaskList";
import { LeaderboardCard } from "@/components/home/Leaderboard";
import { DashboardCalendar } from "@/components/home/Calendar";
import { MilestonesCard } from "@/components/home/Milestones";
import { leaderboard } from "@/app/employee/_data";
import { CalendarIcon } from "@/components/home/Icons";
import { HRSideNav } from "@/components/navigation/HRSideNav";
import type { Milestone } from "@/types/dashboard";

const stats = [
    { label: "Total Employees", value: "48", change: "+2.4%", tone: "text-emerald-600" },
    { label: "Attendance Comments", value: "5", change: "-0.5%", tone: "text-rose-500" },
    { label: "Leave Requests", value: "4", change: "Stable", tone: "text-slate-500" },
    { label: "Attendance Rate", value: "94%", change: "+0.8%", tone: "text-emerald-600" },
];

const upcomingEvents: Milestone[] = [
    { day: 14, month: "Oct", title: "Town Hall Meeting", subtitle: "10:00 AM • Conference Room A" },
    { day: 18, month: "Oct", title: "Quarterly Review", subtitle: "09:00 AM • Online" },
];

export default function HrDashboardPage() {
    const [viewMode, setViewMode] = useState<"monthly" | "weekly">("monthly");

    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-8">
                <HRSideNav />

                <section className="flex-1 space-y-6">
                    <h1 className="text-2xl font-bold">HR Dashboard Overview</h1>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {stats.map((item) => (
                            <div key={item.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                                    <span>{item.label}</span>
                                    <span className={item.tone}>{item.change}</span>
                                </div>
                                <div className="mt-3 text-3xl font-extrabold text-slate-900">{item.value}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
                        <div className="space-y-5">
                            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                        <CalendarIcon className="h-5 w-5 text-blue-500" />
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

                            <MilestonesCard milestones={upcomingEvents} />
                        </div>

                        <div className="space-y-4">
                            <TaskList />

                            <LeaderboardCard entries={leaderboard} />
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
