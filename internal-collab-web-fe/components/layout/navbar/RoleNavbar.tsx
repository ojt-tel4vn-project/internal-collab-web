"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { EmployeeProfile } from "@/types/employee";

type RoleNavbarProps = {
  homeHref: string;
  notificationHref: string;
  profileHref: string;
  changePasswordHref: string;
  defaultName: string;
  roleLabel: string;
};

type NavbarProfilePatch = Partial<
  Pick<EmployeeProfile, "full_name" | "first_name" | "last_name" | "email" | "avatar_url">
>;

function toStringOrUndefined(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function toAvatarValue(value: unknown) {
  return typeof value === "string" || value === null ? value : undefined;
}

function toNavbarProfilePatch(value: unknown): NavbarProfilePatch | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const patch: NavbarProfilePatch = {};

  const fullName = toStringOrUndefined(raw.full_name);
  if (fullName !== undefined) {
    patch.full_name = fullName;
  }

  const firstName = toStringOrUndefined(raw.first_name);
  if (firstName !== undefined) {
    patch.first_name = firstName;
  }

  const lastName = toStringOrUndefined(raw.last_name);
  if (lastName !== undefined) {
    patch.last_name = lastName;
  }

  const email = toStringOrUndefined(raw.email);
  if (email !== undefined) {
    patch.email = email;
  }

  const avatar = toAvatarValue(raw.avatar_url);
  if (avatar !== undefined) {
    patch.avatar_url = avatar;
  }

  return patch;
}

function buildDisplayName(profile: EmployeeProfile | null, fallbackName: string) {
  if (!profile) {
    return fallbackName;
  }

  const fullName = profile.full_name?.trim();
  if (fullName) {
    return fullName;
  }

  const joinedName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
  if (joinedName) {
    return joinedName;
  }

  return profile.email?.trim() || fallbackName;
}

export default function RoleNavbar({
  homeHref,
  notificationHref,
  profileHref,
  changePasswordHref,
  defaultName,
  roleLabel,
}: RoleNavbarProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      try {
        const response = await fetch("/api/employee/me", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as EmployeeProfile;
        setProfile(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    };

    void loadProfile();

    const handleProfileUpdated = (event: Event) => {
      const detail = toNavbarProfilePatch((event as CustomEvent<unknown>).detail);
      if (!detail) {
        return;
      }

      setProfile((previousProfile) => {
        if (!previousProfile) {
          return previousProfile;
        }

        return {
          ...previousProfile,
          ...detail,
        };
      });
    };

    window.addEventListener("employee-profile-updated", handleProfileUpdated);

    return () => {
      controller.abort();
      window.removeEventListener("employee-profile-updated", handleProfileUpdated);
    };
  }, []);

  const userName = buildDisplayName(profile, defaultName);
  const avatarUrl = useMemo(() => {
    const raw = profile?.avatar_url;
    if (typeof raw !== "string") {
      return "";
    }

    const normalized = raw.trim();
    if (!normalized) {
      return "";
    }

    const lowered = normalized.toLowerCase();
    if (lowered === "string" || lowered === "null" || lowered === "undefined") {
      return "";
    }

    return normalized;
  }, [profile?.avatar_url]);

  const initials = useMemo(() => {
    const parts = userName
      .split(" ")
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 2);

    if (parts.length === 0) {
      return "?";
    }

    return parts
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2);
  }, [userName]);

  useEffect(() => {
    setAvatarLoadError(false);
  }, [avatarUrl]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
      setIsMenuOpen(false);
      router.replace("/");
      router.refresh();
    }
  };

  return (
    <>
      <nav className="h-16 bg-[#050d1b] px-6 text-white flex items-center justify-between border-b border-[#0b2b52]">
        <Link href={homeHref} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-white/20 shadow-[0_0_18px_rgba(47,129,247,0.35)]">
            <Image
              src="/Logo.webp"
              alt="CollabHub logo"
              width={30}
              height={30}
              className="drop-shadow-[0_2px_8px_rgba(47,129,247,0.5)]"
            />
          </div>
          <span className="text-3xl font-semibold tracking-tight">
            Collab<span className="text-[#2f81f7]">Hub</span>
          </span>
        </Link>

        <div className="flex items-center gap-5">
          <Link
            href={notificationHref}
            className="text-slate-300 transition hover:text-white"
            aria-label="Notifications"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
              <path
                d="M15 17H9m10-1V11a7 7 0 10-14 0v5l-2 2h18l-2-2zM13.73 21a2 2 0 01-3.46 0"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="flex items-center gap-3 rounded-md px-2 py-1 transition hover:bg-[#0c1b33]"
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
            >
              <div className="hidden text-right leading-tight sm:block">
                <p className="text-sm font-semibold">{userName}</p>
                <p className="text-xs text-slate-300">{roleLabel}</p>
              </div>
              <div className="relative h-8 w-8 overflow-hidden rounded-full bg-[#2f81f7] text-sm font-semibold text-white">
                {avatarUrl && !avatarLoadError ? (
                  <Image
                    src={avatarUrl}
                    alt={`${userName} avatar`}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="32px"
                    onError={() => setAvatarLoadError(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    {initials}
                  </div>
                )}
              </div>
              <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current text-slate-300">
                <path d="M5.2 7.3a1 1 0 011.4 0L10 10.7l3.4-3.4a1 1 0 111.4 1.4l-4.1 4.1a1 1 0 01-1.4 0L5.2 8.7a1 1 0 010-1.4z" />
              </svg>
            </button>

            {isMenuOpen ? (
              <div className="absolute right-0 z-30 mt-2 w-52 rounded-md border border-slate-200 bg-white py-1 text-slate-800 shadow-xl">
                <Link
                  href={profileHref}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-2 text-sm hover:bg-slate-100"
                >
                  My Profile
                </Link>
                <Link
                  href={changePasswordHref}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-2 text-sm hover:bg-slate-100"
                >
                  Change Password
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsLogoutModalOpen(true);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </nav>

      {isLogoutModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-900">Do you want to logout?</h2>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                disabled={isLoggingOut}
              >
                No
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-70"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Logging out..." : "Yes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
