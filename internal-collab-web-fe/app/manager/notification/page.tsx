import NotificationCenter from "@/components/notifications/NotificationCenter";
import { ManagerSideNav } from "@/components/layout/navigation/ManagerSideNav";

export default function ManagerNotificationPage() {
  return (
    <NotificationCenter
      sideNav={<ManagerSideNav />}
      maxWidthClassName="max-w-7xl"
      roleLabel="Manager"
      tone="violet"
    />
  );
}
