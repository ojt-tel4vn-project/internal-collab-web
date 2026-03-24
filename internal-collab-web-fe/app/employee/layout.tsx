import type { ReactNode } from "react";
import { BirthdayAnnouncementModal } from "@/components/birthdays/BirthdayAnnouncementModal";
import { RoleWorkspaceShell } from "@/components/layout/RoleWorkspaceShell";
import { EmployeeSideNav } from "@/components/layout/navigation/EmployeeSideNav";
import EmployeeNavbar from "@/components/layout/navbar/EmployeeNavbar";

export default function EmployeeLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <EmployeeNavbar />
      <BirthdayAnnouncementModal />
      <RoleWorkspaceShell sideNav={<EmployeeSideNav />}>
        {children}
      </RoleWorkspaceShell>
    </div>
  );
}
