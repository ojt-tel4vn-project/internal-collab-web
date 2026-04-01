import { cookies, headers } from "next/headers";
import type {
    LeaveHistoryItem,
    LeaveQuota,
    LeaveRequestItem,
    LeaveStatusMeta,
} from "@/types/leave";
import { buildApiUrl } from "@/lib/backend";
import { parseApiErrorMessage } from "@/lib/api/errors";
import { asFiniteNumber, asTrimmedString } from "@/lib/normalize";

type ApiEnvelope = {
    data?: unknown;
    body?: { data?: unknown };
};

export type LeaveSummary = {
    used: number;
    total: number;
    remaining: number;
    progress: number;
};

export type PendingLeaveRequestView = {
    id: string;
    leaveType: string;
    status: LeaveStatusMeta;
    dateRange: string;
    fromDate: string;
    toDate: string;
    reason: string;
    contact: string;
    comment: string;
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

async function getAuthHeader() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    if (!accessToken) return null;
    const tokenType = cookieStore.get("token_type")?.value?.trim() || "Bearer";
    return `${tokenType} ${accessToken}`;
}

async function fetchApiArray(backendPath: string, fallbackPath: string, errorLabel: string) {
    const directUrl = buildApiUrl(backendPath);
    const authHeader = await getAuthHeader();
    const useFallback = !directUrl;
    const targetUrl = directUrl ?? (await (async () => {
        const { baseUrl } = await getBaseUrlAndCookie();
        return new URL(fallbackPath, baseUrl).toString();
    })());

    const headersInit: HeadersInit = {
        accept: "application/json, application/problem+json",
    };
    if (authHeader) {
        headersInit.Authorization = authHeader;
    }
    if (useFallback) {
        const { cookieHeader } = await getBaseUrlAndCookie();
        if (cookieHeader) {
            headersInit.cookie = cookieHeader;
        }
    }

    const res = await fetch(targetUrl, {
        cache: "no-store",
        headers: headersInit,
    });

    if (!res.ok) {
        const raw = await res.text().catch(() => "");
        const message = parseApiErrorMessage(raw, `Unable to load ${errorLabel} (HTTP ${res.status})`);
        throw new Error(message);
    }

    const raw = (await res.json()) as ApiEnvelope;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.body?.data)) return raw.body.data;
    return [];
}

const asNumber = asFiniteNumber;
const asText = (value: unknown, fallback = "") => asTrimmedString(value, fallback, true);

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
    const leaveTypeName = asText(row.leave_type_name ?? row.leaveTypeName, "");
    const year = asNumber(row.year);
    const totalDays = asNumber(row.total_days ?? row.totalDays);
    const usedDays = asNumber(row.used_days ?? row.usedDays);
    const remainingDays = asNumber(row.remaining_days ?? row.remainingDays);

    return {
        id: id || `${employeeId || "emp"}-${leaveTypeId || "type"}-${year || 0}-${index}`,
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        leave_type_name: leaveTypeName,
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
            leave_type_name: "Leave",
            from_date: "",
            to_date: "",
            status: "pending",
        };
    }

    const row = input as Record<string, unknown>;
    const leaveTypeRaw =
        row.leave_type && typeof row.leave_type === "object"
            ? (row.leave_type as Record<string, unknown>)
            : row.leaveType && typeof row.leaveType === "object"
                ? (row.leaveType as Record<string, unknown>)
                : null;

    const id = asText(row.id ?? row.ID, `leave-request-${index}`);
    const leaveTypeId = asText(row.leave_type_id ?? row.leaveTypeID ?? row.leaveTypeId ?? leaveTypeRaw?.id, "");
    const leaveTypeName = asText(
        row.leave_type_name ?? row.leaveTypeName ?? leaveTypeRaw?.name ?? leaveTypeId,
        "Leave",
    );
    const fromDate = asText(row.from_date ?? row.fromDate, "");
    const toDate = asText(row.to_date ?? row.toDate, "");
    const status = asText(row.status, "pending");
    const approverComment = asText(row.approver_comment ?? row.approverComment, "");
    const managerComment = asText(
        row.manager_comment ??
        row.managerComment ??
        row.approver_comment ??
        row.approverComment ??
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
        leave_type_name: leaveTypeName,
        from_date: fromDate,
        to_date: toDate,
        status,
        reason: asText(row.reason, ""),
        contact_during_leave: asText(row.contact_during_leave ?? row.contactDuringLeave, ""),
        approver_comment: approverComment,
        manager_comment: managerComment,
        approval_comment: asText(row.approval_comment ?? row.approvalComment, ""),
        rejection_comment: asText(
            row.rejection_comment ?? row.rejectionComment ?? row.reject_comment ?? row.rejectComment,
            "",
        ),
        created_at: asText(row.created_at ?? row.createdAt ?? row.submitted_at ?? row.submittedAt, ""),
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
    if (normalized === "approval") return { label: "Approved", tone: "text-green-600" };
    if (normalized === "pending") return { label: "Pending", tone: "text-orange-500" };
    if (normalized === "rejected") return { label: "Rejected", tone: "text-red-500" };
    if (normalized === "cancelled" || normalized === "canceled") return { label: "Cancelled", tone: "text-slate-500" };
    return { label: status || "Pending", tone: "text-slate-500" };
}

