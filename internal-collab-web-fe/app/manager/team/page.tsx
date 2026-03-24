"use client";

import { useEffect, useMemo, useState } from "react";
import {
    CalendarIcon,
    CheckCircleIcon,
    UserXIcon,
    UsersIcon,
} from "@/components/dashboard/home/Icons";
import type { DepartmentOption } from "@/types/employee";
import {
    type DepartmentsResponse,
    getErrorMessage,
    normalizeDepartments,
} from "@/app/employee/leaderboard/data";

type Subordinate = {
    avatar_url: string;
    department: string;
    email: string;
    employee_code: string;
    full_name: string;
    id: string;
    position: string;
    status: string;
};

type TeamManager = {
    full_name: string;
    id: string;
    position: string;
};

type TeamData = {
    manager?: TeamManager;
    subordinates: Subordinate[];
    total: number;
};

type StatCard = {
    icon: typeof UsersIcon;
    iconClassName: string;
    label: string;
    value: number;
};

const STATUS_LABEL: Record<string, string> = {
    active: "Active",
    inactive: "Inactive",
    pending: "Pending",
};

const STATUS_STYLE: Record<string, string> = {
    Active: "bg-emerald-50 text-emerald-600",
    Pending: "bg-amber-50 text-amber-600",
    Inactive: "bg-slate-100 text-slate-500",
};

