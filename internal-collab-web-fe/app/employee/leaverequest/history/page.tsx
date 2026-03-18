import Link from "next/link";
import { LeaveHistoryPanel } from "@/components/leave/LeaveHistoryPanel";
import { EmployeeSideNav } from "@/components/layout/navigation/EmployeeSideNav";
import { loadLeaveRequestPageData } from "@/app/employee/leave-request-data";

export default async function LeaveHistoryPage() {
    const { historyItems, loadError } = await loadLeaveRequestPageData();

    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8">
                <EmployeeSideNav />

                <section className="flex-1 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">Leave History</h1>
                            <p className="text-sm text-slate-500">All processed leave requests.</p>
                        </div>
                        <Link href="/employee/leaverequest" prefetch={false} className="text-sm font-semibold text-blue-600">
                            Back to Leave
                        </Link>
                    </div>

                    {loadError ? (
                        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {loadError}
                        </div>
                    ) : null}

                    <LeaveHistoryPanel
                        items={historyItems}
                        maxVisible={Number.POSITIVE_INFINITY}
                        showViewAllLink={false}
                    />
                </section>
            </div>
        </main>
    );
}
