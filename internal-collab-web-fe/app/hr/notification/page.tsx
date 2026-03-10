import NotificationCenter from "@/components/notifications/NotificationCenter";
import { HRSideNav } from "@/components/layout/navigation/HRSideNav";

export default function HrNotificationPage() {
  return (
    <NotificationCenter
      sideNav={<HRSideNav />}
      maxWidthClassName="max-w-7xl"
      roleLabel="HR"
      tone="emerald"
    />
  );
}
