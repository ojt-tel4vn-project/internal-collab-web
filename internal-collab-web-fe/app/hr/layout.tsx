import type { ReactNode } from "react";
import { headers } from "next/headers";
import { BirthdayAnnouncementModal } from "@/components/birthdays/BirthdayAnnouncementModal";
import { RoleWorkspaceShell } from "@/components/layout/RoleWorkspaceShell";
import { HRSideNav } from "@/components/layout/navigation/HRSideNav";
import HRNavbar from "@/components/layout/navbar/HRNavbar";

type LayoutProfile = {
  id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string | null;
};

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function fetchInitialProfile() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const baseUrl = host
    ? `${protocol}://${host}`
    : process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  const cookieHeader = headerStore.get("cookie") ?? "";

  const response = await fetch(new URL("/api/employee/me", baseUrl), {
    cache: "no-store",
    headers: {
      accept: "application/json, application/problem+json",
      cookie: cookieHeader,
    },
  }).catch(() => null);

  if (!response?.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) {
    return null;
  }

  return {
    id: asText(payload.id),
    full_name: asText(payload.full_name),
    first_name: asText(payload.first_name),
    last_name: asText(payload.last_name),
    email: asText(payload.email),
    avatar_url: typeof payload.avatar_url === "string" ? payload.avatar_url : null,
  } satisfies LayoutProfile;
}

export default async function HrLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const initialProfile = await fetchInitialProfile();

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <HRNavbar initialProfile={initialProfile} />
      <BirthdayAnnouncementModal userId={initialProfile?.id ?? null} />
      <RoleWorkspaceShell sideNav={<HRSideNav />}>
        {children}
      </RoleWorkspaceShell>
    </div>
  );
}
