"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ManagerNavbarProps = {
  userName?: string;
  userTitle?: string;
};

export default function Manager_Navbar({
  userName = "Manager",
  userTitle = "Manager",
}: ManagerNavbarProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
      <nav className="h-16 bg-[#050d1b] text-white px-6 flex items-center justify-between border-b border-[#0b2b52]">
        <Link href="/manager" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl ring-1 ring-white/20 shadow-[0_0_18px_rgba(47,129,247,0.35)] flex items-center justify-center">
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
            href="/manager/notification"
            className="text-slate-300 hover:text-white transition"
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
              className="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-[#0c1b33] transition"
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
            >
              <div className="text-right leading-tight hidden sm:block">
                <p className="text-sm font-semibold">{userName}</p>
                <p className="text-xs text-slate-300">{userTitle}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-[#2f81f7] text-white flex items-center justify-center text-sm font-semibold">
                {userName.slice(0, 1).toUpperCase()}
              </div>
              <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current text-slate-300">
                <path d="M5.2 7.3a1 1 0 011.4 0L10 10.7l3.4-3.4a1 1 0 111.4 1.4l-4.1 4.1a1 1 0 01-1.4 0L5.2 8.7a1 1 0 010-1.4z" />
              </svg>
            </button>

            {isMenuOpen ? (
              <div className="absolute right-0 mt-2 w-52 rounded-md border border-slate-200 bg-white py-1 text-slate-800 shadow-xl z-30">
                <Link
                  href="/manager/myprofile"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-2 text-sm hover:bg-slate-100"
                >
                  My Profile
                </Link>
                <Link
                  href="/manager/change-password"
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
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
