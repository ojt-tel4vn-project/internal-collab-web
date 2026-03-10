"use client";

import { HRSideNav } from "@/components/layout/navigation/HRSideNav";

const summaryCards = [
    { label: "Total Requests", value: 18, helper: "This month", tone: "text-blue-600" },
    { label: "Pending", value: 4, helper: "Awaiting approval", tone: "text-amber-600" },
    { label: "Approved", value: 12, helper: "Scheduled leaves", tone: "text-emerald-600" },
    { label: "Rejected", value: 2, helper: "Declined requests", tone: "text-rose-600" },
];

const requests = [
    { name: "Nguyen Van A", dept: "Eng", type: "Annual", from: "Oct 24", to: "Oct 26", days: 3, status: "Pending", manager: "Sarah J." },
    { name: "Tran Thi B", dept: "Design", type: "WFH", from: "Oct 25", to: "Oct 25", days: 1, status: "Approved", manager: "Mike R." },
    { name: "Le Van C", dept: "Eng", type: "Sick", from: "Oct 20", to: "Oct 22", days: 3, status: "Approved", manager: "Sarah J." },
    { name: "Pham Thi D", dept: "Mkt", type: "Annual", from: "Nov 01", to: "Nov 05", days: 5, status: "Pending", manager: "Lisa M." },
    { name: "John D", dept: "Sales", type: "Annual", from: "Dec 20", to: "Dec 30", days: 10, status: "Rejected", manager: "Tom H." },
];

function StatusPill({ status }: { status: string }) {
    const map: Record<string, string> = {
        Pending: "bg-amber-100 text-amber-700",
        Approved: "bg-emerald-100 text-emerald-700",
        Rejected: "bg-rose-100 text-rose-700",
    };
    return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[status] ?? "bg-slate-100 text-slate-600"}`}>{status}</span>;
}

function TypePill({ type }: { type: string }) {
    const map: Record<string, string> = {
        Annual: "bg-purple-100 text-purple-700",
        Sick: "bg-amber-100 text-amber-700",
        WFH: "bg-blue-100 text-blue-700",
    };
    return <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${map[type] ?? "bg-slate-100 text-slate-600"}`}>{type}</span>;
}

export default function HrLeaveOverviewPage() {
    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-8">
                <HRSideNav />

                <section className="flex-1 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold">Leave Overview</h1>
                            <p className="text-sm font-semibold text-slate-500">Manage and monitor employee leave requests efficiently.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">View Calendar</button>
                            <button className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700">+ New Request</button>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                        {summaryCards.map((card) => (
                            <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                                <p className={`mt-2 text-4xl font-extrabold ${card.tone}`}>{card.value}</p>
                                <p className="text-xs font-semibold text-slate-500">{card.helper}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-sm font-semibold text-slate-700">
                        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">All Departments ⌄</button>
                        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">All Status ⌄</button>
                        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">Oct 1 - Oct 31, 2023 ⌄</button>
                        <button className="ml-auto inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">Export</button>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center gap-6 border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-600">
                            {"All Requests Pending Approved Rejected".split(" ").map((tab, idx) => (
                                <button
                                    key={tab}
                                    className={`pb-3 ${idx === 0 ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-600"}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] items-center gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <span>Employee</span>
                            <span>Dept</span>
                            <span>Type</span>
                            <span>From</span>
                            <span>To</span>
                            <span>Days</span>
                            <span>Status</span>
                            <span className="text-right">Action</span>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {requests.map((req) => (
                                <div key={req.name} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] items-center gap-4 px-5 py-3 text-sm font-semibold text-slate-800">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                                            {req.name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")}
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{req.name}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-600">{req.dept}</span>
                                    <TypePill type={req.type} />
                                    <span className="text-sm font-semibold text-slate-700">{req.from}</span>
                                    <span className="text-sm font-semibold text-slate-700">{req.to}</span>
                                    <span className="text-sm font-bold text-slate-900">{req.days}</span>
                                    <StatusPill status={req.status} />
                                    <div className="justify-self-end">
                                        <a className="text-sm font-semibold text-blue-600" href="#">View</a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

            </div>
        </main>
    );
}
