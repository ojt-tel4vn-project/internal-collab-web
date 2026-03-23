import { NextRequest, NextResponse } from "next/server";
import { createProxyResponse, hasAuthSession, proxyToBackend } from "@/lib/backend";

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function GET(request: NextRequest) {
    try {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const upstreamResponse = await proxyToBackend({
            method: "GET",
            path: "/employees/birthdays/config",
            request,
        });

        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json(
            { message: "Unable to load birthday configuration." },
            { status: 500 },
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const payload = (await request.json().catch(() => null)) as unknown;
        if (!isRecord(payload)) {
            return NextResponse.json(
                { message: "Invalid birthday configuration payload." },
                { status: 400 },
            );
        }

        const upstreamResponse = await proxyToBackend({
            method: "PUT",
            path: "/employees/birthdays/config",
            request,
            body: payload,
        });

        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json(
            { message: "Unable to update birthday configuration." },
            { status: 500 },
        );
    }
}
