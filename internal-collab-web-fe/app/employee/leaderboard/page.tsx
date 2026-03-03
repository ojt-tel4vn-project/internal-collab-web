import { CrownIcon } from "@/components/home/Icons";
import { EmployeeSideNav } from "@/components/navigation/EmployeeSideNav";

const top3 = [
    { name: "Maria G.", points: "850 pts", rank: 2, color: "bg-slate-200", badge: "🥈" },
    { name: "David K.", points: "1,240 pts", rank: 1, color: "bg-amber-400", badge: "🥇" },
    { name: "James L.", points: "720 pts", rank: 3, color: "bg-orange-300", badge: "🥉" },
];

const rows = [
    { rank: 4, name: "Elena R.", stickers: "🦉 12", points: 650 },
    { rank: 5, name: "Marcus W.", stickers: "🔮 10", points: 580 },
    { rank: 6, name: "Sophie L.", stickers: "🪴 9", points: 420 },
    { rank: 7, name: "Alex Johnson (You)", stickers: "🫧 8", points: 350, highlight: true },
    { rank: 8, name: "Daniel C.", stickers: "💎 6", points: 310 },
    { rank: 9, name: "Aisha K.", stickers: "🏆 5", points: 290 },
    { rank: 10, name: "Ben T.", stickers: "🎖️ 4", points: 245 },
];

const stickerTypes = [
    { label: "Top Performer", icon: "🏆" },
    { label: "Problem Solver", icon: "🧩" },
    { label: "Team Player", icon: "🤝" },
    { label: "Fast Delivery", icon: "⚡" },
];

export default function LeaderboardPage() {
    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8">
                <div className="flex w-[260px] flex-col gap-4">
                    <EmployeeSideNav />

                    <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                        <div className="flex items-center justify-between text-[11px] font-semibold uppercase text-slate-500">
                            <span>My Balance</span>
                            <span className="text-slate-400">✺</span>
                        </div>
                        <div className="mt-2 text-3xl font-extrabold text-slate-900">350</div>
                        <p className="text-sm font-semibold text-slate-500">pts available</p>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Next tier: 500 pts</span>
                            <span className="text-blue-600">Resets in 12 days</span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm space-y-3">
                        <p className="text-sm font-semibold text-slate-900">Send a Sticker</p>
                        <input
                            placeholder="Search colleague..."
                            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-600 outline-none focus:border-blue-500"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            {stickerTypes.map((s) => (
                                <button
                                    key={s.label}
                                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200"
                                >
                                    <span>{s.icon}</span>
                                    <span className="text-left">{s.label}</span>
                                </button>
                            ))}
                        </div>
                        <textarea
                            placeholder="Add a nice message..."
                            className="min-h-[90px] w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none focus:border-blue-500"
                        />
                        <button className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700">
                            Send Sticker ➤
                        </button>
                    </div>
                </div>

                <section className="flex-1 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-3xl font-bold">Leaderboard</h1>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">This Month</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold">
                            <button className="rounded-full bg-blue-600 px-3 py-1 text-white shadow">This Month</button>
                            <button className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">This Year</button>
                            <button className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">All Depts</button>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm space-y-4">
                        <div className="flex flex-col items-center gap-4 rounded-2xl bg-gradient-to-b from-slate-50 to-white py-6">
                            <div className="flex items-end gap-6">
                                {top3.map((p, idx) => (
                                    <div key={p.rank} className="flex flex-col items-center gap-2">
                                        <div className={`flex h-16 w-16 items-center justify-center rounded-full border-4 border-white shadow ${p.color}`}>
                                            <span className="text-lg">{p.badge}</span>
                                        </div>
                                        <div className="flex flex-col items-center leading-tight">
                                            <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                                            <p className="text-[11px] font-semibold text-blue-600">{p.points}</p>
                                        </div>
                                        <div className={`h-16 w-20 rounded-xl ${idx === 1 ? "bg-amber-400" : idx === 0 ? "bg-slate-300" : "bg-orange-300"}`} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-100">
                            <div className="grid grid-cols-[60px_1fr_120px_120px] items-center border-b border-slate-100 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                <span>Rank</span>
                                <span>Employee</span>
                                <span className="text-center">Stickers</span>
                                <span className="text-right">Points</span>
                            </div>
                            {rows.map((row, idx) => (
                                <div
                                    key={row.rank}
                                    className={`grid grid-cols-[60px_1fr_120px_120px] items-center px-4 py-3 text-sm font-semibold ${row.highlight ? "bg-blue-50" : ""
                                        } ${idx !== rows.length - 1 ? "border-b border-slate-100" : ""}`}
                                >
                                    <span className="text-slate-500">{row.rank}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-xs font-bold text-white">
                                            {row.rank}
                                        </span>
                                        <span className="text-slate-800">{row.name}</span>
                                    </div>
                                    <span className="text-center text-slate-600">{row.stickers}</span>
                                    <span className="text-right text-slate-800">{row.points}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
