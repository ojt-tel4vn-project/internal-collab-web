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
            path: "/leave-requests",
            request,
        });

        return new NextResponse(upstreamResponse.text, {
            status: upstreamResponse.status,
            headers: {
                "content-type": upstreamResponse.contentType,
            },
        });
    } catch {
        return NextResponse.json({ message: "Unable to fetch leave requests." }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const accessToken = getAccessTokenFromRequest(request);
        if (!accessToken) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        const upstreamResponse = await proxyToBackend({
            method: "POST",
            path: "/leave-requests",
            request,
            body,
        });

        return new NextResponse(upstreamResponse.text, {
            status: upstreamResponse.status,
            headers: {
                "content-type": upstreamResponse.contentType,
            },
        });
    } catch {
        return NextResponse.json({ message: "Unable to create leave request." }, { status: 500 });
    }
}
