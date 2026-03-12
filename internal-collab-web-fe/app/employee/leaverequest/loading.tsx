export default function Loading() {
    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8">
                <aside className="w-full max-w-[230px] rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="space-y-3 animate-pulse">
                        <div className="h-8 rounded-2xl bg-slate-100" />
                        <div className="h-8 rounded-2xl bg-slate-100" />
                        <div className="h-8 rounded-2xl bg-slate-100" />
                        <div className="h-8 rounded-2xl bg-slate-100" />
                        <div className="h-8 rounded-2xl bg-slate-100" />
                    </div>
                </aside>

                <section className="flex-1 space-y-6">
                    <div className="space-y-2 animate-pulse">
                        <div className="h-8 w-56 rounded bg-slate-100" />
                        <div className="h-4 w-80 rounded bg-slate-100" />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                                <div className="animate-pulse space-y-3">
                                    <div className="h-4 w-40 rounded bg-slate-100" />
                                    <div className="h-2 w-full rounded bg-slate-100" />
                                    <div className="h-3 w-52 rounded bg-slate-100" />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                                <div className="animate-pulse space-y-3">
                                    <div className="h-4 w-48 rounded bg-slate-100" />
                                    <div className="h-12 rounded bg-slate-100" />
                                    <div className="h-12 rounded bg-slate-100" />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
                                <div className="animate-pulse space-y-3">
                                    <div className="h-4 w-32 rounded bg-slate-100" />
                                    <div className="h-11 rounded bg-slate-100" />
                                    <div className="h-11 rounded bg-slate-100" />
                                    <div className="h-24 rounded bg-slate-100" />
                                    <div className="h-11 rounded bg-slate-100" />
                                </div>
                            </div>
                        </div>

                        <aside className="space-y-4">
                            <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
                                <div className="animate-pulse space-y-3">
                                    <div className="h-4 w-32 rounded bg-slate-100" />
                                    <div className="h-10 rounded bg-slate-100" />
                                    <div className="h-10 rounded bg-slate-100" />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
                                <div className="animate-pulse space-y-3">
                                    <div className="h-4 w-32 rounded bg-slate-100" />
                                    <div className="h-8 rounded bg-slate-100" />
                                    <div className="h-8 rounded bg-slate-100" />
                                    <div className="h-8 rounded bg-slate-100" />
                                </div>
                            </div>
                        </aside>
                    </div>
                </section>
            </div>
        </main>
    );
}
