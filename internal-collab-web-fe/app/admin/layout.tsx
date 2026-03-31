import type { ReactNode } from "react";
import { BirthdayAnnouncementModal } from "@/components/birthdays/BirthdayAnnouncementModal";
import { RoleWorkspaceShell } from "@/components/layout/RoleWorkspaceShell";
import { AdminSideNav } from "@/components/layout/navigation/AdminSideNav";
import AdminNavbar from "@/components/layout/navbar/AdminNavbar";

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <AdminNavbar />
      <BirthdayAnnouncementModal />
      <RoleWorkspaceShell sideNav={<AdminSideNav />}>
        {children}
      </RoleWorkspaceShell>
    </div>
  );
}
