import { ManagerSideNav } from "@/components/navigation/ManagerSideNav";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import type { NotificationItem } from "@/types/notification";

const items: NotificationItem[] = [
  {
    id: "mgr-1",
    title: "Team leave request",
    description: "Sarah Chen requested Dec 24–28. Review needed.",
    timeAgo: "10 minutes ago",
    accent: "bg-blue-500",
    unread: true,
  },
  {
    id: "mgr-2",
    title: "Kudos shared",
    description: "Team Player badge sent to Michael Scott.",
    timeAgo: "45 minutes ago",
    accent: "bg-amber-500",
    unread: true,
  },
  {
    id: "mgr-3",
    title: "Attendance alert",
    description: "Late clock-in flagged for Alex Johnson.",
    timeAgo: "2 hours ago",
    accent: "bg-rose-500",
    unread: false,
  },
  {
    id: "mgr-4",
    title: "Document uploaded",
    description: "New policy doc ready for managers.",
    timeAgo: "yesterday",
    accent: "bg-emerald-500",
    unread: false,
  },
];

export default function ManagerNotificationPage() {
  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8">
        <ManagerSideNav />
        <section className="flex-1">
          <NotificationPanel heading="Notifications" items={items} roleLabel="Manager" />
        </section>
      </div>
    </main>
  );
}
