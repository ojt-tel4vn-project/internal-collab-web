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
        console.error("[api/employee/leave-requests/[id]#DELETE]", error);
        return NextResponse.json(
            { message: "Unable to cancel leave request." },
            { status: 500 },
        );
    }
}
