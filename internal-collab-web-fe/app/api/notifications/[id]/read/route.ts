import { NextRequest, NextResponse } from "next/server";
import { createProxyResponse, hasAuthSession, proxyToBackend } from "@/libs/backend-api";

type Params = {
  id: string;
};

export async function PUT(
  request: NextRequest,
  context: { params: Promise<Params> },
) {
  try {
    if (!hasAuthSession(request)) {
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

    return createProxyResponse(upstreamResponse);
  } catch {
    return NextResponse.json(
      { message: "Unable to mark notification as read." },
      { status: 500 },
    );
  }
}
