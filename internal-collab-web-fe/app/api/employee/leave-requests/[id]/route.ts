import { NextRequest, NextResponse } from "next/server";
import { getAccessTokenFromRequest, proxyToBackend } from "@/libs/backend-api";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function DELETE(request: NextRequest, { params }: RouteContext) {
    try {
        const { id } = await params;
        const accessToken = getAccessTokenFromRequest(request);
        if (!accessToken) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const upstreamResponse = await proxyToBackend({
            method: "DELETE",
            path: `/leave-requests/${id}`,
            request,
        });

        return new NextResponse(upstreamResponse.text, {
            status: upstreamResponse.status,
            headers: {
                "content-type": upstreamResponse.contentType,
            },
        });
    } catch (error) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Unable to cancel leave request." },
            { status: 500 },
        );
    }
}
