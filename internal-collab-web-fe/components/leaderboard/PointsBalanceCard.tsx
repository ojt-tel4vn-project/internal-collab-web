type PointsBalanceCardProps = {
    availabilityLabel: string;
    balanceError: string | null;
    balanceProgress: number;
    currentBalance: number;
    hasAvailablePoints: boolean;
    loading: boolean;
    year: number;
};

export function PointsBalanceCard({
    availabilityLabel,
    balanceError,
    balanceProgress,
    currentBalance,
    hasAvailablePoints,
    loading,
    year,
}: PointsBalanceCardProps) {
    return (
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_58%,#f8fafc_100%)] px-5 py-5">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <span>My Points</span>
                    <span>{year}</span>
                </div>
                <div className="mt-4">
                    <p className="text-4xl font-black tracking-tight text-slate-900">{loading ? "..." : currentBalance}</p>
                    <p className="text-sm font-semibold text-slate-500">Points available</p>
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                            className="h-full rounded-full bg-blue-600 transition-[width]"
                            style={{ width: `${balanceProgress}%` }}
                        />
                    </div>
                </div>
                <div className="mt-4 grid gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm text-slate-100">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-300">Status</span>
                        <span className="font-semibold">{availabilityLabel}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-300">Rule</span>
                        <span className="text-right font-semibold">Sending deducts points</span>
                    </div>
                </div>
                {balanceError ? (
                    <p className="mt-3 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                        {balanceError}
                    </p>
                ) : null}
                {!hasAvailablePoints && !loading ? (
                    <p className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                        You need remaining points before sending a sticker.
                    </p>
                ) : null}
            </div>
        </section>
    );
}
