import { NextRequest, NextResponse } from "next/server";
import { createProxyResponse, hasAuthSession, proxyToBackend } from "@/libs/backend-api";

export async function GET(request: NextRequest) {
    try {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const upstreamResponse = await proxyToBackend({
            method: "GET",
            path: "/employees/me",
            request,
        });

        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json(
            { message: "Unable to load profile." },
            { status: 500 },
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        if (!hasAuthSession(request)) {
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
                authSession: upstreamResponse.authSession ?? null,
            });
        }

        return createProxyResponse(upstreamResponse);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to update profile.";
        return NextResponse.json(
            { message },
            { status: 500 },
        );
    }
}
