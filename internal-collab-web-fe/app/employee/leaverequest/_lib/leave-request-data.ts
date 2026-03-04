import { headers } from "next/headers";
import type {
    LeaveHistoryItem,
    LeaveQuota,
    LeaveRequestItem,
    LeaveStatusMeta,
} from "@/types/leave";

type ApiEnvelope = {
    data?: unknown;
    body?: { data?: unknown };
};

export type LeaveSummary = {
    used: number;
    total: number;
    remaining: number;
    over: number;
    progress: number;
};

export type PendingLeaveRequestView = {
    id: string;
    leaveType: string;
    status: LeaveStatusMeta;
    dateRange: string;
    days: number;
};

export type LeaveRequestPageData = {
    summary: LeaveSummary;
    summaryYear: number;
    quotaCount: number;
    hasQuotaData: boolean;
    pendingRequests: PendingLeaveRequestView[];
    historyItems: LeaveHistoryItem[];
    shouldShowQuotaAlert: boolean;
    remainingByPolicy: number;
    loadError: string | null;
};

async function getBaseUrlAndCookie() {
    const headerStore = await headers();
    const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
    const protocol = headerStore.get("x-forwarded-proto") ?? "http";
    const baseUrl = host
        ? `${protocol}://${host}`
        : process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
    const cookieHeader = headerStore.get("cookie") ?? "";
    return { baseUrl, cookieHeader };
}

async function fetchApiArray(path: string, errorLabel: string) {
    const { baseUrl, cookieHeader } = await getBaseUrlAndCookie();
    const url = new URL(path, baseUrl).toString();

    const res = await fetch(url, {
        cache: "no-store",
        headers: {
            accept: "application/json, application/problem+json",
            cookie: cookieHeader,
        },
    });

    if (!res.ok) {
        const raw = await res.text().catch(() => "");
        let message = `Unable to load ${errorLabel} (HTTP ${res.status})`;
        if (raw) {
            try {
                const parsed = JSON.parse(raw) as { message?: string; detail?: string; title?: string; error?: string };
                message = parsed.message || parsed.detail || parsed.title || parsed.error || message;
            } catch {
                message = raw.slice(0, 200);
            }
        }
        throw new Error(message);
    }

    const raw = (await res.json()) as ApiEnvelope;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.body?.data)) return raw.body.data;
    return [];
}

function asNumber(value: unknown, fallback = 0) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
}

function asText(value: unknown, fallback = "") {
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed || fallback;
    }
    return fallback;
}

function normalizeQuota(input: unknown, index: number): LeaveQuota {
    if (!input || typeof input !== "object") {
        return {
            id: `quota-${index}`,
            employee_id: "",
            leave_type_id: "",
            year: 0,
            total_days: 0,
            used_days: 0,
            remaining_days: 0,
        };
    }

    const row = input as Record<string, unknown>;
    const id = String(row.id ?? "");
    const employeeId = String(row.employee_id ?? row.employeeId ?? "");
    const leaveTypeId = String(row.leave_type_id ?? row.leaveTypeId ?? "");
    const year = asNumber(row.year);
    const totalDays = asNumber(row.total_days ?? row.totalDays);
    const usedDays = asNumber(row.used_days ?? row.usedDays);
    const remainingDays = asNumber(row.remaining_days ?? row.remainingDays);

    return {
        id: id || `${employeeId || "emp"}-${leaveTypeId || "type"}-${year || 0}-${index}`,
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        year,
        total_days: totalDays,
        used_days: usedDays,
        remaining_days: remainingDays,
    };
}

function normalizeLeaveRequest(input: unknown, index: number): LeaveRequestItem {
    if (!input || typeof input !== "object") {
        return {
            id: `leave-request-${index}`,
            leave_type_id: "",
            from_date: "",
            to_date: "",
            status: "pending",
        };
    }

    const row = input as Record<string, unknown>;
    const id = asText(row.id ?? row.ID, `leave-request-${index}`);
    const leaveTypeId = asText(row.leave_type_id ?? row.leaveTypeID ?? row.leaveTypeId, "Leave");
    const fromDate = asText(row.from_date ?? row.fromDate, "");
    const toDate = asText(row.to_date ?? row.toDate, "");
    const status = asText(row.status, "pending");
    const managerComment = asText(
        row.manager_comment ??
        row.managerComment ??
        row.approval_comment ??
        row.approvalComment ??
        row.rejection_comment ??
        row.rejectionComment ??
        row.reject_comment ??
        row.rejectComment ??
        row.comment,
        "",
    );

    return {
        id,
        leave_type_id: leaveTypeId,
        from_date: fromDate,
        to_date: toDate,
        status,
        reason: asText(row.reason, ""),
        contact_during_leave: asText(row.contact_during_leave ?? row.contactDuringLeave, ""),
        manager_comment: managerComment,
        approval_comment: asText(row.approval_comment ?? row.approvalComment, ""),
        rejection_comment: asText(
            row.rejection_comment ?? row.rejectionComment ?? row.reject_comment ?? row.rejectComment,
            "",
        ),
        created_at: asText(row.created_at ?? row.createdAt, ""),
        updated_at: asText(row.updated_at ?? row.updatedAt, ""),
        total_days: asNumber(row.total_days ?? row.totalDays, 0),
    };
}

