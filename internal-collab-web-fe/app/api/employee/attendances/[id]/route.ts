import { NextRequest, NextResponse } from "next/server";
import { createProxyResponse, hasAuthSession, proxyToBackend } from "@/lib/backend";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
    try {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ message: "Attendance id is required." }, { status: 400 });
        }

        const upstreamResponse = await proxyToBackend({
            method: "GET",
            path: `/attendances/${encodeURIComponent(id)}`,
            request,
        });

        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json(
            { message: "Unable to load attendance detail." },
            { status: 500 },
        );
    }
}
