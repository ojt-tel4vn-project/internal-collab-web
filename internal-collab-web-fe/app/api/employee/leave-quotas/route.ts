import { NextRequest, NextResponse } from "next/server";
import { createProxyResponse, hasAuthSession, proxyToBackend } from "@/lib/backend";

export async function GET(request: NextRequest) {
    try {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const year = request.nextUrl.searchParams.get("year");
        const path = year ? `/leave-quotas?year=${encodeURIComponent(year)}` : "/leave-quotas";

        const upstreamResponse = await proxyToBackend({
            method: "GET",
            path,
            request,
        });

        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json({ message: "Unable to fetch leave quotas." }, { status: 500 });
    }
}
