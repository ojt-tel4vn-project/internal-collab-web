import { NextRequest, NextResponse } from "next/server";
import { createProxyResponse, hasAuthSession, proxyToBackend } from "@/lib/backend";

export async function GET(request: NextRequest) {
    try {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const upstreamResponse = await proxyToBackend({
            method: "GET",
            path: "/leave-types",
            request,
        });

        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json({ message: "Unable to fetch leave types." }, { status: 500 });
    }
}
