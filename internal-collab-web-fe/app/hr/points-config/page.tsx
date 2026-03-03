"use client";

import { HRSideNav } from "@/components/navigation/HRSideNav";

const pointConfig = {
    annualAllocation: 500,
    resetDate: "01/01/2024",
};

const stats = {
    totalPoints: "24,000",
    pointsRemaining: "5,550",
    pointsRedeemed: 18450,
    pointsRedeemedMax: 24000,
    nextResetDate: "01 Jan 2024",
};

const stickers = [
    { title: "Top Performer", points: 100, usage: 45, icon: "🏆" },
    { title: "Problem Solver", points: 50, usage: 82, icon: "💡" },
    { title: "Team Player", points: 30, usage: 124, icon: "🤝" },
    { title: "On Fire", points: 20, usage: 67, icon: "🔥" },
    { title: "Growth Mindset", points: 40, usage: 29, icon: "🌱" },
];

function ProgressBar({ value, max }: { value: number; max: number }) {
    const pct = Math.min(100, Math.round((value / max) * 100));
    return (
        <div className="mt-2 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
        </div>
    );
}

export default function HrPointsConfigPage() {
    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-8">
                <HRSideNav />

                <section className="flex-1 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold">Rewards Configuration</h1>
                            <p className="text-sm font-semibold text-slate-500">
                                Manage employee points allocation, catalog items, and view engagement stats.
                            </p>
                        </div>
                        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                            View History
                        </button>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[1.4fr_1.6fr]">
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-slate-900">Points Configuration</h2>
                                <span className="text-slate-400">⚙️</span>
                            </div>

                            <div className="text-center py-6">
                                <div className="text-5xl font-extrabold text-slate-900">{pointConfig.annualAllocation}</div>
                                <p className="mt-2 text-sm font-semibold text-slate-500">Points per employee / year</p>
                            </div>

                            <div className="space-y-4 text-sm font-semibold text-slate-700">
                                <div className="space-y-1">
                                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Annual Allocation</p>
                                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                        <input
                                            defaultValue={pointConfig.annualAllocation}
                                            className="flex-1 bg-transparent text-slate-900 outline-none"
                                        />
                                        <span className="text-xs text-slate-400">pts</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Reset Date</p>
                                    <input
                                        defaultValue={pointConfig.resetDate}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none"
                                    />
                                </div>
                                <button className="w-full rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700">
                                    Save Settings
                                </button>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-slate-900">This Year Stats</h2>
                                <span className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    Live Updates
                                </span>
                            </div>

                            <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                                <div className="flex items-start gap-2">
                                    <span>⚠️</span>
                                    <div>
                                        <p className="text-sm font-semibold text-amber-700">Upcoming Reset Warning</p>
                                        <p className="text-xs font-semibold text-amber-600">Points will reset in 25 days. Ensure all pending redemptions are processed before Jan 01, 2024.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Points</p>
                                    <p className="mt-2 text-3xl font-extrabold text-slate-900">{stats.totalPoints}</p>
                                </div>
                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Points Redeemed</p>
                                    <p className="mt-2 text-3xl font-extrabold text-slate-900">{stats.pointsRedeemed.toLocaleString()}</p>
                                    <ProgressBar value={stats.pointsRedeemed} max={stats.pointsRedeemedMax} />
                                </div>
                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Points Remaining</p>
                                    <p className="mt-2 text-3xl font-extrabold text-slate-900">{stats.pointsRemaining}</p>
                                </div>
                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next Reset Date</p>
                                    <p className="mt-2 text-2xl font-extrabold text-slate-900">{stats.nextResetDate}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900">Sticker Catalog</h3>
                            <button className="text-sm font-semibold text-blue-600">View All Stickers</button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            {stickers.map((item) => (
                                <div key={item.title} className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 text-center shadow-sm">
                                    <div className="text-3xl">{item.icon}</div>
                                    <div className="mt-2 text-sm font-semibold text-slate-900">{item.title}</div>
                                    <div className="text-xs font-semibold text-blue-600">{item.points} pts</div>
                                    <div className="text-xs font-semibold text-slate-400">Used {item.usage} times</div>
                                </div>
                            ))}
                            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center text-sm font-semibold text-slate-500">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg text-blue-600">+</span>
                                Add New Sticker
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
