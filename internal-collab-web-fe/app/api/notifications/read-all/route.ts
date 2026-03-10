import { NextRequest, NextResponse } from "next/server";
import { createProxyResponse, hasAuthSession, proxyToBackend } from "@/libs/backend-api";

export async function POST(request: NextRequest) {
  try {
    if (!hasAuthSession(request)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const upstreamResponse = await proxyToBackend({
      method: "POST",
      path: "/notifications/read-all",
      request,
      body: {},
    });

    return createProxyResponse(upstreamResponse);
  } catch {
    return NextResponse.json(
      { message: "Unable to mark all notifications as read." },
      { status: 500 },
    );
  }
}
