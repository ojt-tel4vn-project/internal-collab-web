import type { ReactNode } from "react";
import { BirthdayAnnouncementModal } from "@/components/birthdays/BirthdayAnnouncementModal";
import HRNavbar from "@/components/layout/navbar/HRNavbar";

export default function HrLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <HRNavbar />
      <BirthdayAnnouncementModal />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  );
}
