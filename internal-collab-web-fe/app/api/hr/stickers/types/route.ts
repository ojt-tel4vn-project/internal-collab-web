import { NextRequest, NextResponse } from "next/server";
import { createProxyResponse, hasAuthSession, proxyToBackend, proxyToBackendRaw } from "@/lib/backend";

const STICKER_TYPES_LIST_PATHS = ["/stickers/types", "/hr/stickers/types", "/hr/stickers"] as const;
const STICKER_CREATE_PATHS = ["/hr/stickers", "/hr/stickers/types", "/stickers/types"] as const;

function asText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string") {
        const parsed = Number(value.trim());
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return null;
}

type StickerCreatePayload = {
    category: string;
    description: string;
    displayOrder: number | null;
    icon: File;
    name: string;
    pointCost: number;
};

async function proxyStickerTypes(request: NextRequest) {
    let lastResponse = await proxyToBackend({
        method: "GET",
        path: STICKER_TYPES_LIST_PATHS[0],
        request,
    });

    for (const path of STICKER_TYPES_LIST_PATHS.slice(1)) {
        if (lastResponse.status !== 404 && lastResponse.status !== 405) {
            return lastResponse;
        }

        lastResponse = await proxyToBackend({
            method: "GET",
            path,
            request,
        });
    }

    return lastResponse;
}

function buildStickerFormData(payload: StickerCreatePayload) {
    const formData = new FormData();
    formData.set("name", payload.name);
    formData.set("point_cost", String(payload.pointCost));
    formData.set("icon", payload.icon);

    if (payload.description) {
        formData.set("description", payload.description);
    }

    if (payload.category) {
        formData.set("category", payload.category);
    }

    if (payload.displayOrder !== null) {
        formData.set("display_order", String(Math.trunc(payload.displayOrder)));
    }

    return formData;
}

async function proxyCreateSticker(request: NextRequest, payload: StickerCreatePayload) {
    let lastResponse = await proxyToBackendRaw({
        method: "POST",
        path: STICKER_CREATE_PATHS[0],
        request,
        body: buildStickerFormData(payload),
    });

    for (const path of STICKER_CREATE_PATHS.slice(1)) {
        if (lastResponse.status !== 404 && lastResponse.status !== 405) {
            return lastResponse;
        }

        lastResponse = await proxyToBackendRaw({
            method: "POST",
            path,
            request,
            body: buildStickerFormData(payload),
        });
    }

    return lastResponse;
}

export async function GET(request: NextRequest) {
    try {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const upstreamResponse = await proxyStickerTypes(request);
        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json(
            { message: "Unable to load sticker pool." },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const payload = await request.formData().catch(() => null);
        if (!payload) {
            return NextResponse.json(
                { message: "Invalid sticker payload." },
                { status: 400 },
            );
        }

        const name = asText(payload.get("name"));
        const pointCost = asNumber(payload.get("point_cost"));
        const displayOrderRaw = asNumber(payload.get("display_order"));
        const description = asText(payload.get("description"));
        const category = asText(payload.get("category"));
        const icon = payload.get("icon");

        if (!name) {
            return NextResponse.json(
                { message: "name is required." },
                { status: 400 },
            );
        }

        if (pointCost === null || pointCost < 0) {
            return NextResponse.json(
                { message: "point_cost must be a non-negative number." },
                { status: 400 },
            );
        }

        if (displayOrderRaw !== null && displayOrderRaw < 0) {
            return NextResponse.json(
                { message: "display_order must be a non-negative number." },
                { status: 400 },
            );
        }

        if (!(icon instanceof File) || icon.size <= 0) {
            return NextResponse.json(
                { message: "icon file is required." },
                { status: 400 },
            );
        }

        const upstreamResponse = await proxyCreateSticker(request, {
            category,
            description,
            displayOrder: displayOrderRaw,
            icon,
            name,
            pointCost,
        });

        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json(
            { message: "Unable to add sticker type." },
            { status: 500 },
        );
    }
}
