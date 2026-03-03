"use client";

import { useState } from "react";
import { HRSideNav } from "@/components/navigation/HRSideNav";
import { DocumentIcon, AlertTriangleIcon } from "@/components/dashboard/Icons";

const docs = [
    { name: "Employee Handbook 2024", type: "Policy", owner: "HR", uploaded: "Oct 18, 2023", status: "Approved", size: "1.2 MB" },
    { name: "Leave Policy Update", type: "Policy", owner: "HR", uploaded: "Oct 05, 2023", status: "Pending", size: "860 KB" },
    { name: "Engineering Onboarding", type: "Guide", owner: "Ops", uploaded: "Sep 20, 2023", status: "Approved", size: "2.4 MB" },
    { name: "Security Checklist", type: "Template", owner: "IT", uploaded: "Sep 02, 2023", status: "Expired", size: "540 KB" },
];

function StatusPill({ status }: { status: string }) {
    const map: Record<string, string> = {
        Approved: "bg-emerald-100 text-emerald-700",
        Pending: "bg-amber-100 text-amber-700",
        Expired: "bg-rose-100 text-rose-700",
    };
    return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[status] ?? "bg-slate-100 text-slate-600"}`}>{status}</span>;
}

export default function HrDocumentsPage() {
    const [showUpload, setShowUpload] = useState(false);

    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-8">
                <HRSideNav />

                <section className="grid w-full gap-6 lg:grid-cols-[2fr_1fr]">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-bold">Document Management</h1>
                                <p className="text-sm font-semibold text-slate-500">Organize and share HR documents across teams.</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">View Library</button>
                                <button
                                    onClick={() => setShowUpload(true)}
                                    className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700"
                                >
                                    Upload Document
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-sm font-semibold text-slate-700">
                            <div className="relative min-w-[220px] flex-1">
                                <input
                                    placeholder="Search documents..."
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                            </div>
                            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">All Types ⌄</button>
                            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">All Status ⌄</button>
                            <button className="ml-auto inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">Export</button>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <span>Document</span>
                                <span>Type</span>
                                <span>Owner</span>
                                <span>Uploaded</span>
                                <span>Status</span>
                                <span className="text-right">Size</span>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {docs.map((doc) => (
                                    <div key={doc.name} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center gap-4 px-5 py-3 text-sm font-semibold text-slate-800">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">📄</span>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{doc.name}</p>
                                                <p className="text-xs font-semibold text-slate-500">{doc.owner}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-semibold text-slate-600">{doc.type}</span>
                                        <span className="text-sm font-semibold text-slate-600">{doc.owner}</span>
                                        <span className="text-sm font-semibold text-slate-700">{doc.uploaded}</span>
                                        <StatusPill status={doc.status} />
                                        <div className="justify-self-end text-sm font-semibold text-slate-600">{doc.size}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {showUpload ? (
                        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">Upload Document</h3>
                                    <p className="text-xs font-semibold text-slate-500">Complete details to share with the team.</p>
                                </div>
                                <button
                                    onClick={() => setShowUpload(false)}
                                    className="h-8 w-8 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
                                    aria-label="Close upload"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-4 text-sm font-semibold text-slate-700">
                                <div className="space-y-1">
                                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Document Name</p>
                                    <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-500" placeholder="e.g. Compliance Checklist" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Type</p>
                                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                                        <span>Select type</span>
                                        <span className="text-slate-400">⌄</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Owner</p>
                                    <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-500" placeholder="e.g. HR" />
                                </div>
                                <div className="space-y-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-600">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl text-blue-500">☁️</div>
                                    <p>Drag & drop files here or</p>
                                    <button className="mx-auto mt-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">Browse files</button>
                                    <p className="text-xs font-semibold text-slate-400">PDF, DOCX, XLSX up to 25 MB</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Notes</p>
                                    <textarea className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-500" rows={3} placeholder="Add context or version info"></textarea>
                                </div>
                                <div className="flex items-center justify-between gap-3 pt-2">
                                    <button
                                        onClick={() => setShowUpload(false)}
                                        className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-700"
                                    >
                                        Cancel
                                    </button>
                                    <button className="flex-1 rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700">Upload</button>
                                </div>
                            </div>
                        </aside>
                    ) : null}
                </section>
            </div>
        </main>
    );
}
