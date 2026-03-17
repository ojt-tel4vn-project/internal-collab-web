import Link from "next/link";
import type { LeaderboardItem } from "@/types/dashboard";
import { ArrowUpRightIcon, MedalIcon } from "./Icons";
import { SectionCard } from "./common/SectionCard";

interface LeaderboardProps {
    entries: LeaderboardItem[];
    viewAllHref?: string;
}

export function LeaderboardCard({ entries, viewAllHref = "/employee/leaderboard" }: LeaderboardProps) {
    return (
        <SectionCard
            title="Leaderboard"
            description="This Month"
            icon={<MedalIcon className="h-6 w-6 text-orange-500" />}
            footerSlot={
                <Link
                    href={viewAllHref}
                    className="block w-full rounded-2xl bg-orange-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                    View Full Rankings <ArrowUpRightIcon className="ml-2 inline h-4 w-4" />
                </Link>
            }
        >
            <ul className="space-y-3">
                {entries.map((entry) => {
                    const initials = entry.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();

                    const highlightClasses = entry.highlight
                        ? "border border-orange-200 bg-orange-50"
                        : "border border-slate-100";

                    return (
                        <li
                            key={entry.name}
                            className={`flex items-center justify-between rounded-3xl px-4 py-3 ${highlightClasses}`}
                        >
                            <div className="flex items-center gap-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                                    {entry.rank}
                                </span>
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-600">
                                    {initials}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{entry.name}</p>
                                    {entry.role && (
                                        <p className="text-xs text-slate-500">{entry.role}</p>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-slate-900">{entry.points}</p>
                                <p className="text-[10px] font-semibold tracking-wide text-slate-400">STICKERS</p>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </SectionCard>
    );
}
