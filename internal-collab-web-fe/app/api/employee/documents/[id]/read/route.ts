import { NextRequest, NextResponse } from "next/server";
import { createProxyResponse, hasAuthSession, proxyToBackend } from "@/lib/backend";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
    try {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ message: "Document id is required." }, { status: 400 });
        }

        const upstreamResponse = await proxyToBackend({
            method: "POST",
            path: `/documents/${encodeURIComponent(id)}/read`,
            request,
            body: {},
        });

        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json(
            { message: "Unable to mark document as read." },
            { status: 500 },
        );
    }
}
