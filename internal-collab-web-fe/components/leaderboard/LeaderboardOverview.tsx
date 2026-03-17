import type { DepartmentOption, TimeFilter } from "@/types/employee";
import { timeFilters } from "@/types/employee";

type LeaderboardOverviewProps = {
    departmentId: string;
    departments: DepartmentOption[];
    departmentsError: string | null;
    filterLabel: string;
    filterSummary: string;
    onDepartmentChange: (departmentId: string) => void;
    onTimeFilterChange: (filter: TimeFilter) => void;
    selectedDepartment: string;
    selectedTimeFilter: TimeFilter;
    visibleRanks: number;
};

export function LeaderboardOverview({
    departmentId,
    departments,
    departmentsError,
    filterLabel,
    filterSummary,
    onDepartmentChange,
    onTimeFilterChange,
    selectedDepartment,
    selectedTimeFilter,
    visibleRanks,
}: LeaderboardOverviewProps) {
    return (
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_45%,#eff6ff_100%)] px-6 py-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Sticker Leaderboard</p>
                        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Top sticker receivers</h1>
                        <p className="mt-3 text-sm leading-6 text-slate-600">{filterSummary}</p>
                    </div>
                    <div className="grid gap-3 rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-sm sm:min-w-[17rem]">
                        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            <span>Period</span>
                            <span>Department</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-900">
                            <span>{filterLabel}</span>
                            <span className="text-right text-slate-600">{selectedDepartment}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            <span>Visible ranks</span>
                            <span>{visibleRanks}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap gap-2">
                        {timeFilters.map((filter) => (
                            <button
                                key={filter.id}
                                type="button"
                                onClick={() => onTimeFilterChange(filter.id)}
                                className={`rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition ${
                                    selectedTimeFilter === filter.id
                                        ? "bg-slate-950 text-white"
                                        : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <label htmlFor="leaderboard-department-filter" className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Department
                        </label>
                        <select
                            id="leaderboard-department-filter"
                            value={departmentId}
                            onChange={(event) => onDepartmentChange(event.target.value)}
                            disabled={departments.length === 0}
                            className="h-11 min-w-[14rem] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        >
                            <option value="all">All Departments</option>
                            {departments.map((department) => (
                                <option key={department.id} value={department.id}>
                                    {department.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {departmentsError ? <p className="mt-3 text-xs font-semibold text-amber-700">{departmentsError}</p> : null}
            </div>
        </section>
    );
}