const PAGE_SIZE = 5;
const EMPTY_SUBORDINATES: Subordinate[] = [];
const STATUS_FILTER_OPTIONS = [
    { value: "all", label: "All statuses" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
] as const;

function normalizeValue(value: string) {
    return value.trim().toLowerCase();
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
    const label = STATUS_LABEL[status] ?? status;
    return (
        <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[label] ?? "bg-slate-100 text-slate-500"}`}
        >
            {label}
        </span>
    );
}

function AvatarBadge({
    avatarUrl,
    fullName,
    sizeClassName,
    textClassName,
}: {
    avatarUrl: string;
    fullName: string;
    sizeClassName: string;
    textClassName: string;
}) {
    return (
        <span
            className={`flex items-center justify-center rounded-full bg-slate-200 bg-cover bg-center font-bold text-slate-700 ${sizeClassName} ${textClassName}`}
            style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
        >
            {avatarUrl ? "" : getInitials(fullName)}
        </span>
    );
}

export default function ManagerTeamPage() {
    const [teamData, setTeamData] = useState<TeamData | null>(null);
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTER_OPTIONS)[number]["value"]>("all");
    const [departmentError, setDepartmentError] = useState<string | null>(null);
    const [onLeaveCount, setOnLeaveCount] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [selectedEmployee, setSelectedEmployee] = useState<Subordinate | null>(null);

    useEffect(() => {
        async function fetchData() {
            const [teamRes, overviewRes, departmentsRes] = await Promise.all([
                fetch("/api/manager/team"),
                fetch("/api/manager/leave-overview"),
                fetch("/api/employee?view=departments", { cache: "no-store" }),
            ]);

            if (teamRes.ok) {
                const json = (await teamRes.json()) as TeamData;
                setTeamData(json);
            }

            if (overviewRes.ok) {
                const json = (await overviewRes.json()) as { data: { employees_on_leave_today: number } };
                setOnLeaveCount(json.data.employees_on_leave_today);
            }

            if (departmentsRes.ok) {
                const json = (await departmentsRes.json()) as DepartmentsResponse;
                setDepartments(normalizeDepartments(json));
                setDepartmentError(null);
            } else {
                const raw = await departmentsRes.text().catch(() => "");
                setDepartments([]);
                setDepartmentError(getErrorMessage(raw, "Department filter is temporarily unavailable."));
                setDepartmentFilter("all");
            }
        }

        void fetchData();
    }, []);

    const manager = teamData?.manager ?? null;
    const subordinates = teamData?.subordinates ?? EMPTY_SUBORDINATES;
    const total = teamData?.total ?? 0;
    const activeCount = subordinates.filter((member) => member.status === "active").length;
    const inactiveCount = subordinates.filter((member) => member.status === "inactive").length;

    const selectedDepartmentName = useMemo(() => {
        if (departmentFilter === "all") return null;
        return departments.find((department) => department.id === departmentFilter)?.name ?? null;
    }, [departmentFilter, departments]);

    const filteredSubordinates = useMemo(() => {
        const normalizedSearch = normalizeValue(search);
        return subordinates.filter((member) => {
            const matchesDepartment =
                !selectedDepartmentName ||
                normalizeValue(member.department) === normalizeValue(selectedDepartmentName);
            const matchesStatus = statusFilter === "all" || normalizeValue(member.status) === statusFilter;
            const matchesSearch =
                normalizedSearch.length === 0 || normalizeValue(member.full_name).includes(normalizedSearch);
            return matchesDepartment && matchesStatus && matchesSearch;
        });
    }, [search, selectedDepartmentName, statusFilter, subordinates]);

    const totalPages = Math.max(1, Math.ceil(filteredSubordinates.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paginated = filteredSubordinates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const startIdx = filteredSubordinates.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const endIdx = Math.min(currentPage * PAGE_SIZE, filteredSubordinates.length);

    const stats: StatCard[] = [
        {
            label: "Total Members",
            value: total,
            icon: UsersIcon,
            iconClassName: "bg-sky-50 text-sky-600",
        },
        {
            label: "Active Today",
            value: activeCount,
            icon: CheckCircleIcon,
            iconClassName: "bg-emerald-50 text-emerald-600",
        },
        {
            label: "On Leave",
            value: onLeaveCount,
            icon: CalendarIcon,
            iconClassName: "bg-amber-50 text-amber-600",
        },
        {
            label: "Inactive",
            value: inactiveCount,
            icon: UserXIcon,
            iconClassName: "bg-slate-100 text-slate-500",
        },
    ];

    return (
        <section className="flex-1 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Team Directory</h1>
                    <p className="text-sm text-slate-500">
                        Showing {total} member{total !== 1 ? "s" : ""} in your workspace
                    </p>
                    {manager ? (
                        <p className="mt-1 text-xs font-medium text-slate-400">
                            Reporting to {manager.full_name}
                            {manager.position ? ` - ${manager.position}` : ""}
                        </p>
                    ) : null}
                </div>

                <div className="flex flex-wrap items-end gap-3 text-sm font-semibold">
                    <div className="space-y-1">
                        <label
                            htmlFor="manager-team-search"
                            className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400"
                        >
                            Search Name
                        </label>
                        <input
                            id="manager-team-search"
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                            placeholder="Search by employee name"
                            className="h-11 min-w-[16rem] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div className="space-y-1">
                        <label
                            htmlFor="manager-team-department-filter"
                            className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400"
                        >
                            Department
                        </label>
                        <select
                            id="manager-team-department-filter"
                            value={departmentFilter}
                            onChange={(event) => {
                                setDepartmentFilter(event.target.value);
                                setPage(1);
                            }}
                            disabled={departments.length === 0}
                            className="h-11 min-w-[14rem] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        >
                            <option value="all">All departments</option>
                            {departments.map((department) => (
                                <option key={department.id} value={department.id}>
                                    {department.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label
                            htmlFor="manager-team-status-filter"
                            className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400"
                        >
                            Status
                        </label>
                        <select
                            id="manager-team-status-filter"
                            value={statusFilter}
                            onChange={(event) => {
                                setStatusFilter(
                                    event.target.value as (typeof STATUS_FILTER_OPTIONS)[number]["value"],
                                );
                                setPage(1);
                            }}
                            className="h-11 min-w-[11rem] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            {STATUS_FILTER_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {departmentError ? (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    {departmentError}
                </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <div className="flex items-center text-sm font-semibold text-slate-500">
                            <span
                                className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${item.iconClassName}`}
                            >
                                <item.icon className="h-5 w-5" />
                            </span>
                        </div>
                        <p className="mt-2 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                            {item.label}
                        </p>
                        <p className="text-3xl font-extrabold text-slate-900">{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <span className="w-48">Member</span>
                    <span className="w-40">Position</span>
                    <span className="w-32">Department</span>
                    <span className="w-28">Status</span>
                    <span className="w-20 text-right">Action</span>
                </div>

                <div className="divide-y divide-slate-100 text-sm font-semibold text-slate-800">
                    {paginated.length === 0 ? (
                        <p className="px-5 py-8 text-center text-sm text-slate-400">No team members found.</p>
                    ) : null}

                    {paginated.map((member) => (
                        <div key={member.id} className="flex items-center gap-4 px-5 py-4">
                            <div className="w-48 min-w-0">
                                <div className="flex items-center gap-3">
                                    <AvatarBadge
                                        avatarUrl={member.avatar_url}
                                        fullName={member.full_name}
                                        sizeClassName="h-10 w-10 shrink-0"
                                        textClassName="text-sm"
                                    />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-900">
                                            {member.full_name}
                                        </p>
                                        <p className="truncate text-xs font-semibold text-slate-500">
                                            {member.email}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="w-40 truncate text-slate-700">{member.position}</div>
                            <div className="w-32">
                                <span className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                    {member.department}
                                </span>
                            </div>
                            <div className="w-28">
                                <StatusBadge status={member.status} />
                            </div>
                            <div className="flex w-20 justify-end">
                                <button
                                    onClick={() => setSelectedEmployee(member)}
                                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                >
                                    Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-xs font-semibold text-slate-500">
                    <span>
                        {filteredSubordinates.length === 0
                            ? "No members"
                            : `Showing ${startIdx} - ${endIdx} of ${filteredSubordinates.length} members`}
                    </span>
                    <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
                            <button
                                key={item}
                                onClick={() => setPage(item)}
                                className={`h-7 w-7 rounded-md border text-xs font-semibold ${item === currentPage ? "border-blue-200 bg-blue-50 text-blue-600" : "border-slate-200 bg-white text-slate-600"}`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {selectedEmployee ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <AvatarBadge
                                    avatarUrl={selectedEmployee.avatar_url}
                                    fullName={selectedEmployee.full_name}
                                    sizeClassName="h-20 w-20"
                                    textClassName="text-xl"
                                />
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">
                                        {selectedEmployee.full_name}
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {selectedEmployee.position || "No position available"}
                                    </p>
                                    <div className="mt-3">
                                        <StatusBadge status={selectedEmployee.status} />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedEmployee(null)}
                                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                Close
                            </button>
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    Employee ID
                                </p>
                                <p className="mt-2 text-sm font-semibold text-slate-900">
                                    {selectedEmployee.employee_code || "--"}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    Reports To
                                </p>
                                <p className="mt-2 text-sm font-semibold text-slate-900">
                                    {manager?.full_name || "--"}
                                </p>
                                {manager?.position ? (
                                    <p className="mt-1 text-xs text-slate-500">{manager.position}</p>
                                ) : null}
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    Email
                                </p>
                                <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                                    {selectedEmployee.email || "--"}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    Department
                                </p>
                                <p className="mt-2 text-sm font-semibold text-slate-900">
                                    {selectedEmployee.department || "--"}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    Position
                                </p>
                                <p className="mt-2 text-sm font-semibold text-slate-900">
                                    {selectedEmployee.position || "--"}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    Status
                                </p>
                                <div className="mt-2">
                                    <StatusBadge status={selectedEmployee.status} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
}
