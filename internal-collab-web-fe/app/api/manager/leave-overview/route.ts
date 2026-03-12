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

        const now = new Date();
        const year = parsePositiveInt(request.nextUrl.searchParams.get("year"), now.getFullYear());
        const month = parsePositiveInt(request.nextUrl.searchParams.get("month"), now.getMonth() + 1);

        const upstreamResponse = await proxyToBackend({
            method: "GET",
            path: `/leave-requests/overview?year=${year}&month=${month}`,
            request,
        });

        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json(
            { message: "Unable to fetch leave overview." },
            { status: 500 },
        );
    }
}
