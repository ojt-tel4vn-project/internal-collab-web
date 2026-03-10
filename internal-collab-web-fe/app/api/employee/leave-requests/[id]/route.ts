import { NextRequest, NextResponse } from "next/server";
import { createProxyResponse, hasAuthSession, proxyToBackend } from "@/lib/backend";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function DELETE(request: NextRequest, { params }: RouteContext) {
    try {
        const { id } = await params;
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const upstreamResponse = await proxyToBackend({
            method: "DELETE",
            path: `/leave-requests/${id}`,
            request,
        });

        return createProxyResponse(upstreamResponse);
    } catch (error) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Unable to cancel leave request." },
            { status: 500 },
        );
    }
}
