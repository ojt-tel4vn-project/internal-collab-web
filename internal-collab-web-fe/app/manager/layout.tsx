import type { ReactNode } from "react";
import { BirthdayAnnouncementModal } from "@/components/birthdays/BirthdayAnnouncementModal";
import ManagerNavbar from "@/components/layout/navbar/ManagerNavbar";

export default function ManagerLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <ManagerNavbar />
      <BirthdayAnnouncementModal />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  );
}
