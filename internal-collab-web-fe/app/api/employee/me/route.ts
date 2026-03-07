import { NextRequest, NextResponse } from "next/server";
import { getAccessTokenFromRequest, proxyToBackend } from "@/libs/backend-api";

export async function GET(request: NextRequest) {
    try {
        const accessToken = getAccessTokenFromRequest(request);
        if (!accessToken) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const upstreamResponse = await proxyToBackend({
            method: "GET",
            path: "/employees/me",
            request,
        });

        return new NextResponse(upstreamResponse.text, {
            status: upstreamResponse.status,
            headers: {
                "content-type": upstreamResponse.contentType,
            },
        });
    } catch {
        return NextResponse.json(
            { message: "Unable to load profile." },
            { status: 500 },
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const accessToken = getAccessTokenFromRequest(request);
        if (!accessToken) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        let upstreamResponse = await proxyToBackend({
            method: "PUT",
            path: "/employees/me",
            request,
            body,
        });

        if ([404, 405, 501].includes(upstreamResponse.status)) {
            upstreamResponse = await proxyToBackend({
                method: "PATCH",
                path: "/employees/me",
                request,
                body,
            });
        }

        return new NextResponse(upstreamResponse.text, {
            status: upstreamResponse.status,
            headers: {
                "content-type": upstreamResponse.contentType,
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to update profile.";
        return NextResponse.json(
            { message },
            { status: 500 },
        );
    }
}
