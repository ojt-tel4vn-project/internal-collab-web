import { NextRequest, NextResponse } from "next/server";
import { getAccessTokenFromRequest, proxyToBackend } from "@/libs/backend-api";

export async function GET(request: NextRequest) {
    try {
        const accessToken = getAccessTokenFromRequest(request);
        if (!accessToken) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const upstreamResponse = await proxyToBackend({
            method: "GET",
            path: "/leave-types",
            request,
        });

        return new NextResponse(upstreamResponse.text, {
            status: upstreamResponse.status,
            headers: {
                "content-type": upstreamResponse.contentType,
            },
        });
    } catch {
        return NextResponse.json({ message: "Unable to fetch leave types." }, { status: 500 });
    }
}
