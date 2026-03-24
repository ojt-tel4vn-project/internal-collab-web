import type { ReactNode } from "react";
import { BirthdayAnnouncementModal } from "@/components/birthdays/BirthdayAnnouncementModal";
import { RoleWorkspaceShell } from "@/components/layout/RoleWorkspaceShell";
import { HRSideNav } from "@/components/layout/navigation/HRSideNav";
import HRNavbar from "@/components/layout/navbar/HRNavbar";

export default function HrLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <HRNavbar />
      <BirthdayAnnouncementModal />
      <RoleWorkspaceShell sideNav={<HRSideNav />}>
        {children}
      </RoleWorkspaceShell>
    </div>
  );
}
