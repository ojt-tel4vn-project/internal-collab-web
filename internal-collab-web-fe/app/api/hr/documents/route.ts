import { NextRequest, NextResponse } from "next/server";
import {
    createProxyResponse,
    hasAuthSession,
    proxyToBackend,
    proxyToBackendRaw,
} from "@/lib/backend";

export async function GET(request: NextRequest) {
    try {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const upstreamResponse = await proxyToBackend({
            method: "GET",
            path: "/hr/documents",
            request,
        });

        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json(
            { message: "Unable to process HR documents request." },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file");
        const categoryId = formData.get("category_id");

        if (!(file instanceof File)) {
            return NextResponse.json({ message: "Document file is required." }, { status: 400 });
        }

        if (typeof categoryId !== "string" || !categoryId.trim()) {
            return NextResponse.json({ message: "Category is required." }, { status: 400 });
        }

        const upstreamResponse = await proxyToBackendRaw({
            method: "POST",
            path: "/hr/documents",
            request,
            body: formData,
        });

        return createProxyResponse(upstreamResponse);
    } catch (error) {
        console.error("[api/hr/documents#POST]", error);
        return NextResponse.json(
            { message: "Unable to upload document." },
            { status: 500 },
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const id = request.nextUrl.searchParams.get("id")?.trim();
        if (!id) {
            return NextResponse.json({ message: "Document id is required." }, { status: 400 });
        }

        const upstreamResponse = await proxyToBackend({
            method: "DELETE",
            path: `/hr/documents/${encodeURIComponent(id)}`,
            request,
        });

        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json(
            { message: "Unable to delete document." },
            { status: 500 },
        );
    }
}
