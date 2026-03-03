"use client";

import { useState } from "react";
import { HRSideNav } from "@/components/navigation/HRSideNav";

const stats = [
    { label: "Total Employees", value: "48", icon: "👥" },
    { label: "Active Now", value: "45", icon: "🧑‍💻" },
    { label: "On Leave", value: "3", icon: "🌴" },
];

const employees = [
    {
        name: "Nguyen Van A",
        role: "Senior Engineer",
        department: "Engineering",
        manager: "Le Van C",
        joined: "Jan 12, 2021",
        status: "Active",
    },
    {
        name: "Tran Thi B",
        role: "UX Designer",
        department: "Design",
        manager: "Sarah Miller",
        joined: "Mar 05, 2022",
        status: "Active",
    },
    {
        name: "Le Van D",
        role: "QA Engineer",
        department: "Quality",
        manager: "Rachel Lee",
        joined: "Jul 18, 2020",
        status: "Active",
    },
    {
        name: "Alex Wong",
        role: "Data Analyst",
        department: "Data",
        manager: "Kim Nguyen",
        joined: "Nov 30, 2022",
        status: "Inactive",
    },
];

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        Active: "bg-emerald-100 text-emerald-700",
        Inactive: "bg-slate-200 text-slate-600",
        Leave: "bg-amber-100 text-amber-700",
    };
    return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[status] ?? "bg-slate-100 text-slate-600"}`}>{status}</span>;
}

function EmployeeCard({ person }: { person: (typeof employees)[number] }) {
    const initials = person.name
        .split(" ")
        .map((n) => n[0])
        .join("");

    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">{initials}</span>
                    <div>
                        <p className="text-base font-bold text-slate-900">{person.name}</p>
                        <p className="text-sm font-semibold text-slate-600">{person.role}</p>
                    </div>
                </div>
                <StatusBadge status={person.status} />
            </div>

            <div className="space-y-2 text-sm font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                    <span className="text-slate-500">🏢</span>
                    <span>{person.department}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-slate-500">👤</span>
                    <span>Manager: {person.manager}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-slate-500">📅</span>
                    <span>Joined: {person.joined}</span>
                </div>
            </div>

            <div className="flex gap-3">
                <button className="flex-1 rounded-full border border-slate-200 bg-slate-50 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Edit Profile</button>
                <button className="flex-1 rounded-full border border-rose-200 bg-white py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50">Offboard</button>
            </div>
        </div>
    );
}

export default function HrEmployeeManagementPage() {
    const [showOnboard, setShowOnboard] = useState(false);

    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-8">
                <HRSideNav />

                <section className="grid w-full gap-6 lg:grid-cols-[2fr_1fr]">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold">Employee Management</h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="relative flex-1 min-w-[220px]">
                                <input
                                    placeholder="Search employees..."
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                            </div>
                            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                                All Departments ⌄
                            </button>
                            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                                All Status ⌄
                            </button>
                            <button
                                onClick={() => setShowOnboard(true)}
                                className="ml-auto inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                            >
                                + New Employee
                            </button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {stats.map((item) => (
                                <div key={item.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                                        <span>{item.label}</span>
                                        <span>{item.icon}</span>
                                    </div>
                                    <div className="mt-3 text-3xl font-extrabold text-slate-900">{item.value}</div>
                                </div>
                            ))}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {employees.map((person) => (
                                <EmployeeCard key={person.name} person={person} />
                            ))}
                        </div>
                    </div>

                    {showOnboard ? (
                        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-start justify-between gap-3">
                                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm font-semibold text-slate-700">
                                    Complete all required fields to initiate the onboarding workflow. Credentials will be sent automatically.
                                </div>
                                <button
                                    onClick={() => setShowOnboard(false)}
                                    className="h-8 w-8 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
                                    aria-label="Close onboarding"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-4 text-sm font-semibold text-slate-700">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <p className="text-xs uppercase tracking-wide text-slate-500">First Name</p>
                                        <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-500" placeholder="e.g. John" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs uppercase tracking-wide text-slate-500">Last Name</p>
                                        <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-500" placeholder="e.g. Doe" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
                                    <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-500" placeholder="john.doe@company.com" />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <p className="text-xs uppercase tracking-wide text-slate-500">Phone</p>
                                        <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-500" placeholder="e.g. +1 555 123 4567" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs uppercase tracking-wide text-slate-500">Address</p>
                                        <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-500" placeholder="e.g. 123 Main St" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <p className="text-xs uppercase tracking-wide text-slate-500">Date of Birth</p>
                                        <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-500" placeholder="YYYY-MM-DD" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs uppercase tracking-wide text-slate-500">Join Date</p>
                                        <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-500" placeholder="YYYY-MM-DD" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <p className="text-xs uppercase tracking-wide text-slate-500">Employee Code</p>
                                        <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-500" placeholder="e.g. EMP-001" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs uppercase tracking-wide text-slate-500">Position</p>
                                        <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-500" placeholder="e.g. Senior Engineer" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Department</p>
                                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                                        <span>Select Department</span>
                                        <span className="text-slate-400">⌄</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Manager</p>
                                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                                        <span>Select Manager</span>
                                        <span className="text-slate-400">⌄</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                                        <span>Select Status</span>
                                        <span className="text-slate-400">⌄</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-3 pt-2">
                                    <button
                                        onClick={() => setShowOnboard(false)}
                                        className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-700"
                                    >
                                        Cancel
                                    </button>
                                    <button className="flex-1 rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700">Create Profile</button>
                                </div>
                            </div>
                        </aside>
                    ) : null}
                </section>
            </div>
        </main>
    );
}
