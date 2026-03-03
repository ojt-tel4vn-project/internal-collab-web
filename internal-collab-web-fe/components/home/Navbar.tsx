"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { BellIcon, ChevronRightIcon } from "./Icons";

interface UserProfile {
    name: string;
    role: string;
    initials: string;
}

interface DashboardNavbarProps {
    user: UserProfile;
    notificationCount?: number;
}

export function DashboardNavbar({ user, notificationCount = 0 }: DashboardNavbarProps) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const router = useRouter();

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        // Clear client-side session artifacts and return to login screen.
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("token_type");
        localStorage.removeItem("user");
        setOpen(false);
        router.push("/");
    };

    return (
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
            <Link href="/employee" className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Image src="/Logo.webp" alt="CollabHub logo" width={36} height={36} className="h-9 w-9 rounded-lg object-contain" />
                <span>
                    <span className="text-blue-600">Collab</span>Hub
                </span>
            </Link>

            <div className="flex items-center gap-3" ref={menuRef}>
                <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm">
                    <BellIcon className="h-5 w-5" />
                    {notificationCount > 0 ? (
                        <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-semibold text-white">
                            {notificationCount}
                        </span>
                    ) : null}
                </button>
                <div className="relative">
                    <button
                        onClick={() => setOpen((v) => !v)}
                        className="flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-sm border border-slate-200"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-200 to-blue-400 text-xs font-semibold text-white">
                            {user.initials}
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                            <p className="text-[11px] uppercase tracking-wide text-slate-400">{user.role}</p>
                        </div>
                        <ChevronRightIcon className={`h-4 w-4 text-slate-400 transition ${open ? "rotate-90" : "rotate-0"}`} />
                    </button>
                    {open ? (
                        <div className="absolute right-0 mt-2 w-40 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg">
                            <a className="block px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50" href="/employee/myprofile">
                                My Profile
                            </a>
                            <a className="block px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50" href="/employee/setting">
                                Setting
                            </a>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="block w-full px-4 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                            >
                                Logout
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </header>
    );
}
