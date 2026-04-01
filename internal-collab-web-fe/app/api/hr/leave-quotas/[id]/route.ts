import { NextRequest, NextResponse } from "next/server";
import { createProxyResponse, hasAuthSession, proxyToBackend } from "@/lib/backend";

type RouteContext = {
    params: Promise<{ id: string }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isValidPayload(value: Record<string, unknown>) {
    const totalDays = value.total_days;
    const isValidTotalDays = typeof totalDays === "number" && Number.isFinite(totalDays) && totalDays >= 0;
    if (!isValidTotalDays) {
        return false;
    }

    const reason = value.reason;
    if (reason === undefined || reason === null) {
        return true;
    }

    return typeof reason === "string";
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
    try {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ message: "Quota id is required." }, { status: 400 });
        }

        const payload = (await request.json().catch(() => null)) as unknown;
        if (!isRecord(payload) || !isValidPayload(payload)) {
            return NextResponse.json(
                { message: "Invalid quota payload. Expect total_days >= 0 and optional reason." },
                { status: 400 },
            );
        }

        const upstreamResponse = await proxyToBackend({
            method: "PUT",
            path: `/leave-quotas/${encodeURIComponent(id)}`,
            request,
            body: payload,
        });

        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json({ message: "Unable to update leave quota." }, { status: 500 });
    }
}

