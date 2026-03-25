import { NextRequest, NextResponse } from "next/server";
import { createProxyResponse, hasAuthSession, proxyToBackend } from "@/lib/backend";

export async function GET(request: NextRequest) {
    try {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Your session has expired. Please sign in again." }, { status: 401 });
        }

        const nextSearch = new URLSearchParams();
        const limitValue = Number(request.nextUrl.searchParams.get("limit") ?? "");
        if (Number.isFinite(limitValue) && limitValue > 0) {
            nextSearch.set("limit", String(Math.min(Math.trunc(limitValue), 50)));
        } else {
            nextSearch.set("limit", "10");
        }

        for (const key of ["start_date", "end_date", "department_id"]) {
            const value = request.nextUrl.searchParams.get(key)?.trim();
            if (value) {
                nextSearch.set(key, value);
            }
        }

        const search = nextSearch.toString();
        const upstreamResponse = await proxyToBackend({
            method: "GET",
            path: search ? `/stickers/leaderboard?${search}` : "/stickers/leaderboard",
            request,
        });

        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json(
            { message: "We couldn't load the leaderboard right now." },
            { status: 500 },
        );
    }
}
