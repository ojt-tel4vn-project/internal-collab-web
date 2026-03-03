import { HRSideNav } from "@/components/navigation/HRSideNav";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import type { NotificationItem } from "@/types/notification";

const items: NotificationItem[] = [
    {
        id: "hr-1",
        title: "New leave request submitted",
        description: "Emily Blunt requested PTO for Dec 12–14.",
        timeAgo: "5 minutes ago",
        accent: "bg-blue-500",
        unread: true,
    },
    {
        id: "hr-2",
        title: "Attendance comment added",
        description: "Nguyen Van A: Forgot to clock out on Mon.",
        timeAgo: "18 minutes ago",
        accent: "bg-slate-400",
        unread: true,
    },
    {
        id: "hr-3",
        title: "Policy update uploaded",
        description: "New remote-work guidelines ready for review.",
        timeAgo: "2 hours ago",
        accent: "bg-emerald-500",
        unread: false,
    },
    {
        id: "hr-4",
        title: "System alert",
        description: "Weekly database backup completed.",
        timeAgo: "yesterday",
        accent: "bg-amber-500",
        unread: false,
    },
];

export default function HrNotificationPage() {
    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8">
                <HRSideNav />
                <section className="flex-1">
                    <NotificationPanel heading="Notifications" items={items} roleLabel="HR" />
                </section>
            </div>
        </main>
    );
}
