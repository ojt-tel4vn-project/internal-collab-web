import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_LINK ?? "http://localhost:8080/api/v1";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        Accept: "application/json, application/problem+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: body?.email,
        password: body?.password,
      }),
    });

    const text = await response.text();
    const contentType = response.headers.get("content-type") ?? "application/json";

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "content-type": contentType,
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to process login request." },
      { status: 500 },
    );
  }
}
