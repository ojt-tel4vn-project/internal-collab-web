import type { ReactNode } from "react";
import { BirthdayAnnouncementModal } from "@/components/birthdays/BirthdayAnnouncementModal";
import EmployeeNavbar from "@/components/layout/navbar/EmployeeNavbar";

export default function EmployeeLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <EmployeeNavbar />
      <BirthdayAnnouncementModal />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  );
}
