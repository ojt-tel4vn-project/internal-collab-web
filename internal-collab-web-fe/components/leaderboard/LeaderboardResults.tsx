import type { LeaderboardEntry } from "@/types/employee";

type LeaderboardResultsProps = {
    currentEmployeeId: string;
    error: string | null;
    loading: boolean;
    normalizedReceiverId: string;
    normalizedReceiverName: string;
    onReceiverPick: (receiverId: string) => void;
    rankedEntries: LeaderboardEntry[];
    topThree: LeaderboardEntry[];
};

function getPodiumTone(rank: number) {
    if (rank === 1) return "bg-amber-400";
    if (rank === 2) return "bg-slate-300";
    return "bg-orange-300";
}

function isEntrySelected(entry: LeaderboardEntry, normalizedReceiverId: string, normalizedReceiverName: string) {
    return normalizedReceiverId === entry.employeeId || normalizedReceiverName === entry.fullName.trim().toLowerCase();
}

export function LeaderboardResults({
    currentEmployeeId,
    error,
    loading,
    normalizedReceiverId,
    normalizedReceiverName,
    onReceiverPick,
    rankedEntries,
    topThree,
}: LeaderboardResultsProps) {
    return (
        <>
            {error ? (
                <div className="rounded-[28px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {error}
                </div>
            ) : null}

            <section className="space-y-5 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Top Receivers</h2>
                        <p className="text-sm text-slate-500">Click a card to fill the form.</p>
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                    {loading && topThree.length === 0 ? (
                        Array.from({ length: 3 }, (_, index) => (
                            <div key={`leaderboard-skeleton-${index}`} className="h-[224px] animate-pulse rounded-[28px] bg-slate-100" />
                        ))
                    ) : topThree.length === 0 ? (
                        <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-sm text-slate-500 xl:col-span-3">
                            No leaderboard data is available for this filter yet.
                        </div>
                    ) : (
                        topThree.map((entry, index) => {
                            const rank = index + 1;
                            const isCurrentUser = currentEmployeeId === entry.employeeId;
                            const isSelected = isEntrySelected(entry, normalizedReceiverId, normalizedReceiverName);

                            return (
                                <button
                                    key={entry.employeeId}
                                    type="button"
                                    onClick={() => onReceiverPick(entry.employeeId)}
                                    disabled={isCurrentUser}
                                    className={`flex min-h-[224px] flex-col justify-between rounded-[28px] border px-5 py-5 text-left shadow-sm transition ${
                                        isSelected
                                            ? "border-blue-200 bg-blue-50"
                                            : "border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] hover:border-slate-300 hover:bg-slate-50"
                                    } ${isCurrentUser ? "cursor-not-allowed opacity-75" : ""}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Rank {rank}</p>
                                            <p className="mt-3 line-clamp-2 text-xl font-bold tracking-tight text-slate-900">{entry.fullName}</p>
                                        </div>
                                        <div className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-black text-white shadow-sm ${getPodiumTone(rank)}`}>
                                            {rank}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Received</p>
                                            <p className="text-3xl font-black tracking-tight text-slate-900">{entry.total}</p>
                                        </div>
                                        <div className={`h-3 rounded-full ${getPodiumTone(rank)}`} />
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                <div className="overflow-hidden rounded-[28px] border border-slate-200">
                    <div className="hidden grid-cols-[80px_minmax(0,1fr)_120px] items-center border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:grid">
                        <span>Rank</span>
                        <span>Employee</span>
                        <span className="text-center">Stickers</span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {loading && rankedEntries.length === 0 ? (
                            <div className="px-4 py-6 text-sm text-slate-500">Loading leaderboard...</div>
                        ) : rankedEntries.length === 0 ? (
                            <div className="px-4 py-6 text-sm text-slate-500">No employees match the selected filters.</div>
                        ) : (
                            rankedEntries.map((entry, index) => {
                                const rank = index + 1;
                                const isCurrentUser = currentEmployeeId === entry.employeeId;
                                const isSelected = isEntrySelected(entry, normalizedReceiverId, normalizedReceiverName);

                                return (
                                    <button
                                        key={entry.employeeId}
                                        type="button"
                                        onClick={() => onReceiverPick(entry.employeeId)}
                                        disabled={isCurrentUser}
                                        className={`w-full px-4 py-4 text-left transition ${
                                            isSelected ? "bg-blue-50" : "bg-white hover:bg-slate-50"
                                        } ${isCurrentUser ? "cursor-not-allowed opacity-75" : ""}`}
                                    >
                                        <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[80px_minmax(0,1fr)_120px] sm:items-center">
                                            <div className="flex items-center gap-3">
                                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                                                    {rank}
                                                </span>
                                                <div className="sm:hidden">
                                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Rank</p>
                                                    <p className="text-sm font-semibold text-slate-700">{rank}</p>
                                                </div>
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-slate-900">{entry.fullName}</p>
                                            </div>

                                            <div className="sm:text-center">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:hidden">Stickers</p>
                                                <p className="text-sm font-bold text-slate-700">{entry.total}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}
