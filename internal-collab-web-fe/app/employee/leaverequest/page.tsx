import { DashboardNavbar } from "@/components/dashboard/Navbar";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { AlertTriangleIcon, CalendarIcon, ChevronDownIcon } from "@/components/dashboard/Icons";
import { navItems as baseNavItems } from "../_data";

const historyTabs = ["All", "Approved", "Pending"] as const;

const history = [
    {
        title: "Annual Leave",
        range: "Oct 12 - Oct 15, 2023",
        duration: "4.0d",
        status: { label: "Approved", tone: "text-green-600" },
    },
    {
        title: "Sick Leave",
        range: "Nov 02 - Nov 03, 2023",
        duration: "2.0d",
        status: { label: "Pending", tone: "text-orange-500" },
    },
    {
        title: "Annual Leave",
        range: "Aug 20 - Aug 25, 2023",
        duration: "5.0d",
        status: { label: "Rejected", tone: "text-red-500" },
    },
];

const summary = {
    used: 14,
    remaining: 6,
    over: 0,
};

export default function LeaveRequestPage() {
    const navItems = baseNavItems.map((item) => ({ ...item, active: item.label === "Leave" }));

    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <DashboardNavbar user={{ initials: "AJ", name: "Alex Johnson", role: "Product Designer" }} notificationCount={1} />

            <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8">
                <SidebarNav items={navItems} />

                <section className="flex-1 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">New Leave Request</h1>
                            <p className="text-sm text-slate-500">Manage your time off and view real-time balances.</p>
                        </div>
                        <button className="h-10 w-10 rounded-full border border-slate-200 text-slate-400 shadow-sm">🔔</button>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                                <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                                    <span>Annual Leave Balance</span>
                                    <span className="text-blue-600">14 / 20 Days</span>
                                </div>
                                <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
                                    <div className="h-2 w-3/4 rounded-full bg-blue-500" />
                                </div>
                                <p className="mt-2 text-xs text-slate-500">70% of your annual leave has been utilized for this fiscal year.</p>
                            </div>

                            <div className="rounded-2xl border border-orange-100 bg-orange-50 px-5 py-4 shadow-sm">
                                <div className="flex items-start gap-3 text-orange-700">
                                    <span className="mt-0.5 text-orange-500"><AlertTriangleIcon className="h-5 w-5" /></span>
                                    <div>
                                        <p className="text-sm font-semibold">Over-quota Alert</p>
                                        <p className="text-xs text-orange-700">
                                            You are approaching your maximum leave limit for this quarter. Please consult the HR policy for extended leaves.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Leave Type</label>
                                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 shadow-sm">
                                        <span>Annual Leave</span>
                                        <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">From Date</label>
                                        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-500 shadow-sm">
                                            <span>YYYY-MM-DD</span>
                                            <CalendarIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">To Date</label>
                                        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-500 shadow-sm">
                                            <span>YYYY-MM-DD</span>
                                            <CalendarIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Estimated Total Days</label>
                                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 shadow-sm">
                                        <span>Estimated Total Days</span>
                                        <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">0.0 Days</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Reason for Absence</label>
                                    <textarea
                                        className="min-h-[120px] w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                                        placeholder="Briefly explain your leave request..."
                                    />
                                </div>

                                <div className="pt-2">
                                    <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700">
                                        <span>▶</span>
                                        <span>Submit Leave Request</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <aside className="space-y-4">
                            <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
                                <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-900">
                                    <span>Leave History</span>
                                    <button className="text-xs font-semibold text-blue-600">View All</button>
                                </div>
                                <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
                                    {historyTabs.map((tab, idx) => (
                                        <button
                                            key={tab}
                                            className={`rounded-full px-3 py-1 ${idx === 0 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                                <div className="space-y-4 text-sm">
                                    {history.map((item, idx) => (
                                        <div key={idx} className={idx !== history.length - 1 ? "border-b border-slate-100 pb-4" : ""}>
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-semibold text-slate-900">{item.title}</p>
                                                    <p className="text-[11px] text-slate-500">{item.range}</p>
                                                </div>
                                                <div className="text-right text-[11px] font-semibold uppercase text-slate-500">
                                                    <p className="text-slate-800">{item.duration}</p>
                                                    <p className={item.status.tone}>{item.status.label}</p>
                                                </div>
                                            </div>
                                            {idx === history.length - 1 ? (
                                                <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-[11px] text-rose-600">
                                                    "Insufficient leave balance for this period after recent updates. Please contact payroll for adjustment."
                                                </p>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
                                <p className="text-sm font-semibold text-slate-900">Leave Summary</p>
                                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                                    <div>
                                        <p className="text-2xl font-extrabold text-orange-500">{summary.used}</p>
                                        <p className="text-[11px] font-semibold uppercase text-slate-500">Used</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-extrabold text-blue-600">{summary.remaining}</p>
                                        <p className="text-[11px] font-semibold uppercase text-slate-500">Remaining</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-extrabold text-slate-300">{summary.over.toString().padStart(2, "0")}</p>
                                        <p className="text-[11px] font-semibold uppercase text-slate-500">Over Quota</p>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </section>
            </div>
        </main>
    );
}
