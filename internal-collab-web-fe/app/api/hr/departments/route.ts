import { NextRequest, NextResponse } from "next/server";
import { createProxyResponse, hasAuthSession, proxyToBackend } from "@/lib/backend";

const DEPARTMENT_LIST_PATHS = ["/departments", "/hr/departments"] as const;
const DEPARTMENT_CREATE_PATHS = ["/hr/departments", "/departments"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

async function proxyWithFallback(
    request: NextRequest,
    method: "GET" | "POST",
    paths: readonly string[],
    body?: Record<string, unknown>,
) {
    let lastResponse = await proxyToBackend({
        method,
        path: paths[0],
        request,
        body,
    });

    for (const path of paths.slice(1)) {
        if (lastResponse.status !== 404 && lastResponse.status !== 405) {
            return lastResponse;
        }

        lastResponse = await proxyToBackend({
            method,
            path,
            request,
            body,
        });
    }

    return lastResponse;
}

export async function GET(request: NextRequest) {
    try {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const upstreamResponse = await proxyWithFallback(request, "GET", DEPARTMENT_LIST_PATHS);
        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json(
            { message: "Unable to load departments." },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const payload = (await request.json().catch(() => null)) as unknown;
        if (!isRecord(payload)) {
            return NextResponse.json(
                { message: "Invalid department payload." },
                { status: 400 },
            );
        }

        const name = asText(payload.name);
        const description = asText(payload.description);
        if (!name) {
            return NextResponse.json(
                { message: "Department name is required." },
                { status: 400 },
            );
        }
        if (!description) {
            return NextResponse.json(
                { message: "Department description is required." },
                { status: 400 },
            );
        }

        const upstreamResponse = await proxyWithFallback(request, "POST", DEPARTMENT_CREATE_PATHS, {
            name,
            description,
        });
        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json(
            { message: "Unable to create department." },
            { status: 500 },
        );
    }
}