function formatDate(value: string) {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateRange(fromDate: string, toDate: string) {
    if (!fromDate && !toDate) return "-";
    if (fromDate && toDate) return `${formatDate(fromDate)} - ${formatDate(toDate)}`;
    return formatDate(fromDate || toDate);
}

function normalizeStatusMeta(status: string): LeaveStatusMeta {
    const normalized = status.trim().toLowerCase();
    if (normalized === "approved") return { label: "Approved", tone: "text-green-600" };
    if (normalized === "pending") return { label: "Pending", tone: "text-orange-500" };
    if (normalized === "rejected") return { label: "Rejected", tone: "text-red-500" };
    if (normalized === "cancelled" || normalized === "canceled") return { label: "Cancelled", tone: "text-slate-500" };
    return { label: status || "Pending", tone: "text-slate-500" };
}

function isPendingStatus(status: string) {
    const normalized = status.trim().toLowerCase();
    return normalized === "pending" || normalized.includes("pending");
}

function toHistoryItems(requests: LeaveRequestItem[]): LeaveHistoryItem[] {
    return requests.map((req, index) => ({
        id: req.id || `request-${index}`,
        title: req.leave_type_id || "Leave Request",
        range: formatDateRange(req.from_date, req.to_date),
        duration: `${asNumber(req.total_days, 0).toFixed(1)}d`,
        status: normalizeStatusMeta(req.status),
        managerComment: req.manager_comment || req.approval_comment || req.rejection_comment || "",
    }));
}

function toPendingView(request: LeaveRequestItem): PendingLeaveRequestView {
    return {
        id: request.id,
        leaveType: request.leave_type_id || "-",
        status: normalizeStatusMeta(request.status),
        dateRange: formatDateRange(request.from_date, request.to_date),
        days: asNumber(request.total_days, 0),
    };
}

function buildSummary(quotas: LeaveQuota[]): LeaveSummary {
    const used = quotas.reduce((sum, q) => sum + (q.used_days ?? 0), 0);
    const total = quotas.reduce((sum, q) => sum + (q.total_days ?? 0), 0);
    const remainingFromApi = quotas.reduce((sum, q) => sum + (q.remaining_days ?? 0), 0);
    const remaining = remainingFromApi > 0 ? remainingFromApi : Math.max(total - used, 0);
    const over = Math.max(0, used - total);
    const progress = total > 0 ? Math.min((used / total) * 100, 100) : 0;
    return { used, total, remaining, over, progress };
}

async function fetchLeaveQuotas() {
    const directData = await fetchApiArray("/api/leave-quotas", "leave quotas");
    if (directData.length > 0) return directData.map((item, index) => normalizeQuota(item, index));

    const currentYear = new Date().getFullYear();
    const fallbackYears = Array.from(new Set([currentYear, 2026, currentYear - 1, currentYear + 1]));
    for (const year of fallbackYears) {
        const yearData = await fetchApiArray(`/api/leave-quotas?year=${year}`, "leave quotas");
        if (yearData.length > 0) {
            return yearData.map((item, index) => normalizeQuota(item, index));
        }
    }
    return [];
}

async function fetchLeaveRequests() {
    const raw = await fetchApiArray("/api/leave-requests", "leave requests");
    return raw.map((item, index) => normalizeLeaveRequest(item, index));
}

export async function loadLeaveRequestPageData(): Promise<LeaveRequestPageData> {
    let quotas: LeaveQuota[] = [];
    let leaveRequests: LeaveRequestItem[] = [];
    const errors: string[] = [];

    try {
        quotas = await fetchLeaveQuotas();
    } catch (error) {
        errors.push(error instanceof Error ? error.message : "Unable to load leave quotas");
    }

    try {
        leaveRequests = await fetchLeaveRequests();
    } catch (error) {
        errors.push(error instanceof Error ? error.message : "Unable to load leave requests");
    }

    const summary = buildSummary(quotas);
    const hasQuotaData = quotas.length > 0;
    const summaryYear = quotas[0]?.year || new Date().getFullYear();
    const quotaCount = quotas.length;
    const remainingByPolicy = summary.total - summary.used;
    const shouldShowQuotaAlert = hasQuotaData && remainingByPolicy <= 5;

    const recentRequests = [...leaveRequests].sort((a, b) => {
        const left = new Date(b.created_at || b.from_date || 0).getTime();
        const right = new Date(a.created_at || a.from_date || 0).getTime();
        return left - right;
    });

    const pendingRequests = recentRequests
        .filter((request) => isPendingStatus(request.status))
        .map(toPendingView);
    const historyItems = toHistoryItems(recentRequests.filter((request) => !isPendingStatus(request.status)));

    return {
        summary,
        summaryYear,
        quotaCount,
        hasQuotaData,
        pendingRequests,
        historyItems,
        shouldShowQuotaAlert,
        remainingByPolicy,
        loadError: errors.length > 0 ? errors.join(" | ") : null,
    };
}
