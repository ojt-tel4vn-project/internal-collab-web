"use client";

import { useState } from "react";
import { DashboardNavbar } from "@/components/dashboard/Navbar";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { TaskList } from "@/components/dashboard/TaskList";
import { LeaderboardCard } from "@/components/dashboard/Leaderboard";
import { DashboardCalendar } from "@/components/dashboard/Calendar";
import { leaderboard } from "@/app/employee/_data";
import { GridIcon, ClockIcon, CalendarIcon, DocumentIcon, NoteIcon } from "@/components/dashboard/Icons";
import type { NavItem } from "@/types/dashboard";

const navItems: NavItem[] = [
    { label: "Dashboard", href: "/hr", active: true, icon: GridIcon },
    { label: "Employees", href: "/hr/employeemanagement", icon: ClockIcon },
    { label: "Config", href: "/hr/pointsconfig", icon: NoteIcon },
    { label: "Attendance", href: "/hr/attendancemanagement", icon: CalendarIcon },
    { label: "Documents", href: "/hr/documents", icon: DocumentIcon },
    { label: "Leave Overview", href: "/hr/leaveoverview", icon: CalendarIcon },
];

const hrUser = { initials: "HM", name: "HR Manager", role: "Admin Role" };

const stats = [
    { label: "Total Employees", value: "48", change: "+2.4%", tone: "text-emerald-600" },
    { label: "Attendance Comments", value: "5", change: "-0.5%", tone: "text-rose-500" },
    { label: "Leave Requests", value: "4", change: "Stable", tone: "text-slate-500" },
    { label: "Attendance Rate", value: "94%", change: "+0.8%", tone: "text-emerald-600" },
];

const upcomingEvents = [
    { title: "Town Hall Meeting", detail: "Oct 14th • 10:00 AM • Conference Room A", accent: "bg-amber-500" },
    { title: "Quarterly Review", detail: "Oct 18th • 09:00 AM • Online", accent: "bg-emerald-500" },
];

export default function HrDashboardPage() {
    const [viewMode, setViewMode] = useState<"monthly" | "weekly">("monthly");

    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <DashboardNavbar user={hrUser} notificationCount={1} />

            <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-8">
                <SidebarNav items={navItems} role={{ label: "Admin Role", value: "HR Manager" }} />

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

                            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <h3 className="text-sm font-semibold text-slate-900">Upcoming Events</h3>
                                <div className="mt-4 space-y-3">
                                    {upcomingEvents.map((event) => (
                                        <div key={event.title} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
                                            <span className={`h-10 w-1 rounded-full ${event.accent}`}></span>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                                                <p className="text-xs font-semibold text-slate-500">{event.detail}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
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
