"use client";

import { DashboardNavbar } from "@/components/dashboard/Navbar";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { GridIcon, ClockIcon, CalendarIcon } from "@/components/dashboard/Icons";
import type { NavItem } from "@/types/dashboard";

const navItems: NavItem[] = [
    { label: "Home", href: "/manager", icon: GridIcon },
    { label: "Team", href: "/manager/team", icon: ClockIcon },
    { label: "Leave Approvals", href: "/manager/leave-approvals", active: true, icon: CalendarIcon, badge: "4" },
];

const summary = [
    { label: "Pending Review", value: 4, tone: "text-slate-900", accent: "border-amber-100" },
    { label: "Approved This Month", value: 12, tone: "text-emerald-600", accent: "border-emerald-100" },
    { label: "Rejected This Month", value: 2, tone: "text-rose-500", accent: "border-rose-100" },
];

const filters = ["All", "Pending", "Approved", "Rejected"];

const requests = [
    {
        name: "Nguyen Van A",
        role: "Software Engineer",
        type: "Annual Leave",
        date: "Oct 24 - Oct 27, 2023 (4 days)",
        note: "Family gathering back in the hometown for the weekend festival.",
        status: "Pending",
    },
    {
        name: "Le Van C",
        role: "UI Designer",
        type: "Medical",
        date: "Oct 15 - Oct 16, 2023 (2 days)",
        note: "Routine health checkup and recovery.",
        status: "Approved",
    },
    {
        name: "Pham Thi D",
        role: "Project Manager",
        type: "Personal",
        date: "Oct 10, 2023 (1 day)",
        note: "Personal errands.",
        status: "Rejected",
        rejection: "Critical project milestone delivery scheduled on this date. Request rescheduling if possible.",
    },
];

function StatusPill({ status }: { status: "Pending" | "Approved" | "Rejected" }) {
    const map = {
        Pending: "bg-amber-100 text-amber-700",
        Approved: "bg-emerald-100 text-emerald-700",
        Rejected: "bg-rose-100 text-rose-700",
    };
    return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[status]}`}>{status}</span>;
}

export default function ManagerLeaveApprovalsPage() {
    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <DashboardNavbar user={{ initials: "AJ", name: "Alex Johnson", role: "Product Designer" }} notificationCount={1} />

            <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8">
                <SidebarNav items={navItems} />

                <section className="flex-1 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold">Leave Approvals</h1>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        {summary.map((item) => (
                            <div key={item.label} className={`rounded-2xl border ${item.accent} bg-white p-5 shadow-sm`}>
                                <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                                <p className={`mt-2 text-3xl font-extrabold ${item.tone}`}>{item.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold">
                        <div className="flex items-center gap-2">
                            {filters.map((f, idx) => (
                                <button
                                    key={f}
                                    className={`rounded-full px-4 py-2 ${idx === 1 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm">All Members ⌄</button>
                            <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm">Date Range ⌄</button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {requests.map((req) => (
                            <article key={req.name} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <div className="flex flex-wrap items-start gap-4">
                                    <div className="flex w-56 items-center gap-3">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
                                            {req.name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")}
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{req.name}</p>
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{req.role}</p>
                                        </div>
                                    </div>

                                    <div className="w-36 text-xs font-semibold text-slate-500">
                                        <p className="text-[11px] uppercase tracking-wide">Leave Type</p>
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{req.type}</span>
                                    </div>

                                    <div className="w-48 text-xs font-semibold text-slate-600">
                                        <p className="text-[11px] uppercase tracking-wide text-slate-400">Duration</p>
                                        <p className="text-[13px] text-slate-900">{req.date}</p>
                                    </div>

                                    <div className="flex-1 text-sm font-semibold text-slate-600">
                                        <p className="text-[11px] uppercase tracking-wide text-slate-400">Notes</p>
                                        <p className="text-sm text-slate-700">“{req.note}”</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <StatusPill status={req.status as "Pending" | "Approved" | "Rejected"} />
                                        {req.status === "Pending" ? (
                                            <>
                                                <button className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">Approve</button>
                                                <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Reject</button>
                                            </>
                                        ) : null}
                                    </div>
                                </div>

                                {req.rejection ? (
                                    <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">
                                        Rejection reason: “{req.rejection}”
                                    </div>
                                ) : null}
                            </article>
                        ))}
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-5 py-4 text-xs font-semibold text-slate-500">
                        <span>Showing 1-4 of 28 requests</span>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3].map((n) => (
                                <button
                                    key={n}
                                    className={`h-7 w-7 rounded-md border text-xs font-semibold ${n === 1 ? "border-blue-200 bg-blue-50 text-blue-600" : "border-slate-200 bg-white text-slate-600"
                                        }`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
