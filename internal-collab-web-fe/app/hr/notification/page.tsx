import NotificationCenter from "@/components/notification/NotificationCenter";
import { HRSideNav } from "@/components/navigation/HRSideNav";

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
