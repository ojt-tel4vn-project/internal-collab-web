"use client";

import { useEffect, useState } from "react";
import { DashboardCalendar } from "@/components/dashboard/home/Calendar";
import { CalendarIcon } from "@/components/dashboard/home/Icons";
import { LeaderboardCard } from "@/components/dashboard/home/Leaderboard";
import { TaskList } from "@/components/dashboard/home/TaskList";

type AdminDashboardMetrics = {
    totalEmployees: number;
    leaveRequests: number;
    attendanceComments: number;
};

export default function AdminHomePage() {
    const [viewMode, setViewMode] = useState<"monthly" | "weekly">("monthly");
    const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
    const [metricsError, setMetricsError] = useState<string | null>(null);

    useEffect(() => {
        let isCancelled = false;

        async function loadMetrics() {
            try {
                setMetricsError(null);

                const response = await fetch("/api/employee?view=admin-dashboard", {
                    cache: "no-store",
                });

                if (!response.ok) {
                    const payload = (await response.json().catch(() => null)) as
                        | { message?: string; detail?: string }
                        | null;

                    throw new Error(payload?.message ?? payload?.detail ?? "Failed to load dashboard metrics");
                }

                const payload = (await response.json()) as AdminDashboardMetrics;
                if (!isCancelled) {
                    setMetrics(payload);
                }
            } catch (error) {
                if (!isCancelled) {
                    setMetrics(null);
                    setMetricsError(error instanceof Error ? error.message : "Failed to load dashboard metrics");
                }
            }
        }

        void loadMetrics();

        return () => {
            isCancelled = true;
        };
    }, []);

    const stats = [
        {
            label: "Total Accounts",
            value: metrics?.totalEmployees?.toString() ?? "--",
        },
        {
            label: "Unread attendance comments",
            value: metrics?.attendanceComments?.toString() ?? "--",
        },
        {
            label: "Leave Requests",
            value: metrics?.leaveRequests?.toString() ?? "--",
        },
    ];

    return (
        <section className="flex-1 space-y-6">
            <h1 className="text-2xl font-bold">Admin Dashboard Overview</h1>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {stats.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                        <div className="text-xs font-semibold text-slate-500">{item.label}</div>
                        <div className="mt-3 text-3xl font-extrabold text-slate-900">{item.value}</div>
                    </div>
                ))}
            </div>

            {metricsError ? (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                    {metricsError}
                </div>
            ) : null}

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
                </div>

                <div className="space-y-4">
                    <TaskList />

                    <LeaderboardCard viewAllHref="/admin/leaderboard" />
                </div>
            </div>
        </section>
    );
}
