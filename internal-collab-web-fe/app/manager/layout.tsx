import type { ReactNode } from "react";
import { BirthdayAnnouncementModal } from "@/components/birthdays/BirthdayAnnouncementModal";
import { RoleWorkspaceShell } from "@/components/layout/RoleWorkspaceShell";
import { ManagerSideNav } from "@/components/layout/navigation/ManagerSideNav";
import ManagerNavbar from "@/components/layout/navbar/ManagerNavbar";

export default function ManagerLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <ManagerNavbar />
      <BirthdayAnnouncementModal />
      <RoleWorkspaceShell sideNav={<ManagerSideNav />}>
        {children}
      </RoleWorkspaceShell>
    </div>
  );
}
