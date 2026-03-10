import { ManagerSideNav } from "@/components/layout/navigation/ManagerSideNav";

const documents = [
    { title: "Q4 OKRs", category: "Planning", owner: "Ops", updated: "Oct 10", status: "Published" },
    { title: "Policy Updates", category: "HR", owner: "HR", updated: "Oct 02", status: "Review" },
    { title: "Team Handbook", category: "Onboarding", owner: "Ops", updated: "Sep 25", status: "Published" },
    { title: "Security Checklist", category: "Compliance", owner: "Security", updated: "Sep 18", status: "Draft" },
];

function StatusPill({ status }: { status: string }) {
    const map: Record<string, string> = {
        Published: "bg-emerald-50 text-emerald-600",
        Review: "bg-amber-50 text-amber-600",
        Draft: "bg-slate-100 text-slate-600",
    };

    return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[status] || "bg-slate-100 text-slate-600"}`}>{status}</span>;
}

export default function ManagerDocumentsPage() {
    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8">
                <ManagerSideNav />

                <section className="flex-1 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold">Documents</h1>
                            <p className="text-sm text-slate-500">Quick access to shared documents and policy files</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm">Filter</button>
                            <button className="rounded-full bg-blue-600 px-4 py-2 text-white shadow">Upload</button>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-2 border-b border-slate-100 px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            <span>Title</span>
                            <span>Category</span>
                            <span>Owner</span>
                            <span>Updated</span>
                            <span className="text-right">Status</span>
                        </div>

                        <div className="divide-y divide-slate-100 text-sm font-semibold text-slate-800">
                            {documents.map((doc) => (
                                <div key={doc.title} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-2 px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">DOC</span>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{doc.title}</p>
                                            <p className="text-xs font-semibold text-slate-500">Shared with managers</p>
                                        </div>
                                    </div>
                                    <span className="text-slate-600">{doc.category}</span>
                                    <span className="text-slate-600">{doc.owner}</span>
                                    <span className="text-slate-600">{doc.updated}</span>
                                    <div className="flex justify-end">
                                        <StatusPill status={doc.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
