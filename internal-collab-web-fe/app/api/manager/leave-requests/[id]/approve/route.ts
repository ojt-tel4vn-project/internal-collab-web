import { NextRequest, NextResponse } from "next/server";
import { createProxyResponse, hasAuthSession, proxyToBackend } from "@/lib/backend";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
    try {
        const { id } = await params;

        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json() as { action: string; comment?: string };

        if (!body.action || !["approve", "reject"].includes(body.action)) {
            return NextResponse.json(
                { message: "Invalid action. Must be 'approve' or 'reject'." },
                { status: 400 },
            );
        }

        if (body.action === "reject" && !body.comment?.trim()) {
            return NextResponse.json(
                { message: "Rejection reason is required." },
                { status: 400 },
            );
        }

        const upstreamResponse = await proxyToBackend({
            method: "POST",
            path: `/leave-requests/${id}/approve`,
            request,
            body,
        });

        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json(
            { message: "Unable to process leave request action." },
            { status: 500 },
        );
    }
}
