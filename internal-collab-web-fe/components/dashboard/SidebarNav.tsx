import Link from "next/link";
import type { NavItem } from "@/types/dashboard";

interface SidebarNavProps {
    items: NavItem[];
    role?: { label: string; value: string };
}

export function SidebarNav({ items, role }: SidebarNavProps) {
    return (
        <aside className="w-full max-w-[230px] rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <nav>
                <ul className="space-y-2">
                    {items.map((item) => {
                        const Icon = item.icon;
                        const active = item.active;
                        const base = active
                            ? "bg-blue-600 text-white shadow"
                            : "text-slate-600 hover:bg-slate-50";

                        return (
                            <li key={item.label}>
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
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                                                }`}
                                        >
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
