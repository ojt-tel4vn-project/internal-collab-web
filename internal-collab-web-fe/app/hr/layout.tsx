import type { ReactNode } from "react";
import HR_Navbar from "@/components/navbar/HR_Navbar";

export default function HrLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <HR_Navbar />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  );
}
