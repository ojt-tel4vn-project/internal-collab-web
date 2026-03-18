import type {
    DepartmentOption,
    LeaderboardFilters,
    PointBalanceData,
    StickerTypeOption,
    TimeFilter,
} from "@/types/employee";
import { timeFilters } from "@/types/employee";

type ApiEnvelope<T> = {
    data?: T;
    body?: T | { data?: T };
    message?: string;
    detail?: string;
    title?: string;
    error?: string;
};

export type PointBalanceApiData = {
    current_points?: unknown;
    employee_id?: unknown;
    initial_points?: unknown;
    year?: unknown;
};

export type PointBalanceResponse = ApiEnvelope<PointBalanceApiData>;

export type LeaderboardApiItem = {
    employee_id?: unknown;
    full_name?: unknown;
    total?: unknown;
};

export type LeaderboardResponse = ApiEnvelope<LeaderboardApiItem[]>;

export type DepartmentApiItem = {
    id?: unknown;
    name?: unknown;
    ID?: unknown;
    Name?: unknown;
};

export type DepartmentsResponse = ApiEnvelope<DepartmentApiItem[]>;

export type StickerTypeApiItem = {
    category?: unknown;
    description?: unknown;
    display_order?: unknown;
    icon_url?: unknown;
    is_active?: unknown;
    name?: unknown;
    point_cost?: unknown;
    sticker_type_id?: unknown;
};

export type StickerTypesResponse = ApiEnvelope<StickerTypeApiItem[]>;

export function asNumber(value: unknown, fallback = 0) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
}

export function asText(value: unknown, fallback = "") {
    return typeof value === "string" ? value.trim() : fallback;
}

export function asBoolean(value: unknown, fallback = false) {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "string") {
        if (value === "true") {
            return true;
        }

        if (value === "false") {
            return false;
        }
    }

    return fallback;
}

function extractEnvelopeData<T>(payload: ApiEnvelope<T> | null | undefined) {
    if (!payload) {
        return null;
    }

    if (payload.data !== undefined) {
        return payload.data;
    }

    if (payload.body === undefined) {
        return null;
    }

    if (Array.isArray(payload.body) || typeof payload.body !== "object" || payload.body === null) {
        return payload.body as T;
    }

    return (payload.body as { data?: T }).data ?? null;
}

export function normalizePointBalance(payload: PointBalanceResponse) {
    const data = extractEnvelopeData(payload);
    if (!data) {
        return null;
    }

    return {
        currentPoints: asNumber(data.current_points),
        employeeId: asText(data.employee_id),
        initialPoints: asNumber(data.initial_points),
        year: asNumber(data.year, new Date().getFullYear()),
    } satisfies PointBalanceData;
}

export function normalizeLeaderboard(payload: LeaderboardResponse) {
    const data = extractEnvelopeData(payload);
    if (!Array.isArray(data)) {
        return [];
    }

    return data
        .map((entry) => ({
            employeeId: asText(entry.employee_id),
            fullName: asText(entry.full_name, "Unnamed employee"),
            total: asNumber(entry.total),
        }))
        .filter((entry) => entry.employeeId);
}

export function normalizeDepartments(payload: DepartmentsResponse) {
    const data = extractEnvelopeData(payload);
    if (!Array.isArray(data)) {
        return [];
    }

    const uniqueDepartments = new Map<string, DepartmentOption>();
    for (const item of data) {
        const id = asText(item.id ?? item.ID);
        const name = asText(item.name ?? item.Name);
        if (!id || !name || uniqueDepartments.has(id)) {
            continue;
        }

        uniqueDepartments.set(id, { id, name });
    }

    return Array.from(uniqueDepartments.values());
}

export function normalizeStickerTypes(payload: StickerTypesResponse) {
    const data = extractEnvelopeData(payload);
    if (!Array.isArray(data)) {
        return [];
    }

    return data
        .map((item) => ({
            category: asText(item.category),
            description: asText(item.description),
            displayOrder: asNumber(item.display_order),
            iconUrl: asText(item.icon_url),
            id: asText(item.sticker_type_id),
            isActive: asBoolean(item.is_active, true),
            name: asText(item.name, "Untitled sticker"),
            pointCost: Math.max(asNumber(item.point_cost), 0),
        }))
        .filter((item) => item.id)
        .sort((left, right) => left.displayOrder - right.displayOrder || left.name.localeCompare(right.name))
        .filter((item) => item.isActive) satisfies StickerTypeOption[];
}

export function buildLeaderboardSearchParams(filters: LeaderboardFilters) {
    const params = new URLSearchParams();
    const { start, end } = getTimeRange(filters.timeFilter);
    const limit = Math.min(Math.max(filters.limit ?? 10, 1), 50);

    params.set("limit", String(limit));
    if (start) {
        params.set("start_date", formatRFC3339Start(start));
    }
    if (end) {
        params.set("end_date", formatRFC3339End(end));
    }
    if (filters.departmentId && filters.departmentId !== "all") {
        params.set("department_id", filters.departmentId);
    }

    return params;
}

export function getTimeFilterMeta(filter: TimeFilter) {
    return timeFilters.find((item) => item.id === filter) ?? timeFilters[0];
}

export function isAbortError(error: unknown) {
    if (error instanceof DOMException) {
        return error.name === "AbortError";
    }

    return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

export function getErrorMessage(raw: string, fallback: string) {
    if (!raw) return fallback;
    try {
        const parsed = JSON.parse(raw) as { message?: string; detail?: string; title?: string; error?: string };
        return parsed.message || parsed.detail || parsed.title || parsed.error || fallback;
    } catch {
        return raw.slice(0, 200);
    }
}

function formatRFC3339Start(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}T00:00:00Z`;
}

function formatRFC3339End(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}T23:59:59Z`;
}

export function getTimeRange(filter: TimeFilter) {
    const now = new Date();
    const year = now.getFullYear();
    const monthIndex = now.getMonth();

    if (filter === "month") {
        const start = new Date(year, monthIndex, 1);
        const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
        return { start, end };
    }

    if (filter === "quarter") {
        const quarterStartMonth = Math.floor(monthIndex / 3) * 3;
        const start = new Date(year, quarterStartMonth, 1);
        const end = new Date(year, quarterStartMonth + 3, 0, 23, 59, 59, 999);
        return { start, end };
    }

    if (filter === "year") {
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31, 23, 59, 59, 999);
        return { start, end };
    }

    return { start: null, end: null };
}
