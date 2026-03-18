"use client";

import { useEffect, useMemo, useState } from "react";
import { ManagerSideNav } from "@/components/layout/navigation/ManagerSideNav";
import { LeaderboardOverview } from "@/components/leaderboard/LeaderboardOverview";
import { LeaderboardResults } from "@/components/leaderboard/LeaderboardResults";
import type { DepartmentOption, LeaderboardEntry, LeaderboardFilters } from "@/types/employee";
import {
    DepartmentsResponse,
    buildLeaderboardSearchParams,
    getErrorMessage,
    getTimeFilterMeta,
    isAbortError,
    LeaderboardResponse,
    normalizeDepartments,
    normalizeLeaderboard,
} from "@/app/employee/leaderboard/data";

const DEFAULT_LEADERBOARD_LIMIT = 10;

type RemoteState<T> = {
    data: T;
    error: string | null;
    loading: boolean;
};

async function readDepartments(signal?: AbortSignal) {
    const response = await fetch("/api/employee?view=departments", {
        cache: "no-store",
        signal,
    });

    if (!response.ok) {
        const raw = await response.text().catch(() => "");
        throw new Error(getErrorMessage(raw, "Department filter is temporarily unavailable."));
    }

    return normalizeDepartments((await response.json()) as DepartmentsResponse);
}

async function readLeaderboard(filters: LeaderboardFilters, signal?: AbortSignal) {
    const params = buildLeaderboardSearchParams(filters);
    const response = await fetch(`/api/employee/stickers/leaderboard?${params.toString()}`, {
        cache: "no-store",
        signal,
    });

    if (!response.ok) {
        const raw = await response.text().catch(() => "");
        throw new Error(getErrorMessage(raw, "Unable to load leaderboard."));
    }

    return normalizeLeaderboard((await response.json()) as LeaderboardResponse);
}

function getLeaderboardError(error: unknown) {
    return error instanceof Error ? error.message : "Unable to load leaderboard.";
}

function getDepartmentError(error: unknown) {
    return error instanceof Error ? error.message : "Department filter is temporarily unavailable.";
}

export default function ManagerLeaderboardPage() {
    const [departmentsState, setDepartmentsState] = useState<{
        data: DepartmentOption[];
        error: string | null;
    }>({
        data: [],
        error: null,
    });
    const [filters, setFilters] = useState<LeaderboardFilters>({
        departmentId: "all",
        limit: DEFAULT_LEADERBOARD_LIMIT,
        timeFilter: "month",
    });
    const [leaderboardState, setLeaderboardState] = useState<RemoteState<LeaderboardEntry[]>>({
        data: [],
        error: null,
        loading: true,
    });

    useEffect(() => {
        let cancelled = false;
        const departmentsController = new AbortController();

        void readDepartments(departmentsController.signal)
            .then((departments) => {
                if (cancelled) return;
                setDepartmentsState({ data: departments, error: null });
                setFilters((current) => {
                    const stillExists = current.departmentId === "all" || departments.some((item) => item.id === current.departmentId);
                    return stillExists ? current : { ...current, departmentId: "all" };
                });
            })
            .catch((error) => {
                if (cancelled || isAbortError(error)) return;
                setDepartmentsState({ data: [], error: getDepartmentError(error) });
                setFilters((current) => (current.departmentId === "all" ? current : { ...current, departmentId: "all" }));
            });

        return () => {
            cancelled = true;
            departmentsController.abort();
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();

        void readLeaderboard(filters, controller.signal)
            .then((entries) => {
                if (cancelled) return;
                setLeaderboardState({ data: entries, error: null, loading: false });
            })
            .catch((error) => {
                if (cancelled || isAbortError(error)) return;
                setLeaderboardState({ data: [], error: getLeaderboardError(error), loading: false });
            });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [filters]);

    const filterMeta = getTimeFilterMeta(filters.timeFilter);
    const rankedEntries = useMemo(
        () =>
            [...leaderboardState.data].sort(
                (left, right) => right.total - left.total || left.fullName.localeCompare(right.fullName),
            ),
        [leaderboardState.data],
    );
    const topThree = rankedEntries.slice(0, 3);
    const selectedDepartment =
        filters.departmentId === "all"
            ? "All Departments"
            : departmentsState.data.find((department) => department.id === filters.departmentId)?.name ?? "Selected Department";

    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:items-start lg:py-8">
                <aside className="w-full lg:sticky lg:top-8 lg:w-[19.5rem] lg:flex-none">
                    <ManagerSideNav />
                </aside>

                <section className="min-w-0 flex-1 space-y-6">
                    <LeaderboardOverview
                        departmentId={filters.departmentId}
                        departments={departmentsState.data}
                        departmentsError={departmentsState.error}
                        filterLabel={filterMeta.label}
                        filterSummary={filterMeta.summary}
                        onDepartmentChange={(departmentId) => {
                            if (filters.departmentId === departmentId) return;
                            setLeaderboardState((current) => ({ ...current, error: null, loading: true }));
                            setFilters((current) => ({ ...current, departmentId }));
                        }}
                        onTimeFilterChange={(timeFilter) => {
                            if (filters.timeFilter === timeFilter) return;
                            setLeaderboardState((current) => ({ ...current, error: null, loading: true }));
                            setFilters((current) => ({ ...current, timeFilter }));
                        }}
                        selectedDepartment={selectedDepartment}
                        selectedTimeFilter={filters.timeFilter}
                        visibleRanks={rankedEntries.length}
                    />
                    <LeaderboardResults
                        currentEmployeeId=""
                        error={leaderboardState.error}
                        loading={leaderboardState.loading}
                        normalizedReceiverId=""
                        normalizedReceiverName=""
                        onReceiverPick={() => {}}
                        rankedEntries={rankedEntries}
                        topThree={topThree}
                    />
                </section>
            </div>
        </main>
    );
}
