"use client";

import { QuotaConfigurationSection } from "@/components/configuration/QuotaConfigurationSection";

export default function ManagerConfigurationPage() {
    return (
        <section className="w-full space-y-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Configuration</h1>
                <p className="text-sm text-slate-500">
                    Manage leave quota configuration for your account context.
                </p>
            </div>

            <QuotaConfigurationSection
                leaveTypesEndpoint="/api/manager/leave-types"
                updateLeaveTypeEndpointBase="/api/manager/leave-types"
                description="Load leave type quota defaults and update total days. Backend permissions may restrict some updates."
            />
        </section>
    );
}
