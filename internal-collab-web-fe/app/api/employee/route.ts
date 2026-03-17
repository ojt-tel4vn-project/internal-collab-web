import { NextRequest, NextResponse } from "next/server";
import {
    applyAuthSessionCookies,
    clearAuthSessionCookies,
    createProxyResponse,
    hasAuthSession,
    proxyToBackend,
} from "@/lib/backend";

type ProxyState = {
    authSession: Record<string, unknown> | null;
    clearAuthCookies: boolean;
};

type EmployeeSummary = {
    id: string;
    full_name: string;
};

type EmployeeListResponse = {
    employees?: EmployeeSummary[];
    total?: number;
};

type LeaveOverviewResponse = {
    data?: {
        total_requests?: number;
    };
};

type EmployeeDetailResponse = {
    first_name?: unknown;
    last_name?: unknown;
    date_of_birth?: unknown;
    phone?: unknown;
    address?: unknown;
    department_id?: unknown;
    position?: unknown;
    manager_id?: unknown;
    role_id?: unknown;
    role?: {
        id?: unknown;
        name?: unknown;
    } | null;
    status?: unknown;
};

function parseJson<T>(text: string): T | null {
    try {
        return JSON.parse(text) as T;
    } catch {
        return null;
    }
}

function mergeProxyState(
    state: ProxyState,
    result: { authSession?: Record<string, unknown> | null; clearAuthCookies?: boolean },
) {
    if (result.authSession) {
        state.authSession = result.authSession;
    }

    if (result.clearAuthCookies) {
        state.clearAuthCookies = true;
    }
}

function finalizeJsonResponse(payload: unknown, state: ProxyState, status = 200) {
    const response = NextResponse.json(payload, { status });

    if (state.authSession) {
        applyAuthSessionCookies(response, state.authSession as never);
    }

    if (state.clearAuthCookies) {
        clearAuthSessionCookies(response);
    }

    return response;
}

function finalizeProxyErrorResponse(
    result: { text: string; status: number; contentType: string },
    state: ProxyState,
) {
    const response = new NextResponse(result.text, {
        status: result.status,
        headers: {
            "content-type": result.contentType,
        },
    });

    if (state.authSession) {
        applyAuthSessionCookies(response, state.authSession as never);
    }

    if (state.clearAuthCookies) {
        clearAuthSessionCookies(response);
    }

    return response;
}

function getQueryEmployeeId(request: NextRequest) {
    const id = request.nextUrl.searchParams.get("id")?.trim() ?? "";
    return id;
}

function hasOwnProperty(target: Record<string, unknown>, key: string) {
    return Object.prototype.hasOwnProperty.call(target, key);
}

function normalizeString(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
}

function normalizeDate(value: unknown) {
    const normalized = normalizeString(value);
    return normalized ? normalized.slice(0, 10) : "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    return value as Record<string, unknown>;
}

function extractEmployeeDetailPayload(payload: unknown): EmployeeDetailResponse | null {
    const root = asRecord(payload);
    if (!root) {
        return null;
    }

    const candidates = [
        root,
        asRecord(root.data),
        asRecord(root.employee),
        asRecord(asRecord(root.data)?.employee),
    ].filter((item): item is Record<string, unknown> => Boolean(item));

    const keys = ["first_name", "last_name", "department_id", "position", "manager_id", "role_id", "role", "status"];
    const picked = candidates.find((candidate) => keys.some((key) => hasOwnProperty(candidate, key))) ?? root;

    return picked as EmployeeDetailResponse;
}

function resolveString(
    body: Record<string, unknown>,
    key: string,
    fallback: unknown,
    options?: { allowEmpty?: boolean; dateOnly?: boolean },
) {
    const allowEmpty = options?.allowEmpty ?? false;
    const dateOnly = options?.dateOnly ?? false;

    if (hasOwnProperty(body, key)) {
        const raw = dateOnly ? normalizeDate(body[key]) : normalizeString(body[key]);
        if (raw || allowEmpty) {
            return raw;
        }
    }

    return dateOnly ? normalizeDate(fallback) : normalizeString(fallback);
}

function resolveUuid(body: Record<string, unknown>, key: string, fallback: unknown) {
    if (hasOwnProperty(body, key)) {
        const raw = normalizeString(body[key]);
        if (raw) {
            return raw;
        }
    }

    const fallbackValue = normalizeString(fallback);
    return fallbackValue || undefined;
}

function resolveManagerUuid(body: Record<string, unknown>, key: string, fallback: unknown) {
    if (hasOwnProperty(body, key)) {
        const rawValue = body[key];
        if (rawValue === null) {
            return null;
        }

        const raw = normalizeString(rawValue);
        return raw || null;
    }

    const fallbackValue = normalizeString(fallback);
    return fallbackValue || null;
}

function normalizeStatus(value: unknown) {
    const normalized = normalizeString(value).toLowerCase();
    if (!normalized) {
        return "";
    }

    if (normalized === "offboard") {
        return "inactive";
    }

    return normalized;
}

