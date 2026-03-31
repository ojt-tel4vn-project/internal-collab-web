"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EmployeeDocumentsClient } from "@/components/documents/EmployeeDocumentsClient";
import type { DocumentRecord } from "@/types/document";

type Props = {
    documents: DocumentRecord[];
    categoryMap?: Record<string, string>;
    userId?: string | null;
};

type CategoryOption = {
    id: string;
    label: string;
    title: string;
};

type ErrorPayload = {
    message?: string;
    detail?: string;
    title?: string;
    error?: string;
};

const ROLE_OPTIONS = [
    { value: "employee", label: "Employee" },
    { value: "manager", label: "Manager" },
    { value: "hr", label: "HR" },
    { value: "admin", label: "Admin" },
] as const;

const FILE_ACCEPT = ".pdf,.png,.jpg,.jpeg,.doc,.docx";
const SUCCESS_STORAGE_KEY = "hr_documents_success_message";

function formatIdLabel(value: string) {
    const cleaned = value.trim();
    if (!cleaned) return "-";
    if (cleaned.length <= 12) return cleaned;
    return `${cleaned.slice(0, 8)}...${cleaned.slice(-4)}`;
}

function buildCategoryOptions(documents: DocumentRecord[], categoryMap?: Record<string, string>): CategoryOption[] {
    if (categoryMap && Object.keys(categoryMap).length > 0) {
        return Object.entries(categoryMap)
            .map(([id, name]) => ({
                id,
                label: name || formatIdLabel(id),
                title: name && name !== id ? `${name} (${id})` : id,
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }

    const unique = new Set(
        documents.map((doc) => doc.category_id).filter((id): id is string => typeof id === "string" && id.trim() !== ""),
    );

    return Array.from(unique).map((id) => ({
        id,
        label: formatIdLabel(id),
        title: id,
    }));
}

function extractErrorMessage(raw: string, fallback: string) {
    if (!raw) return fallback;
    try {
        const parsed = JSON.parse(raw) as ErrorPayload;
        return parsed.message || parsed.detail || parsed.title || parsed.error || fallback;
    } catch {
        return raw.slice(0, 200) || fallback;
    }
}

export function HRDocumentsClient({ documents, categoryMap, userId }: Props) {
    const router = useRouter();
    const categoryOptions = useMemo(
        () => buildCategoryOptions(documents, categoryMap),
        [documents, categoryMap],
    );

    const [showUploadForm, setShowUploadForm] = useState(false);
    const [categoryId, setCategoryId] = useState("");
    const [selectedRoles, setSelectedRoles] = useState<string[]>(["employee"]);
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [fileInputKey, setFileInputKey] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        try {
            const persisted = window.sessionStorage.getItem(SUCCESS_STORAGE_KEY);
            if (persisted) {
                setSuccess(persisted);
                window.sessionStorage.removeItem(SUCCESS_STORAGE_KEY);
            }
        } catch {
            // Ignore storage read errors
        }
    }, []);

    useEffect(() => {
        if (categoryOptions.length === 0) {
            setCategoryId("");
            return;
        }

        if (!categoryId || !categoryOptions.some((option) => option.id === categoryId)) {
            setCategoryId(categoryOptions[0].id);
        }
    }, [categoryOptions, categoryId]);

    function resetForm() {
        setSelectedRoles(["employee"]);
        setDescription("");
        setFile(null);
        setFileInputKey((prev) => prev + 1);
        setCategoryId(categoryOptions[0]?.id ?? "");
    }

    function showSuccess(message: string) {
        setSuccess(message);
        try {
            window.sessionStorage.setItem(SUCCESS_STORAGE_KEY, message);
        } catch {
            // Ignore storage write errors
        }
    }

    function toggleRole(role: string) {
        setSelectedRoles((prev) => {
            if (prev.includes(role)) {
                if (prev.length === 1) {
                    return prev;
                }
                return prev.filter((item) => item !== role);
            }
            return [...prev, role];
        });
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        if (!file) {
            setError("Please choose a file to upload.");
            return;
        }

        if (!categoryId) {
            setError("Please choose a category.");
            return;
        }

        if (selectedRoles.length === 0) {
            setError("Select at least one role.");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("category_id", categoryId);
            formData.append("roles", selectedRoles.join(","));
            if (description.trim()) {
                formData.append("description", description.trim());
            }

            const response = await fetch("/api/hr/documents", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const raw = await response.text().catch(() => "");
                const fallback = `Unable to upload document (HTTP ${response.status})`;
                throw new Error(extractErrorMessage(raw, fallback));
            }

            resetForm();
            setShowUploadForm(false);
            showSuccess("Document uploaded successfully.");
            router.refresh();
        } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : "Unable to upload document.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Upload Document</h2>
                        <p className="text-sm text-slate-500">HR can upload and assign access roles for each document.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowUploadForm((prev) => !prev)}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                    >
                        {showUploadForm ? "Hide Upload Form" : "Upload Document"}
                    </button>
                </div>

                {showUploadForm ? (
                    <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm font-semibold text-slate-700">
                            <span>File</span>
                            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                                <label
                                    htmlFor="hr-document-upload"
                                    className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                                >
                                    Choose file
                                </label>
                                <span className="truncate text-sm font-medium text-slate-600">
                                    {file ? file.name : "No file chosen"}
                                </span>
                                <input
                                    key={fileInputKey}
                                    id="hr-document-upload"
                                    type="file"
                                    accept={FILE_ACCEPT}
                                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                                    className="sr-only"
                                />
                            </div>
                            <span className="block text-xs font-medium text-slate-500">Allowed: PDF, PNG, JPG, DOC, DOCX</span>
                        </label>

                        <label className="space-y-2 text-sm font-semibold text-slate-700">
                            <span>Category</span>
                            <select
                                value={categoryId}
                                onChange={(event) => setCategoryId(event.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
                            >
                                {categoryOptions.length === 0 ? (
                                    <option value="">No category available</option>
                                ) : (
                                    categoryOptions.map((option) => (
                                        <option key={option.id} value={option.id} title={option.title}>
                                            {option.label}
                                        </option>
                                    ))
                                )}
                            </select>
                        </label>

                        <fieldset className="space-y-2 md:col-span-2">
                            <legend className="text-sm font-semibold text-slate-700">Visible for roles</legend>
                            <div className="flex flex-wrap gap-2">
                                {ROLE_OPTIONS.map((option) => {
                                    const checked = selectedRoles.includes(option.value);
                                    return (
                                        <label
                                            key={option.value}
                                            className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                                                checked
                                                    ? "border-blue-200 bg-blue-50 text-blue-700"
                                                    : "border-slate-200 bg-white text-slate-600"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 accent-blue-600"
                                                checked={checked}
                                                onChange={() => toggleRole(option.value)}
                                            />
                                            {option.label}
                                        </label>
                                    );
                                })}
                            </div>
                        </fieldset>

                        <label className="space-y-2 text-sm font-semibold text-slate-700 md:col-span-2">
                            <span>Description (optional)</span>
                            <textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                rows={3}
                                placeholder="Short context for the uploaded file"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
                            />
                        </label>

                        <div className="flex flex-wrap gap-3 md:col-span-2">
                            <button
                                type="submit"
                                disabled={isSubmitting || categoryOptions.length === 0}
                                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                            >
                                {isSubmitting ? "Uploading..." : "Upload"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    resetForm();
                                    setError(null);
                                    setSuccess(null);
                                }}
                                disabled={isSubmitting}
                                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed"
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                ) : null}
            </section>

            {error ? (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            ) : null}

            {success ? (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {success}
                </div>
            ) : null}

            <EmployeeDocumentsClient
                documents={documents}
                categoryMap={categoryMap}
                roleLabel="HR"
                userId={userId}
                canDelete
                showRoleFilter
                deleteEndpointBase="/api/hr/documents"
                onDeleteSuccess={(message) => {
                    setError(null);
                    showSuccess(message);
                }}
            />
        </div>
    );
}
