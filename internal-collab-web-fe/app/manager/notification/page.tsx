import NotificationCenter from "@/components/notification/NotificationCenter";
import { ManagerSideNav } from "@/components/navigation/ManagerSideNav";

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
