import { headers } from "next/headers";
import { EmployeeDocumentsClient } from "@/components/documents/EmployeeDocumentsClient";
import { EmployeeSideNav } from "@/components/layout/navigation/EmployeeSideNav";
import type { DocumentApiItem, DocumentsApiResponse } from "@/types/document";
import { normalizeDocument } from "@/types/document";

type LoadResult = {
    documents: ReturnType<typeof normalizeDocument>[];
    error: string | null;
};

type CategoryApiItem = {
    id?: string;
    name?: string;
    ID?: string;
    Name?: string;
};

type CategoriesApiResponse =
    | CategoryApiItem[]
    | {
        data?: CategoryApiItem[];
        body?: CategoryApiItem[] | { data?: CategoryApiItem[] };
    };

type CategoryMap = Record<string, string>;

function asText(value: unknown) {
    return typeof value === "string" ? value : "";
}

function normalizeCategory(item: CategoryApiItem) {
    const id = asText(item.id ?? item.ID);
    const name = asText(item.name ?? item.Name);
    return { id, name };
}

async function fetchDocuments(): Promise<LoadResult> {
    const headerStore = await headers();
    const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
    const protocol = headerStore.get("x-forwarded-proto") ?? "http";
    const baseUrl = host
        ? `${protocol}://${host}`
        : process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
    const cookieHeader = headerStore.get("cookie") ?? "";

    const url = new URL("/api/employee/documents", baseUrl).toString();
    const res = await fetch(url, {
        next: { revalidate: 3600 },
        headers: {
            accept: "application/json, application/problem+json",
            cookie: cookieHeader,
        },
    });

    if (!res.ok) {
        const raw = await res.text().catch(() => "");
        let message = `Unable to load documents (HTTP ${res.status})`;
        if (raw) {
            try {
                const parsed = JSON.parse(raw) as { message?: string; detail?: string; title?: string; error?: string };
                message = parsed.message || parsed.detail || parsed.title || parsed.error || message;
            } catch {
                message = raw.slice(0, 200);
            }
        }
        return { documents: [], error: message };
    }

    const payload = (await res.json()) as DocumentsApiResponse;
    let items: DocumentApiItem[] = [];
    if (Array.isArray(payload)) {
        items = payload;
    } else if (Array.isArray(payload?.data)) {
        items = payload.data;
    } else if (Array.isArray(payload?.body)) {
        items = payload.body as DocumentApiItem[];
    } else if (Array.isArray(payload?.body?.data)) {
        items = payload.body.data as DocumentApiItem[];
    }

    return { documents: items.map(normalizeDocument), error: null };
}

async function fetchCategories(): Promise<CategoryMap> {
    const headerStore = await headers();
    const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
    const protocol = headerStore.get("x-forwarded-proto") ?? "http";
    const baseUrl = host
        ? `${protocol}://${host}`
        : process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
    const cookieHeader = headerStore.get("cookie") ?? "";

    const url = new URL("/api/employee/documents/categories", baseUrl).toString();
    const res = await fetch(url, {
        cache: "no-store",
        headers: {
            accept: "application/json, application/problem+json",
            cookie: cookieHeader,
        },
    });

    if (!res.ok) {
        return {};
    }

    const payload = (await res.json()) as CategoriesApiResponse;
    let items: CategoryApiItem[] = [];
    if (Array.isArray(payload)) {
        items = payload;
    } else if (Array.isArray(payload?.data)) {
        items = payload.data;
    } else if (Array.isArray(payload?.body)) {
        items = payload.body as CategoryApiItem[];
    } else if (Array.isArray(payload?.body?.data)) {
        items = payload.body.data as CategoryApiItem[];
    }

    const categoryMap: CategoryMap = {};
    for (const item of items) {
        const { id, name } = normalizeCategory(item);
        if (id) {
            categoryMap[id] = name || id;
        }
    }

    return categoryMap;
}

export default async function DocumentsPage() {
    const [{ documents, error }, categoryMap] = await Promise.all([fetchDocuments(), fetchCategories()]);

    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8">
                <EmployeeSideNav />

                <section className="flex-1 space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold">Documents</h1>
                        <p className="text-sm text-slate-500">Quick access to company policies and shared files.</p>
                    </div>

                    {error ? (
                        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {error}
                        </div>
                    ) : null}

                    <EmployeeDocumentsClient documents={documents} categoryMap={categoryMap} />
                </section>
            </div>
        </main>
    );
}
