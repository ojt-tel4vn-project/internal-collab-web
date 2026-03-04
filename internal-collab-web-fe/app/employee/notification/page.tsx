import NotificationCenter from "@/components/notification/NotificationCenter";
import { EmployeeSideNav } from "@/components/navigation/EmployeeSideNav";

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
