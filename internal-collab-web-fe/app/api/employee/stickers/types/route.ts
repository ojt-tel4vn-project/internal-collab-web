import { NextRequest, NextResponse } from "next/server";
import { createProxyResponse, hasAuthSession, proxyToBackend } from "@/lib/backend";

export async function GET(request: NextRequest) {
    try {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Your session has expired. Please sign in again." }, { status: 401 });
        }

        const upstreamResponse = await proxyToBackend({
            method: "GET",
            path: "/stickers/types",
            request,
        });

        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json(
            { message: "We couldn't load the sticker list right now." },
            { status: 500 },
        );
    }
}
