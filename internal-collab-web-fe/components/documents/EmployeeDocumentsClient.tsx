"use client";

import { useMemo, useState } from "react";
import { AlertTriangleIcon, DocumentIcon, DownloadIcon } from "@/components/home/Icons";
import type { DocumentRecord, MarkReadResponse } from "@/types/document";

function formatDate(value: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function summarizePath(path: string) {
    if (!path) return "No file path available";
    if (path.length <= 80) return path;
    return `${path.slice(0, 77)}...`;
}

type Props = {
    documents: DocumentRecord[];
};

type IndexedDocument = DocumentRecord & {
    searchText: string;
};

export function EmployeeDocumentsClient({ documents }: Props) {
    const [query, setQuery] = useState("");
    const [readIds, setReadIds] = useState<Set<string>>(new Set());
    const [busyId, setBusyId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const indexedDocuments = useMemo<IndexedDocument[]>(
        () =>
            documents.map((doc) => ({
                ...doc,
                searchText: `${doc.title} ${doc.file_path} ${doc.category_id} ${doc.roles}`.toLowerCase(),
            })),
        [documents],
    );

    const filteredDocuments = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return indexedDocuments;
        return indexedDocuments.filter((doc) => doc.searchText.includes(q));
    }, [indexedDocuments, query]);

    const stats = useMemo(() => {
        const totalDocuments = documents.length;
        const employeeAccessible = documents.filter((doc) => (doc.roles || "").toLowerCase().includes("employee")).length;
        const uniqueCategories = new Set(documents.map((doc) => doc.category_id).filter(Boolean)).size;

        return [
            {
                label: "Total Documents",
                value: totalDocuments,
                tone: "text-slate-900",
                iconBg: "bg-blue-50",
                iconColor: "text-blue-500",
                icon: DocumentIcon,
            },
            {
                label: "Employee Access",
                value: employeeAccessible,
                tone: "text-emerald-600",
                iconBg: "bg-emerald-50",
                iconColor: "text-emerald-500",
                icon: DocumentIcon,
            },
            {
                label: "Categories",
                value: uniqueCategories,
                tone: "text-amber-500",
                iconBg: "bg-amber-50",
                iconColor: "text-amber-500",
                icon: AlertTriangleIcon,
            },
        ];
    }, [documents]);

    async function handleMarkRead(id: string) {
        setBusyId(id);
        setError(null);
        try {
            const res = await fetch(`/api/documents/${id}/read`, { method: "POST" });
            if (!res.ok) {
                const raw = await res.text().catch(() => "");
                let message = `Unable to mark document as read (HTTP ${res.status})`;
                if (raw) {
                    try {
                        const parsed = JSON.parse(raw) as MarkReadResponse & { detail?: string; title?: string; error?: string };
                        message = parsed.message || parsed.detail || parsed.title || parsed.error || message;
                    } catch {
                        message = raw.slice(0, 200);
                    }
                }
                throw new Error(message);
            }
            setReadIds((prev) => {
                const next = new Set(prev);
                next.add(id);
                return next;
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to mark document as read");
        } finally {
            setBusyId(null);
        }
    }

    return (
        <>
            {error && (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="relative w-full max-w-xl">
                        <input
                            placeholder="Search by title, category, role..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-600 shadow-sm outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {stats.map(({ label, value, iconBg, iconColor, icon: Icon, tone }) => (
                        <div key={label} className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${iconBg}`}>
                                    <Icon className={`h-5 w-5 ${iconColor}`} />
                                </div>
                            </div>
                            <p className="mt-4 text-[13px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                            <p className={`text-3xl font-extrabold leading-tight ${tone}`}>{value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {filteredDocuments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-6 text-sm text-slate-500">
                    No documents match the current filter.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {filteredDocuments.map((doc) => {
                        const isRead = readIds.has(doc.id);
                        return (
                            <article key={doc.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                                        <DocumentIcon className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-lg font-semibold text-slate-900">{doc.title || "Untitled document"}</h3>
                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                                {doc.roles || "employee"}
                                            </span>
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${isRead ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                                                {isRead ? "Read" : "Unread"}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600">{summarizePath(doc.file_path)}</p>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500">
                                    <span className="inline-flex items-center gap-2">
                                        <span className="text-slate-400">Category</span>
                                        {doc.category_id || "-"}
                                    </span>
                                    <span className="inline-flex items-center gap-2">
                                        <span className="text-slate-400">Created</span>
                                        {formatDate(doc.created_at)}
                                    </span>
                                </div>

                                <div className="mt-4 flex items-center gap-3">
                                    <a
                                        href={`/api/documents/${doc.id}/view`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-200"
                                    >
                                        View
                                    </a>
                                    <a
                                        href={`/api/documents/${doc.id}/download`}
                                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:border-blue-200"
                                        title="Download"
                                    >
                                        <DownloadIcon className="h-5 w-5" />
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => handleMarkRead(doc.id)}
                                        disabled={isRead || busyId === doc.id}
                                        className={`ml-auto rounded-xl px-4 py-3 text-sm font-semibold shadow-sm ${isRead ? "bg-emerald-100 text-emerald-700" : "bg-blue-600 text-white hover:bg-blue-700"} disabled:cursor-not-allowed`}
                                    >
                                        {busyId === doc.id ? "Saving..." : isRead ? "Read" : "Mark as Read"}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </>
    );
}
