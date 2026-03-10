"use client";

import { useState } from "react";
import { DashboardCalendar } from "@/components/dashboard/home/Calendar";
import { MilestonesCard } from "@/components/dashboard/home/Milestones";
import { ManagerSideNav } from "@/components/layout/navigation/ManagerSideNav";
import type { Milestone } from "@/types/dashboard";

const stats = [
    { label: "Team Members", value: "24" },
    { label: "Pending Approvals", value: "4" },
    { label: "On Leave", value: "3" },
    { label: "Attendance", value: "92%" },
];

const onLeaveToday = [
    { name: "Harvey Specter", note: "Returning tomorrow" },
    { name: "Donna Paulsen", note: "Sick Leave" },
];

const milestones: Milestone[] = [
    { day: 24, month: "Oct", title: "5-Year Anniversary", subtitle: "Rachel Green" },
    { day: 2, month: "Nov", title: "Product Launch", subtitle: "Engineering Team" },
];

export default function ManagerHomePage() {
    const [viewMode, setViewMode] = useState<"monthly" | "weekly">("monthly");

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
                            <MilestonesCard milestones={milestones} />

                            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                    <span className="text-blue-500">👥</span>
                                    <span>On Leave Today</span>
                                </div>
                                <div className="mt-4 space-y-3">
                                    {onLeaveToday.map((p) => (
                                        <div key={p.name} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
                                                {p.name.split(" ").map((n) => n[0]).join("")}
                                            </span>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                                                <p className="text-xs font-semibold text-slate-500">{p.note}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <button className="mt-2 w-full rounded-xl border border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-500">+1</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
