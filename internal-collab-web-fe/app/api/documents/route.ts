import { NextRequest, NextResponse } from "next/server";
import { createProxyResponse, hasAuthSession, proxyToBackend } from "@/libs/backend-api";

export async function GET(request: NextRequest) {
  try {
    if (!hasAuthSession(request)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const upstreamResponse = await proxyToBackend({
      method: "GET",
      path: "/documents",
      request,
    });

    return createProxyResponse(upstreamResponse);
  } catch {
    return NextResponse.json(
      { message: "Unable to process documents request." },
      { status: 500 },
    );
  }
}
