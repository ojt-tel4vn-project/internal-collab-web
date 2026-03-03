import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { EmployeeSideNav } from "@/components/navigation/EmployeeSideNav";
import type { NotificationItem } from "@/types/notification";

const items: NotificationItem[] = [
    {
        id: "emp-1",
        title: "Leave request submitted",
        description: "Your PTO request for Dec 24–28 was sent to your manager.",
        timeAgo: "just now",
        accent: "bg-blue-500",
        unread: true,
    },
    {
        id: "emp-2",
        title: "Attendance note added",
        description: "You added a comment: Forgot to clock out yesterday.",
        timeAgo: "15 minutes ago",
        accent: "bg-slate-400",
        unread: true,
    },
    {
        id: "emp-3",
        title: "Recognition received",
        description: "You received a Team Player badge from your teammate.",
        timeAgo: "yesterday",
        accent: "bg-amber-500",
        unread: false,
    },
    {
        id: "emp-4",
        title: "New document uploaded",
        description: "Payroll uploaded a new policy for review.",
        timeAgo: "2 days ago",
        accent: "bg-emerald-500",
        unread: false,
    },
];

export default function EmployeeNotificationPage() {
    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8">
                <EmployeeSideNav />
                <section className="flex-1">
                    <NotificationPanel heading="Notifications" items={items} roleLabel="Employee" />
                </section>
            </div>
        </main>
    );
}
