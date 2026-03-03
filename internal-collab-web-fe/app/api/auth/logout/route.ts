import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  const expired = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };

  response.cookies.set({ name: "access_token", value: "", ...expired });
  response.cookies.set({ name: "refresh_token", value: "", ...expired });
  response.cookies.set({ name: "token_type", value: "", ...expired });
  response.cookies.set({ name: "user_roles", value: "", ...expired });

  return response;
}
