"use client";

import EmployeeManagementPage from "@/components/EmployeeManagementPage";
import { HRSideNav } from "@/components/layout/navigation/HRSideNav";

export default function HrEmployeeManagementPage() {
    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-8">
                <HRSideNav />
                <EmployeeManagementPage />
            </div>
        </main>
    );
}
