"use client";

import { ManagerSideNav } from "@/components/navigation/ManagerSideNav";
import { PencilIcon } from "@/components/dashboard/Icons";

const stats = [
    { label: "Total Members", value: 12, icon: "👥" },
    { label: "Active Today", value: 10, icon: "✅" },
    { label: "On Leave", value: 3, icon: "📅", cta: "View Requests" },
    { label: "Inactive", value: 1, icon: "🚫" },
];

const members = [
    {
        name: "Nguyen Van A",
        email: "a.nguyen@collabhub.com",
        position: "Senior Designer",
        department: "Design",
        productivity: 96,
        status: "Active",
    },
    {
        name: "Tran Thi B",
        email: "b.tran@collabhub.com",
        position: "Project Manager",
        department: "Ops",
        productivity: 0,
        status: "Pending",
    },
    {
        name: "James Wilson",
        email: "j.wilson@collabhub.com",
        position: "Fullstack Developer",
        department: "Eng",
        productivity: 82,
        status: "Active",
    },
    {
        name: "Sarah Chen",
        email: "s.chen@collabhub.com",
        position: "Marketing Manager",
        department: "Marketing",
        productivity: 74,
        status: "Active",
    },
    {
        name: "Anna W",
        email: "a.w@collabhub.com",
        position: "UX Writer",
        department: "Content",
        productivity: 0,
        status: "Inactive",
    },
];

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        Active: "bg-emerald-50 text-emerald-600",
        Pending: "bg-amber-50 text-amber-600",
        Inactive: "bg-slate-100 text-slate-500",
    };
    return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${map[status] || "bg-slate-100 text-slate-500"}`}>{status}</span>;
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
    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8">
                <ManagerSideNav />

                <section className="flex-1 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold">Team Directory</h1>
                            <p className="text-sm text-slate-500">Showing 12 active members in your workspace</p>
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
                            {members.map((m) => (
                                <div key={m.email} className="flex items-center gap-4 px-5 py-4">
                                    <div className="w-48">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
                                                {m.name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")}
                                            </span>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{m.name}</p>
                                                <p className="text-xs font-semibold text-slate-500">{m.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-40 text-slate-700">{m.position}</div>
                                    <div className="w-32">
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{m.department}</span>
                                    </div>
                                    <div className="w-36">
                                        <ProductivityBar value={m.productivity} />
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
                            <span>Showing 1 - 5 of 12 members</span>
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
                    </div>
                </section>
            </div>
        </main>
    );
}
