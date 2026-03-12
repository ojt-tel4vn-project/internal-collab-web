"use client";

import { useState } from "react";
import { DashboardCalendar } from "@/components/dashboard/home/Calendar";
import { LeaderboardCard } from "@/components/dashboard/home/Leaderboard";
import { TaskList } from "@/components/dashboard/home/TaskList";
import { EmployeeSideNav } from "@/components/layout/navigation/EmployeeSideNav";
import { leaderboard } from "../_data";

export default function EmployeeDashboardPage() {
    const [viewMode, setViewMode] = useState<"monthly" | "weekly">("monthly");

    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8">
                <EmployeeSideNav />

                <section className="flex-1 space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-slate-900">Daily Focus Dashboard</h1>
                        <div className="inline-flex items-center rounded-full bg-white p-1 text-sm font-semibold shadow-sm">
                            <button
                                className={`rounded-full px-4 py-1 ${viewMode === "monthly" ? "bg-blue-600 text-white shadow" : "text-slate-500"}`}
                                onClick={() => setViewMode("monthly")}
                            >
                                Monthly
                            </button>
                            <button
                                className={`rounded-full px-4 py-1 ${viewMode === "weekly" ? "bg-blue-600 text-white shadow" : "text-slate-500"}`}
                                onClick={() => setViewMode("weekly")}
                            >
                                Weekly
                            </button>
                        </div>
                    </div>

                    <DashboardCalendar viewMode={viewMode} />
                    <TaskList />
                </section>

                <aside className="flex w-full max-w-sm flex-col gap-6">
                    <LeaderboardCard entries={leaderboard} />
                </aside>
            </div>
        </main>
    );
}

