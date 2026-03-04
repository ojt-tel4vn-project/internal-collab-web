import { NextRequest, NextResponse } from "next/server";
import { getAccessTokenFromRequest, proxyToBackend } from "@/libs/backend-api";

type Params = {
  id: string;
};

export async function PUT(
  request: NextRequest,
  context: { params: Promise<Params> },
) {
  try {
    const accessToken = getAccessTokenFromRequest(request);
    if (!accessToken) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: "Notification id is required." }, { status: 400 });
    }

    const upstreamResponse = await proxyToBackend({
      method: "PUT",
      path: `/notifications/${encodeURIComponent(id)}/read`,
      request,
      body: {},
    });

    return new NextResponse(upstreamResponse.text, {
      status: upstreamResponse.status,
      headers: {
        "content-type": upstreamResponse.contentType,
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to mark notification as read." },
      { status: 500 },
    );
  }
}
