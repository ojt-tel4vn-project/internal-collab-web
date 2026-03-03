import type { ReactNode } from "react";
import Admin_Navbar from "@/components/Admin_Navbar";

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <Admin_Navbar />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  );
}
