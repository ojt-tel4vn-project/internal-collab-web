import { NextRequest, NextResponse } from "next/server";
import { createProxyResponse, hasAuthSession, proxyToBackend } from "@/lib/backend";

export async function GET(request: NextRequest) {
    try {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const upstreamResponse = await proxyToBackend({
            method: "GET",
            path: "/leave-requests",
            request,
        });

        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json({ message: "Unable to fetch leave requests." }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        const upstreamResponse = await proxyToBackend({
            method: "POST",
            path: "/leave-requests",
            request,
            body,
        });

        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json({ message: "Unable to create leave request." }, { status: 500 });
    }
}
