import { NextRequest, NextResponse } from "next/server";
import { createProxyResponse, hasAuthSession, proxyToBackend } from "@/lib/backend";

export async function GET(request: NextRequest) {
    try {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Your session has expired. Please sign in again." }, { status: 401 });
        }

        const upstreamResponse = await proxyToBackend({
            method: "GET",
            path: "/stickers/balance",
            request,
        });

        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json(
            { message: "We couldn't load your sticker balance right now." },
            { status: 500 },
        );
    }
}
