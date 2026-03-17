import type { ReactNode } from "react";
import { BirthdayAnnouncementModal } from "@/components/birthdays/BirthdayAnnouncementModal";
import AdminNavbar from "@/components/layout/navbar/AdminNavbar";

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <AdminNavbar />
      <BirthdayAnnouncementModal />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  );
}
