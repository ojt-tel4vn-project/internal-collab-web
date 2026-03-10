import { AlertTriangleIcon } from "@/components/dashboard/home/Icons";
import { LeaveHistoryPanel } from "@/components/leave/LeaveHistoryPanel";
import { PendingLeaveRequests } from "@/components/leave/PendingLeaveRequests";
import { LeaveRequestForm } from "@/components/leave/LeaveRequestForm";
import { EmployeeSideNav } from "@/components/layout/navigation/EmployeeSideNav";
import { loadLeaveRequestPageData } from "@/app/employee/leaverequest/_lib/leave-request-data";

export default async function LeaveRequestPage() {
    const {
        summary,
        summaryYear,
        quotaCount,
        hasQuotaData,
        pendingRequests,
        historyItems,
        shouldShowQuotaAlert,
        remainingByPolicy,
        loadError,
    } = await loadLeaveRequestPageData();

    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8">
                <EmployeeSideNav />

                <section className="flex-1 space-y-6">
                    {loadError && (
                        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {loadError}
                        </div>
                    )}

                    <div className="flex items-start gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">New Leave Request</h1>
                            <p className="text-sm text-slate-500">Manage your time off and view real-time balances.</p>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                                <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                                    <span>Leave Balance</span>
                                    <span className="text-blue-600">
                                        {summary.used} / {summary.total} Days
                                    </span>
                                </div>
                                <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
                                    <div className="h-2 rounded-full bg-blue-500" style={{ width: `${summary.progress}%` }} />
                                </div>
                                <p className="mt-2 text-xs text-slate-500">
                                    {summary.total > 0
                                        ? `${Math.round(summary.progress)}% of your leave quota used for ${summaryYear}.`
                                        : "Leave quota data is not available."}
                                </p>
                            </div>

                            <PendingLeaveRequests items={pendingRequests} />

                            {shouldShowQuotaAlert && (
                                <div className="rounded-2xl border border-orange-100 bg-orange-50 px-5 py-4 shadow-sm">
                                    <div className="flex items-start gap-3 text-orange-700">
                                        <span className="mt-0.5 text-orange-500">
                                            <AlertTriangleIcon className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold">Leave Balance Alert</p>
                                            <p className="text-xs text-orange-700">
                                                Remaining leave days are low ({Math.max(remainingByPolicy, 0)} day(s) left by policy).
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm space-y-4">
                                <LeaveRequestForm />
                            </div>
                        </div>

                        <aside className="space-y-4">
                            <LeaveHistoryPanel items={historyItems} />

                            <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-slate-900">Leave Summary</p>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                                        Year {summaryYear}
                                    </span>
                                </div>

                                {!hasQuotaData ? (
                                    <p className="mt-4 text-sm text-slate-500">No leave quota available for this year.</p>
                                ) : (
                                    <div className="mt-4 space-y-3">
                                        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                                            <span className="text-xs font-semibold uppercase text-slate-500">Quota Records</span>
                                            <span className="text-lg font-bold text-slate-900">{quotaCount}</span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                                            <span className="text-xs font-semibold uppercase text-slate-500">Total Days</span>
                                            <span className="text-lg font-bold text-slate-900">{summary.total}</span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                                            <span className="text-xs font-semibold uppercase text-slate-500">Used</span>
                                            <span className="text-lg font-bold text-orange-500">{summary.used}</span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                                            <span className="text-xs font-semibold uppercase text-slate-500">Remaining</span>
                                            <span className="text-lg font-bold text-blue-600">{summary.remaining}</span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                                            <span className="text-xs font-semibold uppercase text-slate-500">Over Quota</span>
                                            <span className="text-lg font-bold text-slate-500">{summary.over}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </aside>
                    </div>
                </section>
            </div>
        </main>
    );
}
