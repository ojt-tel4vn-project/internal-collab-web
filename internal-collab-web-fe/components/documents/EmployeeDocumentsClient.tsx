"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangleIcon, DocumentIcon, DownloadIcon } from "@/components/dashboard/home/Icons";
import type { DocumentRecord, MarkReadResponse } from "@/types/document";

function formatDate(value: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function summarizePath(path: string) {
    if (!path) return "No file path available";
    if (path.length <= 80) return path;
    return `${path.slice(0, 77)}...`;
}

function toTrimmed(value?: string | null) {
    return typeof value === "string" ? value.trim() : "";
}

function formatIdLabel(value: string) {
    const cleaned = toTrimmed(value);
    if (!cleaned) return "-";
    if (cleaned.length <= 12) return cleaned;
    return `${cleaned.slice(0, 8)}...${cleaned.slice(-4)}`;
}

function formatRolesLabel(value: string) {
    const roles = value
        .split(",")
        .map((role) => role.trim())
        .filter(Boolean);
    if (roles.length === 0) return "employee";
    return roles.join(", ");
}

function getDocumentSummary(doc: DocumentRecord) {
    const description = toTrimmed(doc.description);
    if (description) return description;
    const mimeType = toTrimmed(doc.mime_type);
    if (mimeType) return `File type: ${mimeType}`;
    const filePath = toTrimmed(doc.file_path);
    if (filePath) return summarizePath(filePath);
    return "No description available";
}

function formatFileSize(size?: number | string) {
    if (typeof size === "string") {
        const trimmed = size.trim();
        return trimmed || "-";
    }
    if (typeof size !== "number" || Number.isNaN(size) || size <= 0) return "-";
    if (size < 1024) return `${size} B`;
    const kb = size / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(1)} GB`;
}

type Props = {
    documents: DocumentRecord[];
    categoryMap?: Record<string, string>;
    roleLabel?: string;
    userId?: string | null;
    canDelete?: boolean;
    deleteEndpointBase?: string;
    onDeleteSuccess?: (message: string) => void;
};

type IndexedDocument = DocumentRecord & {
    searchText: string;
};

const READ_IDS_STORAGE_KEY = "employee_documents_read_ids";

export function EmployeeDocumentsClient({
    documents,
    categoryMap,
    roleLabel,
    userId,
    canDelete = false,
    deleteEndpointBase = "/api/hr/documents",
    onDeleteSuccess,
}: Props) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const deferredQuery = useDeferredValue(query);
    const [statusFilter, setStatusFilter] = useState<"all" | "read" | "unread">("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [readIds, setReadIds] = useState<Set<string>>(new Set());
    const [busyId, setBusyId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedTitles, setExpandedTitles] = useState<Set<string>>(new Set());
    const [hasHydrated, setHasHydrated] = useState(false);

    const storageKey = useMemo(
        () => (userId ? `${READ_IDS_STORAGE_KEY}__${userId}` : READ_IDS_STORAGE_KEY),
        [userId],
    );

    const isDocumentRead = useCallback(
        (doc: DocumentRecord) => Boolean(doc.is_read) || (doc.id ? readIds.has(doc.id) : false),
        [readIds],
    );

    useEffect(() => {
        setHasHydrated(false);
        try {
            const raw = window.localStorage.getItem(storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    const ids = parsed.filter((value) => typeof value === "string" && value.trim() !== "");
                    setReadIds(new Set(ids));
                } else {
                    setReadIds(new Set());
                }
            } else {
                setReadIds(new Set());
            }
        } catch {
            setReadIds(new Set());
        } finally {
            setHasHydrated(true);
        }
    }, [storageKey]);

    useEffect(() => {
        if (!hasHydrated) return;
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(Array.from(readIds)));
        } catch {
            // Ignore storage errors
        }
    }, [readIds, hasHydrated, storageKey]);

    const indexedDocuments = useMemo<IndexedDocument[]>(
        () =>
            documents.map((doc) => ({
                ...doc,
                searchText: `${doc.title} ${doc.description ?? ""} ${doc.file_name ?? ""} ${doc.file_path ?? ""} ${doc.mime_type ?? ""} ${categoryMap?.[doc.category_id] ?? ""} ${doc.category_id} ${doc.roles} ${doc.uploaded_by ?? ""}`.toLowerCase(),
            })),
        [documents, categoryMap],
    );

    const filteredDocuments = useMemo(() => {
        const q = deferredQuery.trim().toLowerCase();
        let next = indexedDocuments;
        if (q) {
            next = next.filter((doc) => doc.searchText.includes(q));
        }
        if (categoryFilter !== "all") {
            next = next.filter((doc) => doc.category_id === categoryFilter);
        }
        if (statusFilter !== "all") {
            next = next.filter((doc) => {
                const isRead = isDocumentRead(doc);
                return statusFilter === "read" ? isRead : !isRead;
            });
        }
        return next;
    }, [indexedDocuments, deferredQuery, categoryFilter, statusFilter, isDocumentRead]);

    const categories = useMemo(() => {
        if (categoryMap && Object.keys(categoryMap).length > 0) {
            return Object.entries(categoryMap)
                .map(([id, name]) => ({
                    id,
                    label: name || formatIdLabel(id),
                    title: name && name !== id ? `${name} (${id})` : id,
                }))
                .sort((a, b) => a.label.localeCompare(b.label));
        }

        const unique = new Set(documents.map((doc) => doc.category_id).filter(Boolean));
        return Array.from(unique).map((id) => ({
            id,
            label: formatIdLabel(id),
            title: id,
        }));
    }, [documents, categoryMap]);

    const stats = useMemo(() => {
        const totalDocuments = documents.length;
        const readCount = documents.filter((doc) => isDocumentRead(doc)).length;
        const unreadCount = Math.max(totalDocuments - readCount, 0);

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
                label: "Read",
                value: readCount,
                tone: "text-emerald-600",
                iconBg: "bg-emerald-50",
                iconColor: "text-emerald-500",
                icon: DocumentIcon,
            },
            {
                label: "Unread",
                value: unreadCount,
                tone: "text-amber-500",
                iconBg: "bg-amber-50",
                iconColor: "text-amber-500",
                icon: AlertTriangleIcon,
            },
        ];
    }, [documents, isDocumentRead]);

    async function handleMarkRead(id: string) {
        if (!id) {
            setError("Document id is missing.");
            return;
        }
        setBusyId(id);
        setError(null);
        try {
            const res = await fetch(`/api/employee/documents/${id}/read`, { method: "POST" });
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

    function handleReadAndView(doc: DocumentRecord) {
        if (!doc.id) {
            setError("Document id is missing.");
            return;
        }
        if (!isDocumentRead(doc)) {
            void handleMarkRead(doc.id);
        }

        window.open(`/api/employee/documents/${doc.id}/view`, "_blank", "noopener,noreferrer");
    }

    async function handleDelete(doc: DocumentRecord) {
        if (!canDelete) return;
        if (!doc.id) {
            setError("Document id is missing.");
            return;
        }

        const confirmed = window.confirm(`Delete document "${doc.title || "Untitled document"}"?`);
        if (!confirmed) return;

        setDeletingId(doc.id);
        setError(null);
        try {
            const response = await fetch(`${deleteEndpointBase}?id=${encodeURIComponent(doc.id)}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const raw = await response.text().catch(() => "");
                let message = `Unable to delete document (HTTP ${response.status})`;
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
                next.delete(doc.id);
                return next;
            });
            onDeleteSuccess?.("Document deleted successfully.");
            router.refresh();
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : "Unable to delete document.");
        } finally {
            setDeletingId(null);
        }
    }

    function toggleTitle(id: string) {
        setExpandedTitles((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
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
                    <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-600">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as "all" | "read" | "unread")}
                            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm outline-none focus:border-blue-500"
                        >
                            <option value="all">All status</option>
                            <option value="read">Read</option>
                            <option value="unread">Unread</option>
                        </select>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm outline-none focus:border-blue-500"
                        >
                            <option value="all">All categories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id} title={category.title}>
                                    {category.label}
                                </option>
                            ))}
                        </select>
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
                        const isRead = isDocumentRead(doc);
                        const docRoleLabel = formatRolesLabel(doc.roles);
                        const categoryName = categoryMap?.[doc.category_id];
                        const categoryLabel = categoryName || formatIdLabel(doc.category_id);
                        const categoryTitle =
                            categoryName && categoryName !== doc.category_id
                                ? `${categoryName} (${doc.category_id})`
                                : doc.category_id || "-";
                        const summary = getDocumentSummary(doc);
                        const titleText = doc.title || "Untitled document";
                        const isTitleLong = titleText.length > 60;
                        const isTitleExpanded = Boolean(doc.id && expandedTitles.has(doc.id));
                        const displayRoleLabel = roleLabel ?? docRoleLabel;
                        return (
                            <article key={doc.id} className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 shrink-0">
                                        <DocumentIcon className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <h3
                                                    className={`min-w-0 text-lg font-semibold text-slate-900 ${
                                                        isTitleExpanded ? "break-words" : "truncate whitespace-nowrap"
                                                    }`}
                                                    title={titleText}
                                                >
                                                    {titleText}
                                                </h3>
                                                {isTitleLong && doc.id ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleTitle(doc.id)}
                                                        className="rounded-full px-2 text-sm font-bold text-slate-500 hover:text-blue-600"
                                                        aria-expanded={isTitleExpanded}
                                                        aria-label={isTitleExpanded ? "See less" : "See more"}
                                                        title={isTitleExpanded ? "See less" : "See more"}
                                                    >
                                                        ...
                                                    </button>
                                                ) : null}
                                            </div>
                                            <span
                                                className="inline-flex max-w-[16rem] items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 truncate"
                                                title={displayRoleLabel}
                                            >
                                                {displayRoleLabel}
                                            </span>
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${isRead ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                                                {isRead ? "Read" : "Unread"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto space-y-3 pt-2">
                                    <p className="text-sm text-slate-600 break-words">{summary}</p>
                                    <div className="grid gap-3 text-xs font-semibold text-slate-500 sm:grid-cols-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400">Category</span>
                                                <span className="truncate" title={categoryTitle}>
                                                    {categoryLabel}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400">Created</span>
                                                <span className="truncate" title={doc.created_at || "-"}>
                                                    {formatDate(doc.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400">Size</span>
                                                <span className="truncate">{formatFileSize(doc.file_size)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleReadAndView(doc)}
                                        disabled={busyId === doc.id || deletingId === doc.id}
                                        className="flex-1 rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                                    >
                                        {busyId === doc.id ? "Opening..." : "Read"}
                                    </button>
                                    {canDelete ? (
                                        <button
                                            type="button"
                                            onClick={() => void handleDelete(doc)}
                                            disabled={deletingId === doc.id || busyId === doc.id}
                                            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm font-semibold text-rose-700 shadow-sm hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                                        >
                                            {deletingId === doc.id ? "Deleting..." : "Delete"}
                                        </button>
                                    ) : null}
                                    <a
                                        href={`/api/employee/documents/${doc.id}/download`}
                                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:border-blue-200"
                                        title="Download"
                                    >
                                        <DownloadIcon className="h-5 w-5" />
                                    </a>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </>
    );
}
