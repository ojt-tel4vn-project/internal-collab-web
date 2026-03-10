"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, ClockIcon, DocumentIcon, GridIcon } from "@/components/dashboard/home/Icons";
import type { NavItem } from "@/types/dashboard";

const NAV_ITEMS: NavItem[] = [
    { label: "Home", href: "/manager/home", icon: GridIcon },
    { label: "Team", href: "/manager/team", icon: ClockIcon },
    { label: "Leave Approvals", href: "/manager/leave-approvals", icon: CalendarIcon, badge: "4" },
    { label: "Documents", href: "/manager/documents", icon: DocumentIcon },
    { label: "My Profile", href: "/manager/myprofile", icon: GridIcon },
    { label: "Notifications", href: "/manager/notification", icon: ClockIcon },

];

function isActive(pathname: string, href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
}

export function ManagerSideNav() {
    const pathname = usePathname();

    return (
        <aside className="w-full max-w-[230px] rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <nav>
                <ul className="space-y-2">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(pathname, item.href);
                        const base = active ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:bg-slate-50";

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    aria-current={active ? "page" : undefined}
                                    className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${base}`}
                                >
                                    <span className={active ? "text-white" : "text-slate-400"}>
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <span className="flex-1 text-left">{item.label}</span>
                                    {item.badge ? (
                                        <span className={active ? "rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white" : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600"}>
                                            {item.badge}
                                        </span>
                                    ) : null}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
}
