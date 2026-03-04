import { NextRequest, NextResponse } from "next/server";
import { getAccessTokenFromRequest, proxyToBackend } from "@/libs/backend-api";

export async function GET(request: NextRequest) {
    try {
        const accessToken = getAccessTokenFromRequest(request);
        if (!accessToken) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const year = request.nextUrl.searchParams.get("year");
        const path = year ? `/leave-quotas?year=${encodeURIComponent(year)}` : "/leave-quotas";

        const upstreamResponse = await proxyToBackend({
            method: "GET",
            path,
            request,
        });

        return new NextResponse(upstreamResponse.text, {
            status: upstreamResponse.status,
            headers: {
                "content-type": upstreamResponse.contentType,
            },
        });
    } catch {
        return NextResponse.json({ message: "Unable to fetch leave quotas." }, { status: 500 });
    }
}
