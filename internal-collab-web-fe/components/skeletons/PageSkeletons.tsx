type SkeletonBlockProps = {
    className?: string;
};

function SkeletonBlock({ className = "" }: SkeletonBlockProps) {
    return <div className={`animate-pulse rounded-2xl bg-slate-200/80 ${className}`} />;
}

function PortalHeaderSkeleton({ action = false }: { action?: boolean }) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
                <SkeletonBlock className="h-8 w-56" />
                <SkeletonBlock className="h-4 w-80 max-w-full" />
            </div>
            {action ? <SkeletonBlock className="h-11 w-40" /> : null}
        </div>
    );
}

function StatsGridSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className={`grid gap-4 ${count >= 4 ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2 xl:grid-cols-3"}`}>
            {Array.from({ length: count }, (_, index) => (
                <div key={index} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <SkeletonBlock className="h-3 w-28" />
                    <SkeletonBlock className="mt-4 h-9 w-24" />
                </div>
            ))}
        </div>
    );
}

function TableRowsSkeleton({ rows = 6 }: { rows?: number }) {
    return (
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
                <SkeletonBlock className="h-5 w-56" />
            </div>
            <div className="space-y-0">
                {Array.from({ length: rows }, (_, index) => (
                    <div key={index} className={`grid gap-3 px-5 py-4 md:grid-cols-4 ${index !== rows - 1 ? "border-b border-slate-100" : ""}`}>
                        <SkeletonBlock className="h-4 w-28" />
                        <SkeletonBlock className="h-4 w-32" />
                        <SkeletonBlock className="h-4 w-24" />
                        <SkeletonBlock className="h-4 w-20 md:justify-self-end" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function PortalDashboardSkeleton() {
    return (
        <section className="space-y-6">
            <PortalHeaderSkeleton />
            <StatsGridSkeleton count={3} />

            <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <SkeletonBlock className="h-5 w-28" />
                        <SkeletonBlock className="h-8 w-32 rounded-full" />
                    </div>
                    <SkeletonBlock className="h-[320px] w-full" />
                </div>

                <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <SkeletonBlock className="h-5 w-32" />
                        <div className="mt-4 space-y-3">
                            {Array.from({ length: 4 }, (_, index) => (
                                <SkeletonBlock key={index} className="h-14 w-full" />
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <SkeletonBlock className="h-5 w-36" />
                        <div className="mt-4 space-y-3">
                            {Array.from({ length: 3 }, (_, index) => (
                                <SkeletonBlock key={index} className="h-16 w-full" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export function PortalAttendanceSkeleton() {
    return (
        <section className="space-y-6">
            <PortalHeaderSkeleton action />
            <StatsGridSkeleton />

            <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <SkeletonBlock className="h-5 w-40" />
                    <SkeletonBlock className="h-9 w-36 rounded-full" />
                </div>
                <div className="space-y-0">
                    {Array.from({ length: 7 }, (_, index) => (
                        <div key={index} className={`grid gap-3 px-6 py-4 md:grid-cols-[140px_1fr_160px_200px] ${index !== 6 ? "border-b border-slate-100" : ""}`}>
                            <SkeletonBlock className="h-4 w-24" />
                            <SkeletonBlock className="h-4 w-28" />
                            <SkeletonBlock className="h-7 w-24 rounded-full" />
                            <SkeletonBlock className="h-8 w-28 md:justify-self-end" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function PortalDocumentsSkeleton() {
    return (
        <section className="space-y-6">
            <PortalHeaderSkeleton />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => (
                    <div key={index} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <SkeletonBlock className="h-5 w-32" />
                        <SkeletonBlock className="mt-3 h-4 w-full" />
                        <SkeletonBlock className="mt-2 h-4 w-3/4" />
                        <div className="mt-5 flex items-center gap-2">
                            <SkeletonBlock className="h-8 w-20" />
                            <SkeletonBlock className="h-8 w-24" />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export function PortalLeaveRequestSkeleton() {
    return (
        <section className="space-y-6">
            <PortalHeaderSkeleton />

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                        <SkeletonBlock className="h-4 w-36" />
                        <SkeletonBlock className="mt-4 h-2 w-full rounded-full" />
                        <SkeletonBlock className="mt-3 h-4 w-64" />
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                        <SkeletonBlock className="h-5 w-40" />
                        <div className="mt-4 space-y-3">
                            <SkeletonBlock className="h-16 w-full" />
                            <SkeletonBlock className="h-16 w-full" />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
                        <SkeletonBlock className="h-5 w-44" />
                        <div className="mt-4 space-y-3">
                            <SkeletonBlock className="h-11 w-full" />
                            <SkeletonBlock className="h-11 w-full" />
                            <SkeletonBlock className="h-24 w-full" />
                            <SkeletonBlock className="h-11 w-full" />
                        </div>
                    </div>
                </div>

                <aside className="space-y-4">
                    <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
                        <SkeletonBlock className="h-5 w-32" />
                        <div className="mt-4 space-y-3">
                            <SkeletonBlock className="h-10 w-full" />
                            <SkeletonBlock className="h-10 w-full" />
                            <SkeletonBlock className="h-10 w-full" />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
                        <SkeletonBlock className="h-5 w-36" />
                        <div className="mt-4 space-y-3">
                            <SkeletonBlock className="h-8 w-full" />
                            <SkeletonBlock className="h-8 w-full" />
                            <SkeletonBlock className="h-8 w-full" />
                        </div>
                    </div>
                </aside>
            </div>
        </section>
    );
}

export function PortalLeaveHistorySkeleton() {
    return (
        <section className="space-y-6">
            <PortalHeaderSkeleton />
            <TableRowsSkeleton rows={8} />
        </section>
    );
}

export function PortalEmployeeManagementSkeleton() {
    return (
        <section className="space-y-6">
            <PortalHeaderSkeleton action />
            <StatsGridSkeleton />
            <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row">
                    <SkeletonBlock className="h-11 flex-1" />
                    <SkeletonBlock className="h-11 w-44" />
                    <SkeletonBlock className="h-11 w-44" />
                </div>
                <div className="space-y-0">
                    {Array.from({ length: 7 }, (_, index) => (
                        <div key={index} className={`grid gap-3 px-5 py-4 md:grid-cols-5 ${index !== 6 ? "border-b border-slate-100" : ""}`}>
                            <SkeletonBlock className="h-4 w-28" />
                            <SkeletonBlock className="h-4 w-36" />
                            <SkeletonBlock className="h-4 w-32" />
                            <SkeletonBlock className="h-7 w-24 rounded-full" />
                            <SkeletonBlock className="h-8 w-24 md:justify-self-end" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function PortalLeaderboardSkeleton() {
    return (
        <section className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <SkeletonBlock className="h-6 w-48" />
                <SkeletonBlock className="mt-3 h-4 w-full max-w-2xl" />
                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                    <SkeletonBlock className="h-24 w-full" />
                    <SkeletonBlock className="h-24 w-full" />
                    <SkeletonBlock className="h-24 w-full" />
                </div>
            </div>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <SkeletonBlock className="h-6 w-40" />
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        {Array.from({ length: 3 }, (_, index) => (
                            <SkeletonBlock key={index} className="h-48 w-full" />
                        ))}
                    </div>
                    <div className="mt-6 space-y-3">
                        {Array.from({ length: 6 }, (_, index) => (
                            <SkeletonBlock key={index} className="h-14 w-full" />
                        ))}
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <SkeletonBlock className="h-5 w-32" />
                        <div className="mt-4 space-y-3">
                            <SkeletonBlock className="h-11 w-full" />
                            <SkeletonBlock className="h-11 w-full" />
                            <SkeletonBlock className="h-11 w-full" />
                        </div>
                    </div>
                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <SkeletonBlock className="h-5 w-28" />
                        <div className="mt-4 space-y-3">
                            <SkeletonBlock className="h-16 w-full" />
                            <SkeletonBlock className="h-16 w-full" />
                            <SkeletonBlock className="h-16 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export function PortalHrLeaderboardSkeleton() {
    return (
        <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)] xl:items-start">
            <aside className="space-y-6">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <SkeletonBlock className="h-6 w-36" />
                    <div className="mt-5 space-y-3">
                        <SkeletonBlock className="h-11 w-full" />
                        <SkeletonBlock className="h-11 w-full" />
                        <SkeletonBlock className="h-11 w-full" />
                        <SkeletonBlock className="h-24 w-full" />
                        <SkeletonBlock className="h-11 w-full" />
                    </div>
                </div>
            </aside>
            <PortalLeaderboardSkeleton />
        </div>
    );
}

export function PortalLeaveApprovalsSkeleton() {
    return (
        <section className="space-y-6">
            <PortalHeaderSkeleton />
            <StatsGridSkeleton count={3} />
            <div className="grid gap-4">
                {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2">
                                <SkeletonBlock className="h-5 w-48" />
                                <SkeletonBlock className="h-4 w-32" />
                            </div>
                            <SkeletonBlock className="h-8 w-24 rounded-full" />
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <SkeletonBlock className="h-4 w-32" />
                            <SkeletonBlock className="h-4 w-28" />
                            <SkeletonBlock className="h-4 w-36" />
                        </div>
                        <div className="mt-5 flex gap-3">
                            <SkeletonBlock className="h-10 w-28" />
                            <SkeletonBlock className="h-10 w-28" />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export function PortalLeaveOverviewSkeleton() {
    return (
        <section className="space-y-6">
            <PortalHeaderSkeleton />
            <StatsGridSkeleton count={4} />
            <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row">
                    <SkeletonBlock className="h-11 flex-1" />
                    <SkeletonBlock className="h-11 w-44" />
                    <SkeletonBlock className="h-11 w-44" />
                </div>
                <div className="space-y-0">
                    {Array.from({ length: 7 }, (_, index) => (
                        <div key={index} className={`grid gap-3 px-5 py-4 md:grid-cols-6 ${index !== 6 ? "border-b border-slate-100" : ""}`}>
                            <SkeletonBlock className="h-4 w-28" />
                            <SkeletonBlock className="h-4 w-24" />
                            <SkeletonBlock className="h-4 w-28" />
                            <SkeletonBlock className="h-4 w-32" />
                            <SkeletonBlock className="h-7 w-24 rounded-full" />
                            <SkeletonBlock className="h-4 w-20" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function PortalTeamSkeleton() {
    return (
        <section className="space-y-6">
            <PortalHeaderSkeleton />
            <StatsGridSkeleton count={3} />
            <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                    <SkeletonBlock className="h-5 w-40" />
                </div>
                <div className="space-y-0">
                    {Array.from({ length: 6 }, (_, index) => (
                        <div key={index} className={`grid gap-3 px-5 py-4 md:grid-cols-4 ${index !== 5 ? "border-b border-slate-100" : ""}`}>
                            <SkeletonBlock className="h-10 w-10 rounded-full" />
                            <SkeletonBlock className="h-4 w-36" />
                            <SkeletonBlock className="h-4 w-32" />
                            <SkeletonBlock className="h-8 w-24 md:justify-self-end" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
