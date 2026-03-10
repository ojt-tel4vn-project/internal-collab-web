import NotificationCenter from "@/components/notifications/NotificationCenter";
import { EmployeeSideNav } from "@/components/layout/navigation/EmployeeSideNav";

export default function EmployeeNotificationPage() {
  return (
    <NotificationCenter
      sideNav={<EmployeeSideNav />}
      maxWidthClassName="max-w-7xl"
      roleLabel="Employee"
      tone="blue"
    />
  );
}