function isPendingStatus(status: string) {
    const normalized = status.trim().toLowerCase();
    return normalized === "pending" || normalized.includes("pending");
}

function getRequestComment(request: LeaveRequestItem) {
    return request.approver_comment || request.manager_comment || request.approval_comment || request.rejection_comment || "";
}

function toHistoryItems(requests: LeaveRequestItem[]): LeaveHistoryItem[] {
    return requests.map((req, index) => {
        const leaveType = req.leave_type_name || req.leave_type_id || "Leave Request";
        const comment = getRequestComment(req);
        return {
            id: req.id || `request-${index}`,
            title: leaveType,
            range: formatDateRange(req.from_date, req.to_date),
            duration: `${asNumber(req.total_days, 0).toFixed(1)}d`,
            leaveType,
            fromDate: formatDate(req.from_date),
            toDate: formatDate(req.to_date),
            reason: req.reason || "-",
            contact: req.contact_during_leave || "-",
            comment: comment || "-",
            status: normalizeStatusMeta(req.status),
            managerComment: comment,
        };
    });
}

function toPendingView(request: LeaveRequestItem): PendingLeaveRequestView {
    const comment = getRequestComment(request);
    return {
        id: request.id,
        leaveType: request.leave_type_name || request.leave_type_id || "-",
        status: normalizeStatusMeta(request.status),
        dateRange: formatDateRange(request.from_date, request.to_date),
        fromDate: formatDate(request.from_date),
        toDate: formatDate(request.to_date),
        reason: request.reason || "-",
        contact: request.contact_during_leave || "-",
        comment: comment || "-",
        days: asNumber(request.total_days, 0),
    };
}

function buildSummary(quotas: LeaveQuota[]): LeaveSummary {
    if (quotas.length === 0) {
        return { used: 0, total: 0, remaining: 0, progress: 0 };
    }

    let primary = quotas.find((q) => q.leave_type_name && q.leave_type_name.toLowerCase().includes("annual"));

    if (!primary) {
        primary = quotas.reduce((best, current) => {
            if (!best) return current;
            const bestTotal = best.total_days ?? 0;
            const currentTotal = current.total_days ?? 0;
            return currentTotal > bestTotal ? current : best;
        }, quotas[0] as LeaveQuota);
    }

    const total = primary.total_days ?? 0;
    const used = primary.used_days ?? 0;
    const remaining =
        typeof primary.remaining_days === "number" ? primary.remaining_days : Math.max(total - used, 0);
    const progress = total > 0 ? Math.min((used / total) * 100, 100) : 0;
    return { used, total, remaining, progress };
}

async function fetchLeaveQuotas() {
    const directData = await fetchApiArray("/leave-quotas", "/api/employee/leave-quotas", "leave quotas");
    return directData.map((item, index) => normalizeQuota(item, index));
}

async function fetchLeaveRequests() {
    const raw = await fetchApiArray("/leave-requests", "/api/employee/leave-requests", "leave requests");
    return raw.map((item, index) => normalizeLeaveRequest(item, index));
}

export async function loadLeaveRequestPageData(): Promise<LeaveRequestPageData> {
    let quotas: LeaveQuota[] = [];
    let leaveRequests: LeaveRequestItem[] = [];
    const errors: string[] = [];

    const [quotaResult, leaveRequestsResult] = await Promise.allSettled([
        fetchLeaveQuotas(),
        fetchLeaveRequests(),
    ]);

    if (quotaResult.status === "fulfilled") {
        quotas = quotaResult.value;
    } else {
        errors.push(
            quotaResult.reason instanceof Error
                ? quotaResult.reason.message
                : "Unable to load leave quotas",
        );
    }

    if (leaveRequestsResult.status === "fulfilled") {
        leaveRequests = leaveRequestsResult.value;
    } else {
        errors.push(
            leaveRequestsResult.reason instanceof Error
                ? leaveRequestsResult.reason.message
                : "Unable to load leave requests",
        );
    }

    const summary = buildSummary(quotas);
    const hasQuotaData = quotas.length > 0;
    const summaryYear = quotas[0]?.year || new Date().getFullYear();
    const quotaCount = quotas.length;
    const remainingByPolicy = summary.remaining;
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
