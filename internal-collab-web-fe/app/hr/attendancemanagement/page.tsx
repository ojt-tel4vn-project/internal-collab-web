"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from "@/components/dashboard/home/Icons";

type AttendanceDayDetail = {
    day: number;
    status: string;
    checkIn: string;
    checkOut: string;
    workHours: number | null;
};

type AttendanceRow = {
    id: string;
    employeeId: string;
    name: string;
    email: string;
    position: string;
    department: string;
    present: number;
    late: number;
    absent: number;
    status: string;
    confirmedAt: string;
    uploadedAt: string;
    month: number;
    year: number;
    attendanceDays: AttendanceDayDetail[];
};

const STATUS_OPTIONS = ["pending", "confirmed", "auto_confirmed"] as const;
const PAGE_SIZE = 10;
const LIMIT = 200;

const monthFormatter = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

function rec(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    return value as Record<string, unknown>;
}

function txt(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function num(value: unknown, fallback = 0): number {
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

function optionalNum(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string") {
        const parsed = Number(value.trim());
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return null;
}

function parseError(raw: string, fallback: string): string {
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

function statusLabel(status: string): string {
    const normalized = txt(status).toLowerCase();
    if (!normalized) {
        return "Unknown";
    }

    return normalized
        .replace(/_/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(" ");
}

function statusClass(status: string): string {
    const normalized = txt(status).toLowerCase();
    if (normalized === "confirmed") {
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
    }

    if (normalized === "auto_confirmed") {
        return "bg-blue-50 text-blue-700 ring-1 ring-blue-100";
    }

    return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
}

function dayStatusClass(status: string): string {
    const normalized = txt(status).toLowerCase();
    if (normalized === "present") {
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
    }

    if (normalized === "late") {
        return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
    }

    if (normalized === "absent") {
        return "bg-rose-50 text-rose-700 ring-1 ring-rose-100";
    }

    if (normalized === "leave") {
        return "bg-sky-50 text-sky-700 ring-1 ring-sky-100";
    }

    return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
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

function formatWorkHours(value: number | null): string {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return "--";
    }

    return `${value.toFixed(2)} h`;
}

function formatPeriod(month: number, year: number): string {
    if (month < 1 || month > 12 || year < 2000) {
        return "--";
    }

    return monthFormatter.format(new Date(year, month - 1, 1));
}

function initials(name: string): string {
    const parts = txt(name).split(" ").filter(Boolean);
    if (parts.length === 0) {
        return "--";
    }

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function parseAttendanceList(payload: unknown): { items: Record<string, unknown>[]; total: number | null } {
    const root = rec(payload);
    const body = rec(root?.body);
    const data = rec(root?.data);

    let rawItems: unknown[] = [];
    if (Array.isArray(payload)) {
        rawItems = payload;
    } else if (Array.isArray(root?.data)) {
        rawItems = root?.data as unknown[];
    } else if (Array.isArray(body?.data)) {
        rawItems = body?.data as unknown[];
    } else if (Array.isArray(data?.data)) {
        rawItems = data?.data as unknown[];
    }

    const total = [root?.total, body?.total, data?.total]
        .map((value) => num(value, -1))
        .find((value) => value >= 0);

    return {
        items: rawItems
            .map((item) => rec(item))
            .filter((item): item is Record<string, unknown> => Boolean(item)),
        total: typeof total === "number" ? total : null,
    };
}

function parseDepartmentMap(payload: unknown): Map<string, string> {
    const map = new Map<string, string>();

    const root = rec(payload);
    const body = rec(root?.body);
    const data = rec(root?.data);

    const candidates = [
        root?.employees,
        body?.employees,
        data?.employees,
        root?.data,
        body?.data,
        data?.data,
    ];

    const source = candidates.find((candidate) => Array.isArray(candidate));
    if (!Array.isArray(source)) {
        return map;
    }

    for (const raw of source) {
        const employee = rec(raw);
        if (!employee) {
            continue;
        }

        const id = txt(employee.id);
        const department = employee.department;
        const departmentName = typeof department === "string" ? txt(department) : txt(rec(department)?.name);

        if (id && departmentName) {
            map.set(id, departmentName);
        }
    }

    return map;
}

function parseAttendanceDays(value: unknown): AttendanceDayDetail[] {
    const attendanceData = rec(value);
    if (!attendanceData) {
        return [];
    }

    const details: AttendanceDayDetail[] = [];
    for (const [dayKey, rawValue] of Object.entries(attendanceData)) {
        const dayNumber = Number.parseInt(dayKey, 10);
        if (!Number.isFinite(dayNumber) || dayNumber < 1 || dayNumber > 31) {
            continue;
        }

        let status = "";
        let checkIn = "";
        let checkOut = "";
        let workHours: number | null = null;

        if (typeof rawValue === "string") {
            status = txt(rawValue).toLowerCase();
        } else {
            const detail = rec(rawValue);
            status = txt(detail?.status).toLowerCase();
            checkIn = txt(detail?.check_in_time ?? detail?.checkInTime);
            checkOut = txt(detail?.check_out_time ?? detail?.checkOutTime);
            workHours = optionalNum(detail?.work_hours ?? detail?.workHours);
        }

        details.push({
            day: dayNumber,
            status,
            checkIn,
            checkOut,
            workHours,
        });
    }

    return details.sort((left, right) => left.day - right.day);
}

function normalizeRows(items: Record<string, unknown>[], departments: Map<string, string>): AttendanceRow[] {
    const rows: AttendanceRow[] = [];

    for (const item of items) {
        const employee = rec(item.employee);
        const employeeId = txt(employee?.id);

        if (!employeeId) {
            continue;
        }

        const dayDetails = parseAttendanceDays(item.attendance_data);
        let derivedPresent = 0;
        let derivedLate = 0;
        let derivedAbsent = 0;

        for (const detail of dayDetails) {
            const normalizedStatus = txt(detail.status).toLowerCase();
            if (normalizedStatus === "present") {
                derivedPresent += 1;
            }
            if (normalizedStatus === "late") {
                derivedLate += 1;
            }
            if (normalizedStatus === "absent") {
                derivedAbsent += 1;
            }
        }

        const status = txt(item.status).toLowerCase() || "pending";
        const month = num(item.month, 0);
        const year = num(item.year, 0);

        rows.push({
            id: txt(item.id) || `${employeeId}-${month}-${year}`,
            employeeId,
            name: txt(employee?.full_name) || "Unknown",
            email: txt(employee?.email),
            position: txt(employee?.position),
            department: departments.get(employeeId) || "--",
            present: num(item.total_days_present, derivedPresent),
            late: num(item.total_days_late, derivedLate),
            absent: num(item.total_days_absent, derivedAbsent),
            status: STATUS_OPTIONS.includes(status as typeof STATUS_OPTIONS[number]) ? status : "pending",
            confirmedAt: txt(item.confirmed_at),
            uploadedAt: txt(item.uploaded_at),
            month,
            year,
            attendanceDays: dayDetails,
        });
    }

    return rows;
}

function parseUploadMessage(payload: unknown): string {
    const root = rec(payload);
    const body = rec(root?.body);
    const message = txt(body?.message) || txt(root?.message) || "Attendance uploaded successfully.";
    const count = Array.isArray(body?.data) ? body?.data.length : Array.isArray(root?.data) ? root?.data.length : null;

    if (typeof count === "number") {
        return `${message} ${count} record(s) processed.`;
    }

    return message;
}

export default function HrAttendanceManagementPage() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());

    const [rawItems, setRawItems] = useState<Record<string, unknown>[]>([]);
    const [departmentById, setDepartmentById] = useState<Record<string, string>>({});

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);

    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [file, setFile] = useState<File | null>(null);
    const [fileInputKey, setFileInputKey] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

    const [detailRecord, setDetailRecord] = useState<AttendanceRow | null>(null);

    const monthLabel = useMemo(() => monthFormatter.format(new Date(year, month - 1, 1)), [month, year]);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);

        try {
            const employeeResponse = await fetch("/api/employee?view=hr-management", { cache: "no-store" });
            let departments = new Map<string, string>();
            let warning: string | null = null;

            if (employeeResponse.ok) {
                const employeePayload = (await employeeResponse.json().catch(() => null)) as unknown;
                departments = parseDepartmentMap(employeePayload);
            } else {
                const raw = await employeeResponse.text().catch(() => "");
                warning = parseError(raw, "Unable to load departments. Department filter may be incomplete.");
            }

            const collected: Record<string, unknown>[] = [];
            let total: number | null = null;

            for (let page = 1; page <= 50; page += 1) {
                const response = await fetch(
                    `/api/employee/attendances?month=${month}&year=${year}&page=${page}&limit=${LIMIT}`,
                    { cache: "no-store" },
                );

                if (!response.ok) {
                    const raw = await response.text().catch(() => "");
                    throw new Error(parseError(raw, `Unable to load attendance records (HTTP ${response.status}).`));
                }

                const payload = (await response.json().catch(() => null)) as unknown;
                const parsed = parseAttendanceList(payload);
                if (total === null && parsed.total !== null) {
                    total = parsed.total;
                }

                if (parsed.items.length === 0) {
                    break;
                }

                collected.push(...parsed.items);

                if ((total !== null && collected.length >= total) || parsed.items.length < LIMIT) {
                    break;
                }
            }

            setRawItems(collected);
            setDepartmentById(Object.fromEntries(departments.entries()));

            if (warning) {
                setLoadError(warning);
            }
        } catch (error) {
            setRawItems([]);
            setDepartmentById({});
            setLoadError(error instanceof Error ? error.message : "Unable to load attendance data.");
        } finally {
            setIsLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    useEffect(() => {
        setDetailRecord(null);
    }, [month, year]);

    const rows = useMemo(
        () => normalizeRows(rawItems, new Map<string, string>(Object.entries(departmentById))),
        [rawItems, departmentById],
    );

    const stats = useMemo(() => {
        return {
            total: rows.length,
            confirmed: rows.filter((row) => row.status === "confirmed").length,
            pending: rows.filter((row) => row.status === "pending").length,
            autoConfirmed: rows.filter((row) => row.status === "auto_confirmed").length,
        };
    }, [rows]);

    const departmentOptions = useMemo(() => {
        const set = new Set(rows.map((row) => row.department).filter((item) => item && item !== "--"));
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [rows]);

    const filteredRows = useMemo(() => {
        const query = search.trim().toLowerCase();

        return rows.filter((row) => {
            const matchesSearch = !query || `${row.name} ${row.email}`.toLowerCase().includes(query);
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

    const pageStart = filteredRows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const pageEnd = filteredRows.length === 0 ? 0 : Math.min(filteredRows.length, currentPage * PAGE_SIZE);
    const paginatedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleUpload = async () => {
        setUploadError(null);
        setUploadSuccess(null);

        if (!file) {
            setUploadError("Please choose a CSV file to upload.");
            return;
        }

        if (!file.name.toLowerCase().endsWith(".csv")) {
            setUploadError("Only CSV files are supported for attendance upload.");
            return;
        }

        setIsUploading(true);
        try {
            const csvText = (await file.text()).replace(/^\uFEFF/, "");
            if (!csvText.trim()) {
                throw new Error("CSV file is empty.");
            }

            const response = await fetch(`/api/employee/attendances?month=${month}&year=${year}`, {
                method: "POST",
                headers: { "Content-Type": "text/csv" },
                body: csvText,
            });

            const raw = await response.text().catch(() => "");
            if (!response.ok) {
                throw new Error(parseError(raw, `Unable to upload attendance CSV (HTTP ${response.status}).`));
            }

            let payload: unknown = null;
            if (raw) {
                try {
                    payload = JSON.parse(raw) as unknown;
                } catch {
                    payload = null;
                }
            }

            setUploadSuccess(parseUploadMessage(payload));
            setFile(null);
            setFileInputKey((current) => current + 1);
            await loadData();
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : "Unable to upload attendance CSV.");
        } finally {
            setIsUploading(false);
        }
    };

    const downloadTemplate = () => {
        const anchor = document.createElement("a");
        anchor.href = "/templates/attendance-template.xlsx";
        anchor.download = "attendance-template.xlsx";
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    };

    return (
        <section className="w-full space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Attendance Management</h1>
                    <p className="text-sm text-slate-500">Search, filter, upload, and inspect monthly attendance records.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                        <button
                            type="button"
                            className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
                            onClick={() =>
                                setMonth((currentMonth) => {
                                    if (currentMonth === 1) {
                                        setYear((currentYear) => currentYear - 1);
                                        return 12;
                                    }

                                    return currentMonth - 1;
                                })
                            }
                        >
                            <ChevronLeftIcon className="h-4 w-4" />
                        </button>
                        <span>{monthLabel}</span>
                        <button
                            type="button"
                            className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
                            onClick={() =>
                                setMonth((currentMonth) => {
                                    if (currentMonth === 12) {
                                        setYear((currentYear) => currentYear + 1);
                                        return 1;
                                    }

                                    return currentMonth + 1;
                                })
                            }
                        >
                            <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={downloadTemplate}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                        <DownloadIcon className="h-4 w-4" />
                        Download Excel template
                    </button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Total records</div>
                    <div className="mt-3 text-3xl font-semibold text-slate-950">{stats.total}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Confirmed</div>
                    <div className="mt-3 text-3xl font-semibold text-slate-950">{stats.confirmed}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pending review</div>
                    <div className="mt-3 text-3xl font-semibold text-slate-950">{stats.pending}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Auto-confirmed</div>
                    <div className="mt-3 text-3xl font-semibold text-slate-950">{stats.autoConfirmed}</div>
                </div>
            </div>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-950">Upload Attendance CSV</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Fill the Excel template, then save/export it as CSV before uploading.
                        </p>
                    </div>
                    <div className="text-sm font-semibold text-slate-600">Target month: {monthLabel}</div>
                </div>
                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <label
                            htmlFor="attendance-csv-file"
                            className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                            Choose file
                        </label>
                        <span className="truncate text-sm text-slate-600">{file ? file.name : "No file chosen"}</span>
                        <input
                            key={fileInputKey}
                            id="attendance-csv-file"
                            type="file"
                            accept=".csv,text/csv"
                            onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                setUploadError(null);
                                setUploadSuccess(null);
                                setFile(event.target.files?.[0] ?? null);
                            }}
                            className="sr-only"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => void handleUpload()}
                        disabled={isUploading}
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                        {isUploading ? "Uploading..." : "Upload CSV"}
                    </button>
                </div>
                {uploadError ? (
                    <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {uploadError}
                    </div>
                ) : null}
                {uploadSuccess ? (
                    <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {uploadSuccess}
                    </div>
                ) : null}
            </section>

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
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className="min-w-[180px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                        >
                            <option value="all">All status</option>
                            {STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>
                                    {statusLabel(status)}
                                </option>
                            ))}
                        </select>
                        <select
                            value={departmentFilter}
                            onChange={(event) => setDepartmentFilter(event.target.value)}
                            className="min-w-[220px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                        >
                            <option value="all">All departments</option>
                            {departmentOptions.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="text-sm text-slate-500">
                        Showing <span className="font-semibold text-slate-900">{pageStart}</span>-
                        <span className="font-semibold text-slate-900">{pageEnd}</span> of{" "}
                        <span className="font-semibold text-slate-900">{filteredRows.length}</span> filtered,{" "}
                        <span className="font-semibold text-slate-900">{rows.length}</span> records
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
                                <th className="px-5 py-4 text-center">Present</th>
                                <th className="px-5 py-4 text-center">Late</th>
                                <th className="px-5 py-4 text-center">Absent</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4">Uploaded At</th>
                                <th className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">
                                        Loading attendance records...
                                    </td>
                                </tr>
                            ) : filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">
                                        No attendance records match the current filters.
                                    </td>
                                </tr>
                            ) : (
                                paginatedRows.map((row) => (
                                    <tr key={row.id} className="align-top hover:bg-slate-50/70">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                                                    {initials(row.name)}
                                                </span>
                                                <div className="space-y-1">
                                                    <div className="font-semibold text-slate-950">{row.name}</div>
                                                    <div className="text-sm text-slate-500">
                                                        {row.position || "--"}
                                                        {row.email ? ` / ${row.email}` : ""}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-600">{row.department || "--"}</td>
                                        <td className="px-5 py-4 text-center text-sm font-semibold text-emerald-700">{row.present}</td>
                                        <td className="px-5 py-4 text-center text-sm font-semibold text-amber-700">{row.late}</td>
                                        <td className="px-5 py-4 text-center text-sm font-semibold text-rose-700">{row.absent}</td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(row.status)}`}>
                                                {statusLabel(row.status)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-600">{formatDateTime(row.uploadedAt)}</td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => setDetailRecord(row)}
                                                className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!isLoading && filteredRows.length > 0 ? (
                    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            Page <span className="font-semibold text-slate-900">{currentPage}</span> of{" "}
                            <span className="font-semibold text-slate-900">{totalPages}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                disabled={currentPage === 1}
                                className="inline-flex h-10 items-center rounded-lg border border-slate-200 px-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                disabled={currentPage === totalPages}
                                className="inline-flex h-10 items-center rounded-lg border border-slate-200 px-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>

            {detailRecord ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                    <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-950">Attendance Details</h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    {detailRecord.name} · {formatPeriod(detailRecord.month, detailRecord.year)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDetailRecord(null)}
                                className="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Close
                            </button>
                        </div>

                        <div className="space-y-5 overflow-y-auto p-5">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Status</div>
                                    <div className="mt-2">
                                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(detailRecord.status)}`}>
                                            {statusLabel(detailRecord.status)}
                                        </span>
                                    </div>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Confirmed At</div>
                                    <div className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(detailRecord.confirmedAt)}</div>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Uploaded At</div>
                                    <div className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(detailRecord.uploadedAt)}</div>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Totals</div>
                                    <div className="mt-2 text-sm font-semibold text-slate-900">
                                        P: {detailRecord.present} · L: {detailRecord.late} · A: {detailRecord.absent}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200">
                                <div className="border-b border-slate-200 px-4 py-3">
                                    <h4 className="text-sm font-semibold text-slate-950">Daily Attendance Breakdown</h4>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-slate-50">
                                            <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                                <th className="px-4 py-3">Day</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Check-in</th>
                                                <th className="px-4 py-3">Check-out</th>
                                                <th className="px-4 py-3">Work hours</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {detailRecord.attendanceDays.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                                        No day-level attendance details available.
                                                    </td>
                                                </tr>
                                            ) : (
                                                detailRecord.attendanceDays.map((day) => (
                                                    <tr key={`${detailRecord.id}-${day.day}`}>
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{day.day}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${dayStatusClass(day.status)}`}>
                                                                {statusLabel(day.status)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-700">{day.checkIn || "--"}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-700">{day.checkOut || "--"}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-700">{formatWorkHours(day.workHours)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
}
