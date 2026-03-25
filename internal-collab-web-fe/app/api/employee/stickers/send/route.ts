import { NextRequest, NextResponse } from "next/server";
import { createProxyResponse, hasAuthSession, proxyToBackend } from "@/lib/backend";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
    try {
        if (!hasAuthSession(request)) {
            return NextResponse.json({ message: "Your session has expired. Please sign in again." }, { status: 401 });
        }

        const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
        if (!payload) {
            return NextResponse.json({ message: "The request data is invalid. Please refresh the page and try again." }, { status: 400 });
        }

        const receiverEmail = typeof payload.receiver_email === "string" ? payload.receiver_email.trim() : "";
        const receiverEmployeeCode = typeof payload.receiver_employee_code === "string"
            ? payload.receiver_employee_code.trim()
            : "";
        const stickerTypeId = typeof payload.sticker_type_id === "string" ? payload.sticker_type_id.trim() : "";
        const message = typeof payload.message === "string" ? payload.message.trim() : "";

        if ((!receiverEmail && !receiverEmployeeCode) || !stickerTypeId) {
            return NextResponse.json(
                { message: "Please select a teammate and a sticker before sending." },
                { status: 400 },
            );
        }

        if (!UUID_PATTERN.test(stickerTypeId)) {
            return NextResponse.json(
                { message: "The selected sticker is invalid. Please choose another sticker and try again." },
                { status: 400 },
            );
        }

        if (message.length > 255) {
            return NextResponse.json(
                { message: "Your message can contain up to 255 characters." },
                { status: 400 },
            );
        }

        const upstreamResponse = await proxyToBackend({
            method: "POST",
            path: "/stickers/send",
            request,
            body: {
                message,
                receiver_email: receiverEmail,
                receiver_employee_code: receiverEmployeeCode,
                sticker_type_id: stickerTypeId,
            },
        });

        return createProxyResponse(upstreamResponse);
    } catch {
        return NextResponse.json(
            { message: "We couldn't send the sticker right now. Please try again in a moment." },
            { status: 500 },
        );
    }
}
