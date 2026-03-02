"use client";

import { useState } from "react";
import { DashboardCalendar } from "@/components/dashboard/Calendar";
import { DashboardNavbar } from "@/components/dashboard/Navbar";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { GridIcon, ClockIcon, CalendarIcon } from "@/components/dashboard/Icons";
import type { NavItem } from "@/types/dashboard";

const navItems: NavItem[] = [
    { label: "Home", href: "/manager", active: true, icon: GridIcon },
    { label: "Team", href: "/manager/team", icon: ClockIcon },
    { label: "Leave Approvals", href: "/manager/leave-approvals", icon: CalendarIcon, badge: "4" },
];

const stats = [
    { label: "Team Members", value: "24", accent: "from-blue-50 to-blue-100" },
    { label: "Pending Approvals", value: "4", accent: "from-amber-50 to-amber-100" },
    { label: "On Leave", value: "3", accent: "from-emerald-50 to-emerald-100" },
    { label: "Attendance", value: "92%", accent: "from-indigo-50 to-indigo-100" },
];

const onLeaveToday = [
    { name: "Harvey Specter", note: "Returning tomorrow" },
    { name: "Donna Paulsen", note: "Sick Leave" },
];

const milestones = [
    { date: "Oct 24", title: "5-Year Anniversary", desc: "Rachel Green" },
    { date: "Nov 02", title: "Product Launch", desc: "Engineering Team" },
];

export default function ManagerHomePage() {
    const [viewMode, setViewMode] = useState<"monthly" | "weekly">("monthly");

    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <DashboardNavbar user={{ initials: "AJ", name: "Alex Johnson", role: "Product Designer" }} notificationCount={1} />

            <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8">
                <SidebarNav items={navItems} />

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
                                        Daily
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
                                <h3 className="text-sm font-semibold text-slate-900">Upcoming Milestones</h3>
                                <div className="mt-4 space-y-3">
                                    {milestones.map((m) => (
                                        <div key={m.title} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
                                            <span className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700">{m.date}</span>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{m.title}</p>
                                                <p className="text-xs font-semibold text-slate-500">{m.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

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
