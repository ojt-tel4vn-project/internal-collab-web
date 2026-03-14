import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl, getAccessTokenFromRequest, getTokenTypeFromRequest } from "@/lib/backend";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
    try {
        const { id } = await params;
        const accessToken = getAccessTokenFromRequest(request);
        if (!accessToken) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const url = buildApiUrl(`/documents/${encodeURIComponent(id)}/view`);
        if (!url) {
            return NextResponse.json(
                { message: "Server configuration error: API_LINK is missing or invalid." },
                { status: 500 },
            );
        }

        const tokenType = getTokenTypeFromRequest(request);
        const upstreamResponse = await fetch(url, {
            headers: {
                Authorization: `${tokenType} ${accessToken}`,
            },
        });

        const headers = new Headers();
        upstreamResponse.headers.forEach((value, key) => {
            headers.set(key, value);
        });

        return new NextResponse(upstreamResponse.body, {
            status: upstreamResponse.status,
            headers,
        });
    } catch {
        return NextResponse.json(
            { message: "Unable to load document preview." },
            { status: 500 },
        );
    }
}
