import type { ReactNode } from "react";
import Manager_Navbar from "@/components/navbar/Manager_Navbar";

export default function ManagerLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <Manager_Navbar />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  );
}
