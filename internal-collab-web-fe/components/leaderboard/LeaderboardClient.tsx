"use client";

import { useCallback, useEffect, useState } from "react";

type LeaderboardEntry = {
    employee_id: string;
    full_name: string;
    total: number;
};

type PointBalance = {
    employee_id: string;
    year: number;
    initial_points: number;
    current_points: number;
};

type StickerType = {
    sticker_type_id: string;
    name: string;
    description?: string;
    icon_url?: string;
    point_cost: number;
    display_order: number;
    is_active: boolean;
};

type Props = {
    sideNav: React.ReactNode;
};

const PODIUM_COLORS = ["bg-slate-200", "bg-amber-400", "bg-orange-300"];
const PODIUM_BADGES = ["🥈", "🥇", "🥉"];
const PODIUM_BAR_COLORS = ["bg-slate-300", "bg-amber-400", "bg-orange-300"];
// top3 display order: rank2 (left), rank1 (center), rank3 (right)
const PODIUM_ORDER = [1, 0, 2];

export function LeaderboardClient({ sideNav }: Props) {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [balance, setBalance] = useState<PointBalance | null>(null);
    const [stickerTypes, setStickerTypes] = useState<StickerType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [lbRes, balRes, typesRes] = await Promise.all([
                fetch("/api/stickers/leaderboard?limit=10"),
                fetch("/api/stickers/balance"),
                fetch("/api/stickers/types"),
            ]);

            if (!lbRes.ok) throw new Error("Failed to load leaderboard");
            if (!balRes.ok) throw new Error("Failed to load balance");
            if (!typesRes.ok) throw new Error("Failed to load sticker types");

            const lbData = await lbRes.json();
            const balData = await balRes.json();
            const typesData = await typesRes.json();

            setEntries(lbData.data ?? []);
            setBalance(balData.data ?? null);
            setStickerTypes(
                (Array.isArray(typesData.data) ? typesData.data : [])
                    .filter((item: unknown): item is StickerType => {
                        if (!item || typeof item !== "object") {
                            return false;
                        }

                        const sticker = item as Partial<StickerType>;
                        return Boolean(sticker.sticker_type_id) && sticker.is_active !== false;
                    })
                    .sort((left: StickerType, right: StickerType) => (left.display_order ?? 0) - (right.display_order ?? 0)),
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const top3 = entries.slice(0, 3);
    const rest = entries.slice(3);

    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8">
                <div className="flex w-65 flex-col gap-4">
                    {sideNav}

                    {/* Balance card */}
                    <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                        <div className="flex items-center justify-between text-[11px] font-semibold uppercase text-slate-500">
                            <span>My Balance</span>
                            <span className="text-slate-400">✺</span>
                        </div>
                        {loading ? (
                            <div className="mt-2 h-8 w-20 animate-pulse rounded bg-slate-100" />
                        ) : balance ? (
                            <>
                                <div className="mt-2 text-3xl font-extrabold text-slate-900">
                                    {balance.current_points}
                                </div>
                                <p className="text-sm font-semibold text-slate-500">pts available</p>
                                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                                    <span>Initial: {balance.initial_points} pts</span>
                                    <span className="text-blue-600">{balance.year}</span>
                                </div>
                            </>
                        ) : (
                            <p className="mt-2 text-sm text-slate-400">No balance data</p>
                        )}
                    </div>

                    {/* Send Sticker panel */}
                    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm space-y-3">
                        <p className="text-sm font-semibold text-slate-900">Send a Sticker</p>
                        {loading ? (
                            <div className="space-y-2">
                                {Array.from({ length: 3 }, (_, index) => (
                                    <div key={`sticker-type-skeleton-${index}`} className="h-12 animate-pulse rounded-xl bg-slate-100" />
                                ))}
                            </div>
                        ) : stickerTypes.length > 0 ? (
                            <div className="space-y-2">
                                {stickerTypes.slice(0, 4).map((item) => (
                                    <div key={item.sticker_type_id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${item.icon_url ? "bg-slate-100 text-transparent" : "bg-white text-slate-600"
                                                    }`}
                                                style={
                                                    item.icon_url
                                                        ? {
                                                            backgroundImage: `url("${item.icon_url}")`,
                                                            backgroundPosition: "center",
                                                            backgroundSize: "cover",
                                                        }
                                                        : undefined
                                                }
                                                aria-hidden="true"
                                            >
                                                {item.icon_url ? "." : item.name.slice(0, 1).toUpperCase()}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="truncate text-sm font-semibold text-slate-800">{item.name}</p>
                                                    <span className="shrink-0 text-xs font-semibold text-blue-600">
                                                        {item.point_cost} pt
                                                    </span>
                                                </div>
                                                {item.description ? (
                                                    <p className="mt-1 text-[11px] text-slate-500">{item.description}</p>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-[12px] text-amber-700">
                                No active sticker types are available yet.
                            </div>
                        )}
                    </div>
                </div>

                <section className="flex-1 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-3xl font-bold">Leaderboard</h1>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                All Time
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm space-y-4">
                        {/* Podium top 3 */}
                        {loading ? (
                            <div className="flex flex-col items-center gap-4 py-6">
                                <div className="flex items-end gap-6">
                                    {[0, 1, 2].map((i) => (
                                        <div key={i} className="flex flex-col items-center gap-2">
                                            <div className="h-16 w-16 animate-pulse rounded-full bg-slate-100" />
                                            <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                                            <div className="h-16 w-20 animate-pulse rounded-xl bg-slate-100" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : top3.length > 0 ? (
                            <div className="flex flex-col items-center gap-4 rounded-2xl bg-linear-to-b from-slate-50 to-white py-6">
                                <div className="flex items-end gap-6">
                                    {PODIUM_ORDER.map((rankIdx, posIdx) => {
                                        const entry = top3[rankIdx];
                                        if (!entry) return null;
                                        return (
                                            <div key={entry.employee_id} className="flex flex-col items-center gap-2">
                                                <div
                                                    className={`flex h-16 w-16 items-center justify-center rounded-full border-4 border-white shadow ${PODIUM_COLORS[rankIdx]}`}
                                                >
                                                    <span className="text-lg">{PODIUM_BADGES[rankIdx]}</span>
                                                </div>
                                                <div className="flex flex-col items-center leading-tight">
                                                    <p className="max-w-20 truncate text-center text-sm font-semibold text-slate-900">
                                                        {entry.full_name}
                                                    </p>
                                                    <p className="text-[11px] font-semibold text-blue-600">
                                                        {entry.total} stickers
                                                    </p>
                                                </div>
                                                <div
                                                    className={`h-16 w-20 rounded-xl ${PODIUM_BAR_COLORS[posIdx === 1 ? 1 : posIdx === 0 ? 0 : 2]}`}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : !loading && (
                            <p className="py-6 text-center text-sm text-slate-400">No sticker data yet.</p>
                        )}

                        {/* Ranked list for ranks 4+ */}
                        {rest.length > 0 && (
                            <div className="rounded-2xl border border-slate-100">
                                <div className="grid grid-cols-[60px_1fr_120px] items-center border-b border-slate-100 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    <span>Rank</span>
                                    <span>Employee</span>
                                    <span className="text-right">Stickers</span>
                                </div>
                                {rest.map((row, idx) => (
                                    <div
                                        key={row.employee_id}
                                        className={`grid grid-cols-[60px_1fr_120px] items-center px-4 py-3 text-sm font-semibold ${idx !== rest.length - 1 ? "border-b border-slate-100" : ""}`}
                                    >
                                        <span className="text-slate-500">{idx + 4}</span>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-slate-200 to-slate-400 text-xs font-bold text-white">
                                                {idx + 4}
                                            </span>
                                            <span className="truncate text-slate-800">{row.full_name}</span>
                                        </div>
                                        <span className="text-right text-slate-800">{row.total}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}
