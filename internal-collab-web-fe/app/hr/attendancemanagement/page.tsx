"use client";

import { HRSideNav } from "@/components/navigation/HRSideNav";

const statCards = [
    { label: "Total records", value: 48, helper: "Updated just now" },
    { label: "Confirmed", value: 38, helper: "Processed successfully" },
    { label: "Pending review", value: 5, helper: "Action required" },
    { label: "Auto-confirmed", value: 5, helper: "System automated" },
];

const comments = [
    {
        name: "Tran Thi B",
        tag: "Employee Comment",
        text: "I forgot my badge at home, but I was in by 9:15 AM.",
        date: "23 Oct",
    },
    {
        name: "Pham Thi D",
        tag: "System Alert",
        text: "Missing Check-in time. System defaulted to manual review.",
        date: "23 Oct",
    },
];

const attendanceRows = [
    {
        name: "Nguyen Van A",
        role: "Engineering",
        date: "23 Oct 2023",
        status: "Confirmed",
        comments: 0,
    },
];

function StatusPill({ status }: { status: string }) {
    const map: Record<string, string> = {
        Confirmed: "bg-emerald-100 text-emerald-700",
        Pending: "bg-amber-100 text-amber-700",
    };
    return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[status] ?? "bg-slate-100 text-slate-600"}`}>{status}</span>;
}

export default function HrAttendanceManagementPage() {
    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-8">
                <HRSideNav />

                <section className="grid w-full gap-6 lg:grid-cols-[2fr_1fr]">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-1">
                                <h1 className="text-2xl font-bold">Attendance Management</h1>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">October 2023 ⌄</button>
                                <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">Download Template</button>
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-4">
                            {statCards.map((card) => (
                                <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <span>{card.label}</span>
                                        <span className="text-slate-400">⬇</span>
                                    </div>
                                    <div className="mt-3 text-3xl font-extrabold text-slate-900">{card.value}</div>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">{card.helper}</p>
                                </div>
                            ))}
                        </div>

                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-500">☁️</div>
                            <h3 className="mt-4 text-lg font-semibold text-slate-900">Upload Attendance File</h3>
                            <p className="mt-2 text-sm font-semibold text-slate-500">
                                Drag and drop your Excel or CSV file here, or click to browse. Supported formats: .xlsx, .csv
                            </p>
                            <div className="mt-5 flex justify-center">
                                <button className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm">Browse File</button>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <span>Employee</span>
                                <span>Date</span>
                                <span>Status</span>
                                <span>Comments</span>
                                <span className="text-right">Action</span>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {attendanceRows.map((row) => (
                                    <div key={row.name} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-4 px-5 py-3 text-sm font-semibold text-slate-800">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
                                                {row.name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")}
                                            </span>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{row.name}</p>
                                                <p className="text-xs font-semibold text-slate-500">{row.role}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-semibold text-slate-700">{row.date}</span>
                                        <StatusPill status={row.status} />
                                        <span className="flex items-center gap-1 text-sm font-semibold text-slate-600">🗨️ {row.comments}</span>
                                        <button className="justify-self-end rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">⋯</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <aside className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Comments</h3>
                                <p className="text-xs font-semibold text-slate-500">Needing Review</p>
                            </div>
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">2 New</span>
                        </div>

                        <div className="space-y-4">
                            {comments.map((c) => (
                                <div key={c.name} className="rounded-xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
                                    <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-900">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                                                {c.name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")}
                                            </span>
                                            <span>{c.name}</span>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-400">{c.date}</span>
                                    </div>
                                    <div className="mb-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                                        <span className="text-[11px] uppercase tracking-wide text-amber-600">{c.tag}</span>
                                        <p className="mt-1 text-sm font-semibold text-slate-800">“{c.text}”</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Edit Record</button>
                                        <button className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Keep Original</button>
                                        <button className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Mark Resolved</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                </section>
            </div>
        </main>
    );
}
