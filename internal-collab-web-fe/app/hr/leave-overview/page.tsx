"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/dashboard/home/Icons";

type LeaveRequestApi = {
    id?: unknown;
    from_date?: unknown;
    to_date?: unknown;
    total_days?: unknown;
    reason?: unknown;
    status?: unknown;
    submitted_at?: unknown;
    employee?: {
        id?: unknown;
        full_name?: unknown;
    } | null;
    leave_type?: {
        name?: unknown;
    } | null;
};

type LeaveOverviewApi = {
    total_requests?: unknown;
    pending?: unknown;
    approved?: unknown;
    rejected?: unknown;
    employees_on_leave_today?: unknown;
    upcoming_leaves?: Array<{
        employee?: unknown;
        from_date?: unknown;
        to_date?: unknown;
    }>;
};

type LeaveRow = {
    id: string;
    employeeName: string;
    department: string;
    leaveType: string;
    fromDate: string;
    toDate: string;
    totalDays: number;
    status: string;
    reason: string;
    submittedAt: string;
    source: "pending" | "overview";
};

const PAGE_SIZE = 10;
type LeaveStatusFilter = "all" | "pending" | "approved" | "rejected" | "canceled";

const monthFormatter = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
const dayFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    return value as Record<string, unknown>;
}

function asText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown, fallback = 0): number {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string") {
        const parsed = Number(value.trim());
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return fallback;
}

function parseErrorMessage(raw: string, fallback: string): string {
    if (!raw) {
        return fallback;
    }

    try {
        const parsed = JSON.parse(raw) as { message?: string; detail?: string; title?: string; error?: string };
        return parsed.message || parsed.detail || parsed.title || parsed.error || fallback;
    } catch {
        return raw.slice(0, 200) || fallback;
    }
}

function normalizeStatus(value: unknown): string {
    const normalized = asText(value).toLowerCase();
    if (normalized === "pending" || normalized === "approved" || normalized === "rejected" || normalized === "canceled") {
        return normalized;
    }

    return "pending";
}

