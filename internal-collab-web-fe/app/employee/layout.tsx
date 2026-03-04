import type { ReactNode } from "react";
import Employee_Navbar from "@/components/navbar/Employee_Navbar";

export default function EmployeeLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <Employee_Navbar />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  );
}
