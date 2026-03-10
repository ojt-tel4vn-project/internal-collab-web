"use client";

import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from "@/components/dashboard/home/Icons";
import { EmployeeSideNav } from "@/components/layout/navigation/EmployeeSideNav";

const stats = [
    { label: "Present Days", value: "22/31", color: "text-blue-600" },
    { label: "Late Arrivals", value: "3", color: "text-orange-500" },
    { label: "Absences", value: "1", color: "text-red-500" },
    { label: "Confirmed", value: "18", color: "text-green-600" },
];

const entries = [
    {
        date: "Oct 16, 2023",
        day: "Monday",
        checkIn: "08:52",
        checkOut: "18:15",
        total: "09h",
        totalSub: "23m",
        status: { label: "Confirmed", tone: "bg-green-100 text-green-700" },
        actions: { menu: true },
    },
    {
        date: "Oct 15, 2023",
        day: "Sunday",
        checkIn: "09:45",
        checkOut: "18:30",
        total: "08h",
        totalSub: "45m",
        status: { label: "Pending", tone: "bg-amber-100 text-amber-700" },
        actions: { confirm: true, comment: true },
    },
    {
        date: "Oct 14, 2023",
        day: "Saturday",
        checkIn: "09:00",
        checkOut: "18:00",
        total: "09h",
        totalSub: "00m",
        status: { label: "Auto-Confirmed", tone: "bg-slate-100 text-slate-600" },
        actions: { lock: true },
    },
    {
        date: "Oct 13, 2023",
        day: "Friday",
        checkIn: "11:15",
        checkOut: "20:15",
        total: "09h",
        totalSub: "00m",
        status: { label: "Commented", tone: "bg-orange-100 text-orange-700" },
        actions: { viewComment: true },
    },
    {
        date: "Oct 12, 2023",
        day: "Thursday",
        checkIn: "08:55",
        checkOut: "18:05",
        total: "09h",
        totalSub: "10m",
        status: { label: "Confirmed", tone: "bg-green-100 text-green-700" },
        actions: { menu: true },
    },
];

export default function AttendancePage() {
    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8">
                <EmployeeSideNav />

                <section className="flex-1 space-y-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">My Attendance</h1>
                            <p className="text-sm text-slate-500">Detailed log of your work activity and attendance status.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                                <button className="rounded-full p-1 text-slate-400 hover:bg-slate-50" aria-label="Previous month">
                                    <ChevronLeftIcon className="h-4 w-4" />
                                </button>
                                <span>October 2023</span>
                                <button className="rounded-full p-1 text-slate-400 hover:bg-slate-50" aria-label="Next month">
                                    <ChevronRightIcon className="h-4 w-4" />
                                </button>
                            </div>
                            <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700">
                                <DownloadIcon className="h-4 w-4" />
                                Download
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {stats.map((stat) => (
                            <div key={stat.label} className="rounded-3xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{stat.label}</p>
                                <p className={`mt-1 text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
                        <div className="grid grid-cols-[140px_1fr_120px_120px_110px_240px] items-center border-b border-slate-100 px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            <span>Date</span>
                            <span>Day</span>
                            <span className="text-center">Check In</span>
                            <span className="text-center">Check Out</span>
                            <span className="text-center">Total Hours</span>
                            <span className="text-right">Status</span>
                        </div>

                        {entries.map((entry, idx) => (
                            <div
                                key={entry.date}
                                className={`grid grid-cols-[140px_1fr_120px_120px_110px_240px] items-center px-6 py-4 text-sm font-semibold text-slate-800 ${idx !== entries.length - 1 ? "border-b border-slate-100" : ""
                                    }`}
                            >
                                <div className="leading-tight">
                                    <p>{entry.date}</p>
                                </div>
                                <p className="text-slate-600">{entry.day}</p>
                                <p className="text-center text-slate-700">{entry.checkIn}</p>
                                <p className="text-center text-slate-700">{entry.checkOut}</p>
                                <div className="text-center text-slate-900">
                                    <p>{entry.total}</p>
                                    <p className="text-[11px] font-normal text-slate-400">{entry.totalSub}</p>
                                </div>
                                <div className="flex items-center justify-end gap-2 whitespace-nowrap text-[11px]">
                                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${entry.status.tone}`}>
                                        {entry.status.label}
                                    </span>
                                    {entry.actions.confirm ? (
                                        <button className="rounded-md bg-blue-600 px-3 py-1 text-[11px] font-semibold uppercase text-white shadow hover:bg-blue-700">
                                            Confirm
                                        </button>
                                    ) : null}
                                    {entry.actions.comment ? (
                                        <button className="rounded-md bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase text-slate-600 hover:bg-slate-200">
                                            Comment
                                        </button>
                                    ) : null}
                                    {entry.actions.viewComment ? (
                                        <button className="text-[11px] font-semibold uppercase text-blue-600 hover:underline">View Comment</button>
                                    ) : null}
                                    {entry.actions.lock ? <span className="text-slate-300">ðŸ”’</span> : null}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <p>Showing 1 to 5 of 31 entries</p>
                        <div className="flex items-center gap-2">
                            <button className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">â€¹</button>
                            <button className="h-8 w-8 rounded-lg border border-blue-600 bg-blue-600 text-white">1</button>
                            <button className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">2</button>
                            <button className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">3</button>
                            <button className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">â€º</button>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

