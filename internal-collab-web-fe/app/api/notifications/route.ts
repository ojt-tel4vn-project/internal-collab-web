import { NextRequest, NextResponse } from "next/server";
import { getAccessTokenFromRequest, proxyToBackend } from "@/libs/backend-api";

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = getAccessTokenFromRequest(request);
    if (!accessToken) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const page = parsePositiveInt(request.nextUrl.searchParams.get("page"), 1);
    const limit = parsePositiveInt(request.nextUrl.searchParams.get("limit"), 10);

    const upstreamResponse = await proxyToBackend({
      method: "GET",
      path: `/notifications?page=${page}&limit=${limit}`,
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
      { message: "Unable to load notifications." },
      { status: 500 },
    );
  }
}
