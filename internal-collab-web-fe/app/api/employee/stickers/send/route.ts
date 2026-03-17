import { NextRequest, NextResponse } from "next/server";
import { createProxyResponse, hasAuthSession, proxyToBackend } from "@/lib/backend";

export async function POST(request: NextRequest) {
    try {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
        if (!payload) {
            return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
        }

        const receiverId = typeof payload.receiver_id === "string" ? payload.receiver_id.trim() : "";
        const stickerTypeId = typeof payload.sticker_type_id === "string" ? payload.sticker_type_id.trim() : "";
        const message = typeof payload.message === "string" ? payload.message.trim() : "";

        if (!receiverId || !stickerTypeId) {
            return NextResponse.json(
                { message: "receiver_id and sticker_type_id are required." },
                { status: 400 },
            );
        }

        if (message.length > 300) {
            return NextResponse.json(
                { message: "message must be 300 characters or fewer." },
                { status: 400 },
            );
        }

        const upstreamResponse = await proxyToBackend({
            method: "POST",
            path: "/stickers/send",
            request,
            body: {
                message,
                receiver_id: receiverId,
                sticker_type_id: stickerTypeId,
            },
        });

        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json(
            { message: "Unable to send sticker." },
            { status: 500 },
        );
    }
}