function formatStatus(status: string): string {
    if (!status) {
        return "Unknown";
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusClass(status: string): string {
    if (status === "approved") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
    if (status === "rejected") return "bg-rose-50 text-rose-700 ring-1 ring-rose-100";
    if (status === "canceled") return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
}

function formatDate(value: string): string {
    if (!value) {
        return "--";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "--";
    }

    return dayFormatter.format(date);
}

function formatDateTime(value: string): string {
    if (!value) {
        return "--";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "--";
    }

    return dateTimeFormatter.format(date);
}

function formatRange(fromDate: string, toDate: string, totalDays: number): string {
    const from = formatDate(fromDate);
    const to = formatDate(toDate);
    if (from === "--" || to === "--") {
        return "--";
    }

    if (fromDate === toDate) {
        return `${from} (${totalDays} day)`;
    }

    return `${from} - ${to} (${totalDays} days)`;
}

function parseArrayFromPayload(payload: unknown): Record<string, unknown>[] {
    const root = asRecord(payload);
    const body = asRecord(root?.body);
    const data = asRecord(root?.data);

    const raw =
        (Array.isArray(payload) && payload) ||
        (Array.isArray(root?.data) ? root?.data : null) ||
        (Array.isArray(body?.data) ? body?.data : null) ||
        (Array.isArray(data?.data) ? data?.data : null) ||
        [];

    return raw
        .map((item) => asRecord(item))
        .filter((item): item is Record<string, unknown> => Boolean(item));
}

function parseOverview(payload: unknown): LeaveOverviewApi {
    const root = asRecord(payload);
    const body = asRecord(root?.body);
    const data = asRecord(root?.data);

    const candidate =
        (data && asRecord(data.data)) ||
        (body && asRecord(body.data)) ||
        data ||
        body ||
        root;

    return (candidate ?? {}) as LeaveOverviewApi;
}

function buildDepartmentMaps(payload: unknown) {
    const byEmployeeId = new Map<string, string>();
    const byName = new Map<string, string>();

    const employees = parseArrayFromPayload(payload);
    for (const employee of employees) {
        const id = asText(employee.id);
        const name = asText(employee.full_name);

        const departmentRaw = employee.department;
        const departmentName = typeof departmentRaw === "string"
            ? asText(departmentRaw)
            : asText(asRecord(departmentRaw)?.name);

        if (id && departmentName) {
            byEmployeeId.set(id, departmentName);
        }

        if (name && departmentName) {
            byName.set(name.toLowerCase(), departmentName);
        }
    }

    return { byEmployeeId, byName };
}

export default function HrLeaveRequestPage() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());

    const [overview, setOverview] = useState<LeaveOverviewApi | null>(null);
    const [pendingRequests, setPendingRequests] = useState<LeaveRequestApi[]>([]);
    const [departmentByEmployeeId, setDepartmentByEmployeeId] = useState<Record<string, string>>({});
    const [departmentByName, setDepartmentByName] = useState<Record<string, string>>({});

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<LeaveStatusFilter>("all");
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);

    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const monthLabel = useMemo(() => monthFormatter.format(new Date(year, month - 1, 1)), [month, year]);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);

        try {
            const [overviewRes, pendingRes, employeesRes] = await Promise.all([
                fetch(`/api/manager/leave-overview?year=${year}&month=${month}`, { cache: "no-store" }),
                fetch("/api/manager/leave-requests/pending-approval?page=1&limit=200", { cache: "no-store" }),
                fetch("/api/employee?view=hr-management", { cache: "no-store" }),
            ]);

            if (!overviewRes.ok) {
                const raw = await overviewRes.text().catch(() => "");
                throw new Error(parseErrorMessage(raw, `Unable to load leave overview (HTTP ${overviewRes.status}).`));
            }

            const overviewPayload = (await overviewRes.json().catch(() => null)) as unknown;
            setOverview(parseOverview(overviewPayload));

            const warnings: string[] = [];

            if (pendingRes.ok) {
                const pendingPayload = (await pendingRes.json().catch(() => null)) as unknown;
                const parsed = parseArrayFromPayload(pendingPayload);
                setPendingRequests(parsed as unknown as LeaveRequestApi[]);
            } else {
                const raw = await pendingRes.text().catch(() => "");
                setPendingRequests([]);
                warnings.push(parseErrorMessage(raw, "Pending requests are not available for this account."));
            }

            if (employeesRes.ok) {
                const employeesPayload = (await employeesRes.json().catch(() => null)) as unknown;
                const maps = buildDepartmentMaps(employeesPayload);
                setDepartmentByEmployeeId(Object.fromEntries(maps.byEmployeeId.entries()));
                setDepartmentByName(Object.fromEntries(maps.byName.entries()));
            } else {
                const raw = await employeesRes.text().catch(() => "");
                setDepartmentByEmployeeId({});
                setDepartmentByName({});
                warnings.push(parseErrorMessage(raw, "Unable to map departments for leave requests."));
            }

            if (warnings.length > 0) {
                setLoadError(warnings.join(" "));
            }
        } catch (error) {
            setOverview(null);
            setPendingRequests([]);
            setDepartmentByEmployeeId({});
            setDepartmentByName({});
            setLoadError(error instanceof Error ? error.message : "Unable to load leave requests.");
        } finally {
            setIsLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const rows = useMemo(() => {
        const byEmployeeId = new Map<string, string>(Object.entries(departmentByEmployeeId));
        const byName = new Map<string, string>(Object.entries(departmentByName));

        const pendingRows: LeaveRow[] = pendingRequests.map((item, index) => {
            const raw = asRecord(item) ?? {};
            const employee = asRecord(raw.employee);
            const employeeId = asText(employee?.id);
            const employeeName = asText(employee?.full_name) || "Unknown";
            const status = normalizeStatus(raw.status);

            return {
                id: asText(raw.id) || `pending-${index}`,
                employeeName,
                department: byEmployeeId.get(employeeId) || byName.get(employeeName.toLowerCase()) || "--",
                leaveType: asText(asRecord(raw.leave_type)?.name) || "--",
                fromDate: asText(raw.from_date),
                toDate: asText(raw.to_date),
                totalDays: asNumber(raw.total_days, 0),
                status,
                reason: asText(raw.reason) || "--",
                submittedAt: asText(raw.submitted_at),
                source: "pending",
            };
        });

        const upcoming = Array.isArray(overview?.upcoming_leaves) ? overview?.upcoming_leaves : [];
        const overviewRows: LeaveRow[] = upcoming.map((item, index) => {
            const employeeName = asText(item?.employee) || "Unknown";
            const fromDate = asText(item?.from_date);
            const toDate = asText(item?.to_date);
            const from = new Date(fromDate);
            const to = new Date(toDate);
            const totalDays = Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())
                ? 0
                : Math.max(1, Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1);

            return {
                id: `overview-${employeeName}-${fromDate}-${toDate}-${index}`,
                employeeName,
                department: byName.get(employeeName.toLowerCase()) || "--",
                leaveType: "--",
                fromDate,
                toDate,
                totalDays,
                status: "approved",
                reason: "Approved leave (from overview).",
                submittedAt: "",
                source: "overview",
            };
        });

        const merged = [...pendingRows, ...overviewRows];
        return merged.sort((left, right) => {
            const rightTime = new Date(right.fromDate).getTime();
            const leftTime = new Date(left.fromDate).getTime();
            if (Number.isNaN(rightTime) && Number.isNaN(leftTime)) return 0;
            if (Number.isNaN(rightTime)) return -1;
            if (Number.isNaN(leftTime)) return 1;
            return rightTime - leftTime;
        });
    }, [pendingRequests, overview?.upcoming_leaves, departmentByEmployeeId, departmentByName]);

    const departmentOptions = useMemo(() => {
        const options = new Set(rows.map((row) => row.department).filter((value) => value && value !== "--"));
        return Array.from(options).sort((left, right) => left.localeCompare(right));
    }, [rows]);

    const filteredRows = useMemo(() => {
        const query = search.trim().toLowerCase();

        return rows.filter((row) => {
            const matchesSearch = !query || row.employeeName.toLowerCase().includes(query);
            const matchesStatus = statusFilter === "all" || row.status === statusFilter;
            const matchesDepartment = departmentFilter === "all" || row.department === departmentFilter;
            return matchesSearch && matchesStatus && matchesDepartment;
        });
    }, [rows, search, statusFilter, departmentFilter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter, departmentFilter, month, year]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
    useEffect(() => {
        setCurrentPage((current) => Math.min(current, totalPages));
    }, [totalPages]);

    const paginatedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const pageStart = filteredRows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const pageEnd = filteredRows.length === 0 ? 0 : Math.min(filteredRows.length, currentPage * PAGE_SIZE);

    const overviewStats = {
        total: asNumber(overview?.total_requests, rows.length),
        pending: asNumber(overview?.pending, rows.filter((row) => row.status === "pending").length),
        approved: asNumber(overview?.approved, rows.filter((row) => row.status === "approved").length),
        rejected: asNumber(overview?.rejected, 0),
    };

    return (
                        <section className="w-full space-y-6">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Leave Request</h1>
                        </div>

                        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                            <button type="button" className="rounded-full p-1 text-slate-400 hover:bg-slate-100" onClick={() => setMonth((m) => { if (m === 1) { setYear((y) => y - 1); return 12; } return m - 1; })}>
                                <ChevronLeftIcon className="h-4 w-4" />
                            </button>
                            <span>{monthLabel}</span>
                            <button type="button" className="rounded-full p-1 text-slate-400 hover:bg-slate-100" onClick={() => setMonth((m) => { if (m === 12) { setYear((y) => y + 1); return 1; } return m + 1; })}>
                                <ChevronRightIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Total Requests</p><p className="mt-3 text-3xl font-semibold text-slate-950">{overviewStats.total}</p></div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pending</p><p className="mt-3 text-3xl font-semibold text-amber-600">{overviewStats.pending}</p></div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Approved</p><p className="mt-3 text-3xl font-semibold text-emerald-600">{overviewStats.approved}</p></div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Rejected</p><p className="mt-3 text-3xl font-semibold text-rose-600">{overviewStats.rejected}</p></div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search by employee name"
                                    className="min-w-[240px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                                />
                                <select
                                    value={statusFilter}
                                    onChange={(event) => setStatusFilter(event.target.value as LeaveStatusFilter)}
                                    className="min-w-[180px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                                >
                                    <option value="all">All status</option>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="canceled">Canceled</option>
                                </select>
                                <select
                                    value={departmentFilter}
                                    onChange={(event) => setDepartmentFilter(event.target.value)}
                                    className="min-w-[220px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                                >
                                    <option value="all">All departments</option>
                                    {departmentOptions.map((department) => (
                                        <option key={department} value={department}>{department}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="text-sm text-slate-500">
                                Showing <span className="font-semibold text-slate-900">{pageStart}</span>-<span className="font-semibold text-slate-900">{pageEnd}</span> of <span className="font-semibold text-slate-900">{filteredRows.length}</span> rows
                            </div>
                        </div>

                        {loadError ? (
                            <div className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-600">{loadError}</div>
                        ) : null}

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                        <th className="px-5 py-4">Employee</th>
                                        <th className="px-5 py-4">Department</th>
                                        <th className="px-5 py-4">Leave Type</th>
                                        <th className="px-5 py-4">Duration</th>
                                        <th className="px-5 py-4">Status</th>
                                        <th className="px-5 py-4">Reason</th>
                                        <th className="px-5 py-4">Submitted At</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">Loading leave requests...</td>
                                        </tr>
                                    ) : filteredRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">No leave requests match the current filters.</td>
                                        </tr>
                                    ) : (
                                        paginatedRows.map((row) => (
                                            <tr key={row.id} className="align-top hover:bg-slate-50/70">
                                                <td className="px-5 py-4">
                                                    <div className="space-y-1">
                                                        <div className="font-semibold text-slate-950">{row.employeeName}</div>
                                                        <div className="text-xs text-slate-500">Source: {row.source === "pending" ? "Pending approval API" : "Overview API"}</div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-sm text-slate-600">{row.department || "--"}</td>
                                                <td className="px-5 py-4 text-sm text-slate-600">{row.leaveType || "--"}</td>
                                                <td className="px-5 py-4 text-sm text-slate-600">{formatRange(row.fromDate, row.toDate, row.totalDays)}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(row.status)}`}>
                                                        {formatStatus(row.status)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-sm text-slate-600">{row.reason || "--"}</td>
                                                <td className="px-5 py-4 text-sm text-slate-600">{formatDateTime(row.submittedAt)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {!isLoading && filteredRows.length > 0 ? (
                            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                                <div>Page <span className="font-semibold text-slate-900">{currentPage}</span> of <span className="font-semibold text-slate-900">{totalPages}</span></div>
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="inline-flex h-10 items-center rounded-lg border border-slate-200 px-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
                                    <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="inline-flex h-10 items-center rounded-lg border border-slate-200 px-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </section>
    );
}

