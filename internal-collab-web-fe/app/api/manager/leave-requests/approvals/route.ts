import { NextRequest, NextResponse } from "next/server";
import { createProxyResponse, hasAuthSession, proxyToBackend } from "@/lib/backend";

function parsePositiveInt(value: string | null, fallback: number) {
    const parsed = Number.parseInt(value ?? "", 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
        return fallback;
    }
    return parsed;
}

export async function GET(request: NextRequest) {
    try {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const page = parsePositiveInt(request.nextUrl.searchParams.get("page"), 1);
        const limit = parsePositiveInt(request.nextUrl.searchParams.get("limit"), 20);
        const status = request.nextUrl.searchParams.get("status") || "";

        const upstreamResponse = await proxyToBackend({
            method: "GET",
            path: `/leave-requests/approvals?page=${page}&limit=${limit}&status=${status}`,
            request,
        });

        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json(
            { message: "Unable to fetch leave requests history." },
            { status: 500 },
        );
    }
}
