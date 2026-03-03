import type { NotificationItem } from "@/types/notification";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";

const items: NotificationItem[] = [
    {
        id: "adm-1",
        title: "Sarah Chen submitted a new Leave Request",
        description: "Dates: Dec 24–28. Needs approval routing to HR.",
        timeAgo: "just now",
        accent: "bg-blue-500",
        unread: true,
    },
    {
        id: "adm-2",
        title: "System Alert: Backup completed",
        description: "Weekly database backup finished successfully.",
        timeAgo: "2 hours ago",
        accent: "bg-emerald-500",
        unread: true,
    },
    {
        id: "adm-3",
        title: "Recognition",
        description: "A new Team Player badge was sent to Michael Scott.",
        timeAgo: "yesterday",
        accent: "bg-amber-500",
        unread: false,
    },
    {
        id: "adm-4",
        title: "Security Review",
        description: "Quarterly access review starts next week.",
        timeAgo: "2 days ago",
        accent: "bg-rose-500",
        unread: false,
    },
];

export default function AdminNotificationPage() {
    return (
        <main className="min-h-screen bg-[#0b1220] py-8 text-slate-900">
            <div className="mx-auto w-full max-w-5xl rounded-3xl bg-[#f6f8fb] px-6 py-8 shadow-lg">
                <NotificationPanel heading="Notifications" items={items} roleLabel="Admin" />
            </div>
        </main>
    );
}