export async function GET(request: NextRequest) {
    const view = request.nextUrl.searchParams.get("view");
    if (view === "hr-management") {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const upstreamResponse = await proxyToBackend({
            method: "GET",
            path: "/hr/employees",
            request,
        });

        return createProxyResponse(upstreamResponse);
    }

    if (view === "hr-employee-detail") {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const id = getQueryEmployeeId(request);
        if (!id) {
            return NextResponse.json({ message: "Employee id is required." }, { status: 400 });
        }

        const upstreamResponse = await proxyToBackend({
            method: "GET",
            path: `/hr/employees/${id}`,
            request,
        });

        return createProxyResponse(upstreamResponse);
    }

    if (view === "departments") {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const upstreamResponse = await proxyToBackend({
            method: "GET",
            path: "/departments",
            request,
        });

        return createProxyResponse(upstreamResponse);
    }

    if (view !== "hr-dashboard") {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    if (!hasAuthSession(request)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const state: ProxyState = {
        authSession: null,
        clearAuthCookies: false,
    };

    const employeesResult = await proxyToBackend({
        method: "GET",
        path: "/hr/employees",
        request,
    });
    mergeProxyState(state, employeesResult);

    if (!employeesResult.ok) {
        return finalizeProxyErrorResponse(employeesResult, state);
    }

    const employeesPayload = parseJson<EmployeeListResponse>(employeesResult.text);
    const totalEmployees =
        employeesPayload?.total ??
        employeesPayload?.employees?.length ??
        0;

    const leaveOverviewResult = await proxyToBackend({
        method: "GET",
        path: `/leave-requests/overview?month=${month}&year=${year}`,
        request,
        authSession: state.authSession as never,
    });
    mergeProxyState(state, leaveOverviewResult);

    if (!leaveOverviewResult.ok) {
        return finalizeProxyErrorResponse(leaveOverviewResult, state);
    }

    const leaveOverviewPayload = parseJson<LeaveOverviewResponse>(leaveOverviewResult.text);

    return finalizeJsonResponse(
        {
            totalEmployees,
            leaveRequests: leaveOverviewPayload?.data?.total_requests ?? 0,
        },
        state,
    );
}

export async function POST(request: NextRequest) {
    const view = request.nextUrl.searchParams.get("view");
    if (view !== "hr-management") {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    if (!hasAuthSession(request)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) {
        return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
    }

    const upstreamResponse = await proxyToBackend({
        method: "POST",
        path: "/hr/employees",
        request,
        body,
    });

    return createProxyResponse(upstreamResponse);
}

export async function PUT(request: NextRequest) {
    const view = request.nextUrl.searchParams.get("view");
    if (view !== "hr-employee") {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    if (!hasAuthSession(request)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const id = getQueryEmployeeId(request);
    if (!id) {
        return NextResponse.json({ message: "Employee id is required." }, { status: 400 });
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) {
        return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
    }

    const state: ProxyState = {
        authSession: null,
        clearAuthCookies: false,
    };

    // Keep update resilient with Huma required-field validation:
    // merge user-edited fields on top of the current employee detail.
    const detailResult = await proxyToBackend({
        method: "GET",
        path: `/hr/employees/${id}`,
        request,
    });
    mergeProxyState(state, detailResult);

    if (!detailResult.ok) {
        return finalizeProxyErrorResponse(detailResult, state);
    }

    const detailPayload = extractEmployeeDetailPayload(parseJson<unknown>(detailResult.text));
    if (!detailPayload) {
        return finalizeJsonResponse({ message: "Unable to read employee details." }, state, 502);
    }

    const resolvedStatus = normalizeStatus(
        resolveString(body, "status", detailPayload.status),
    );

    const departmentId = resolveUuid(body, "department_id", detailPayload.department_id);
    const managerId = resolveManagerUuid(body, "manager_id", detailPayload.manager_id);
    const roleId = resolveUuid(body, "role_id", detailPayload.role_id ?? detailPayload.role?.id);

    const payload: Record<string, unknown> = {
        first_name: resolveString(body, "first_name", detailPayload.first_name),
        last_name: resolveString(body, "last_name", detailPayload.last_name),
        date_of_birth: resolveString(body, "date_of_birth", detailPayload.date_of_birth, { dateOnly: true }),
        phone: resolveString(body, "phone", detailPayload.phone, { allowEmpty: true }),
        address: resolveString(body, "address", detailPayload.address, { allowEmpty: true }),
        position: resolveString(body, "position", detailPayload.position),
        manager_id: managerId,
        status: resolvedStatus || "active",
    };

    if (departmentId) {
        payload.department_id = departmentId;
    }
    if (roleId) {
        payload.role_id = roleId;
    }

    const upstreamResponse = await proxyToBackend({
        method: "PUT",
        path: `/hr/employees/${id}`,
        request,
        authSession: state.authSession as never,
        body: payload,
    });
    mergeProxyState(state, upstreamResponse);

    return finalizeProxyErrorResponse(upstreamResponse, state);
}

export async function DELETE(request: NextRequest) {
    const view = request.nextUrl.searchParams.get("view");
    if (view !== "hr-employee") {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    if (!hasAuthSession(request)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const id = getQueryEmployeeId(request);
    if (!id) {
        return NextResponse.json({ message: "Employee id is required." }, { status: 400 });
    }

    const state: ProxyState = {
        authSession: null,
        clearAuthCookies: false,
    };

    const detailResult = await proxyToBackend({
        method: "GET",
        path: `/hr/employees/${id}`,
        request,
    });
    mergeProxyState(state, detailResult);

    if (!detailResult.ok) {
        return finalizeProxyErrorResponse(detailResult, state);
    }

    const detailPayload = extractEmployeeDetailPayload(parseJson<unknown>(detailResult.text));
    if (!detailPayload) {
        return finalizeJsonResponse({ message: "Unable to read employee details." }, state, 502);
    }

    const roleName = normalizeString(detailPayload.role?.name).toLowerCase();
    if (roleName !== "employee") {
        return finalizeJsonResponse({ message: "Only employee role can be deleted." }, state, 422);
    }

    const upstreamResponse = await proxyToBackend({
        method: "DELETE",
        path: `/hr/employees/${id}`,
        request,
        authSession: state.authSession as never,
    });
    mergeProxyState(state, upstreamResponse);

    return finalizeProxyErrorResponse(upstreamResponse, state);
}
