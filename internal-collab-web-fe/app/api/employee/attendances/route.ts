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

        const { search } = new URL(request.url);
        const upstreamResponse = await proxyToBackend({
            method: "GET",
            path: `/attendances${search}`,
            request,
        });

        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json(
            { message: "Unable to load attendance records." },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const month = searchParams.get("month")?.trim() ?? "";
        const year = searchParams.get("year")?.trim() ?? "";

        if (!month || !year) {
            return NextResponse.json(
                { message: "Month and year are required." },
                { status: 400 },
            );
        }

        const csvContent = await request.text();
        if (!csvContent.trim()) {
            return NextResponse.json(
                { message: "CSV body is required." },
                { status: 400 },
            );
        }

        const upstreamResponse = await proxyToBackendRaw({
            method: "POST",
            path: `/attendances?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`,
            request,
            body: csvContent,
            headers: {
                "Content-Type": "text/csv",
            },
        });

        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json(
            { message: "Unable to upload attendance records." },
            { status: 500 },
        );
    }
}
