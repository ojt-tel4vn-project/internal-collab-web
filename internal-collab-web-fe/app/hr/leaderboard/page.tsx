"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { logErrorToConsole, toUserFriendlyError } from "@/lib/api/errors";
import {
    buildLeaderboardSearchParams,
    getErrorMessage,
    getTimeFilterMeta,
    isAbortError,
    LeaderboardResponse,
    normalizeLeaderboard,
    normalizeStickerTypes,
    readDepartmentsCached,
    StickerTypesResponse,
} from "@/app/employee/leaderboard/data";
import { LeaderboardOverview } from "@/components/leaderboard/LeaderboardOverview";
import { LeaderboardResults } from "@/components/leaderboard/LeaderboardResults";
import type {
    DepartmentOption,
    LeaderboardEntry,
    LeaderboardFilters,
    StickerTypeOption,
} from "@/types/employee";

const DEFAULT_LEADERBOARD_LIMIT = 10;

type RemoteState<T> = {
    data: T;
    error: string | null;
    loading: boolean;
};

type AddStickerFormState = {
    category: string;
    description: string;
    displayOrder: string;
    iconFile: File | null;
    name: string;
    pointCost: string;
};

type AddStickerState = {
    error: string | null;
    loading: boolean;
    success: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    return value as Record<string, unknown>;
}

function asText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function parseSuccessMessage(payload: unknown, fallback: string): string {
    const root = asRecord(payload);
    const body = asRecord(root?.body);
    const data = asRecord(root?.data);

    return asText(body?.message) || asText(data?.message) || asText(root?.message) || fallback;
}

async function readLeaderboard(filters: LeaderboardFilters, signal?: AbortSignal) {
    const params = buildLeaderboardSearchParams(filters);
    const response = await fetch(`/api/employee/stickers/leaderboard?${params.toString()}`, {
        cache: "no-store",
        signal,
    });

    if (!response.ok) {
        const raw = await response.text().catch(() => "");
        throw new Error(getErrorMessage(raw, "Unable to load leaderboard."));
    }

    return normalizeLeaderboard((await response.json()) as LeaderboardResponse);
}

async function readStickerTypes(signal?: AbortSignal) {
    const response = await fetch("/api/hr/stickers/types", {
        cache: "no-store",
        signal,
    });

    if (!response.ok) {
        const raw = await response.text().catch(() => "");
        throw new Error(getErrorMessage(raw, "Unable to load sticker pool."));
    }

    return normalizeStickerTypes((await response.json()) as StickerTypesResponse);
}

async function createStickerType(input: {
    category: string;
    description: string;
    displayOrder: number;
    iconFile: File;
    name: string;
    pointCost: number;
}) {
    const formData = new FormData();
    formData.set("name", input.name);
    formData.set("point_cost", String(input.pointCost));
    formData.set("icon", input.iconFile);

    if (input.description) {
        formData.set("description", input.description);
    }

    if (input.category) {
        formData.set("category", input.category);
    }

    if (input.displayOrder >= 0) {
        formData.set("display_order", String(input.displayOrder));
    }

    const response = await fetch("/api/hr/stickers/types", {
        method: "POST",
        body: formData,
    });

    const raw = await response.text().catch(() => "");

    if (!response.ok) {
        throw new Error(getErrorMessage(raw, "Unable to add sticker type."));
    }

    let payload: unknown = null;
    if (raw) {
        try {
            payload = JSON.parse(raw) as unknown;
        } catch {
            payload = null;
        }
    }

    return parseSuccessMessage(payload, "Sticker type added to pool.");
}

function getLeaderboardError(error: unknown) {
    return toUserFriendlyError(error, "We couldn't load the leaderboard right now.");
}

function getDepartmentError(error: unknown) {
    return toUserFriendlyError(error, "We couldn't load the department list right now.");
}

function getStickerPoolError(error: unknown) {
    return toUserFriendlyError(error, "We couldn't load the sticker pool right now.");
}

export default function HrLeaderboardPage() {
    const iconInputRef = useRef<HTMLInputElement | null>(null);
    const [departmentsState, setDepartmentsState] = useState<{
        data: DepartmentOption[];
        error: string | null;
    }>({
        data: [],
        error: null,
    });
    const [filters, setFilters] = useState<LeaderboardFilters>({
        departmentId: "all",
        limit: DEFAULT_LEADERBOARD_LIMIT,
        timeFilter: "month",
    });
    const [leaderboardState, setLeaderboardState] = useState<RemoteState<LeaderboardEntry[]>>({
        data: [],
        error: null,
        loading: true,
    });
    const [stickerTypesState, setStickerTypesState] = useState<RemoteState<StickerTypeOption[]>>({
        data: [],
        error: null,
        loading: true,
    });
    const [addForm, setAddForm] = useState<AddStickerFormState>({
        category: "Recognition",
        description: "",
        displayOrder: "0",
        iconFile: null,
        name: "",
        pointCost: "1",
    });
    const [iconInputResetKey, setIconInputResetKey] = useState(0);
    const [addState, setAddState] = useState<AddStickerState>({
        error: null,
        loading: false,
        success: null,
    });

    useEffect(() => {
        let cancelled = false;
        const stickersController = new AbortController();

        void readDepartmentsCached()
            .then((departments) => {
                if (cancelled) {
                    return;
                }

                setDepartmentsState({
                    data: departments,
                    error: null,
                });
                setFilters((current) => {
                    const stillExists =
                        current.departmentId === "all" ||
                        departments.some((item) => item.id === current.departmentId);

                    return stillExists ? current : { ...current, departmentId: "all" };
                });
            })
            .catch((error) => {
                if (cancelled || isAbortError(error)) {
                    return;
                }

                logErrorToConsole("HrLeaderboard.readDepartmentsCached", error);
                setDepartmentsState({
                    data: [],
                    error: getDepartmentError(error),
                });
                setFilters((current) =>
                    current.departmentId === "all" ? current : { ...current, departmentId: "all" },
                );
            });

        void readStickerTypes(stickersController.signal)
            .then((stickerTypes) => {
                if (cancelled) {
                    return;
                }

                setStickerTypesState({
                    data: stickerTypes,
                    error: null,
                    loading: false,
                });
            })
            .catch((error) => {
                if (cancelled || isAbortError(error)) {
                    return;
                }

                logErrorToConsole("HrLeaderboard.readStickerTypes", error);
                setStickerTypesState({
                    data: [],
                    error: getStickerPoolError(error),
                    loading: false,
                });
            });

        return () => {
            cancelled = true;
            stickersController.abort();
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();

        void readLeaderboard(filters, controller.signal)
            .then((entries) => {
                if (cancelled) {
                    return;
                }

                setLeaderboardState({
                    data: entries,
                    error: null,
                    loading: false,
                });
            })
            .catch((error) => {
                if (cancelled || isAbortError(error)) {
                    return;
                }

                logErrorToConsole("HrLeaderboard.readLeaderboard", error, { filters });
                setLeaderboardState({
                    data: [],
                    error: getLeaderboardError(error),
                    loading: false,
                });
            });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [filters]);

    const filterMeta = getTimeFilterMeta(filters.timeFilter);
    const rankedEntries = useMemo(
        () =>
            [...leaderboardState.data].sort(
                (left, right) => right.total - left.total || left.fullName.localeCompare(right.fullName),
            ),
        [leaderboardState.data],
    );
    const topThree = rankedEntries.slice(0, 3);
    const selectedDepartment =
        filters.departmentId === "all"
            ? "All Departments"
            : departmentsState.data.find((department) => department.id === filters.departmentId)?.name ??
              "Selected Department";

    async function reloadStickerTypes() {
        setStickerTypesState((current) => ({
            ...current,
            error: null,
            loading: true,
        }));

        try {
            const stickerTypes = await readStickerTypes();
            setStickerTypesState({
                data: stickerTypes,
                error: null,
                loading: false,
            });
        } catch (error) {
            if (isAbortError(error)) {
                return;
            }

            setStickerTypesState({
                data: [],
                error: getStickerPoolError(error),
                loading: false,
            });
        }
    }

    async function handleAddSticker(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (addState.loading) {
            return;
        }

        const name = addForm.name.trim();
        const description = addForm.description.trim();
        const category = addForm.category.trim() || "Recognition";
        const iconFile = addForm.iconFile;
        const pointCost = Number(addForm.pointCost);
        const displayOrder = Number(addForm.displayOrder);

        if (!name) {
            setAddState({
                error: "Sticker name is required.",
                loading: false,
                success: null,
            });
            return;
        }

        if (!Number.isFinite(pointCost) || pointCost < 0) {
            setAddState({
                error: "Point cost must be a non-negative number.",
                loading: false,
                success: null,
            });
            return;
        }

        if (!Number.isFinite(displayOrder) || displayOrder < 0) {
            setAddState({
                error: "Display order must be a non-negative number.",
                loading: false,
                success: null,
            });
            return;
        }

        if (!(iconFile instanceof File) || iconFile.size <= 0) {
            setAddState({
                error: "Please upload an icon file.",
                loading: false,
                success: null,
            });
            return;
        }

        setAddState({
            error: null,
            loading: true,
            success: null,
        });

        try {
            const successMessage = await createStickerType({
                category,
                description,
                displayOrder: Math.trunc(displayOrder),
                iconFile,
                name,
                pointCost,
            });

            setAddState({
                error: null,
                loading: false,
                success: successMessage,
            });
            setAddForm((current) => ({
                ...current,
                description: "",
                iconFile: null,
                name: "",
                pointCost: "1",
            }));
            setIconInputResetKey((current) => current + 1);

            await reloadStickerTypes();
        } catch (error) {
            logErrorToConsole("HrLeaderboard.handleAddStickerType", error, { name: addForm.name.trim() });
            setAddState({
                error: toUserFriendlyError(error, "We couldn't add the sticker type right now."),
                loading: false,
                success: null,
            });
        }
    }

    return (
        <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)] xl:items-start">
            <aside className="space-y-6">
                <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4">
                                <h2 className="text-lg font-bold text-slate-900">Sticker Pool</h2>
                                <p className="mt-1 text-xs text-slate-500">Add new sticker types for employees to use.</p>
                            </div>

                            <form className="space-y-3" onSubmit={handleAddSticker}>
                                <div className="space-y-2">
                                    <label htmlFor="hr-sticker-name" className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                        Sticker Name
                                    </label>
                                    <input
                                        id="hr-sticker-name"
                                        value={addForm.name}
                                        onChange={(event) =>
                                            setAddForm((current) => ({
                                                ...current,
                                                name: event.target.value,
                                            }))
                                        }
                                        placeholder="Ex: Team Player"
                                        className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label htmlFor="hr-sticker-point-cost" className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                            Point Cost
                                        </label>
                                        <input
                                            id="hr-sticker-point-cost"
                                            type="number"
                                            min={0}
                                            step={1}
                                            value={addForm.pointCost}
                                            onChange={(event) =>
                                                setAddForm((current) => ({
                                                    ...current,
                                                    pointCost: event.target.value,
                                                }))
                                            }
                                            className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="hr-sticker-display-order" className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                            Display Order
                                        </label>
                                        <input
                                            id="hr-sticker-display-order"
                                            type="number"
                                            min={0}
                                            step={1}
                                            value={addForm.displayOrder}
                                            onChange={(event) =>
                                                setAddForm((current) => ({
                                                    ...current,
                                                    displayOrder: event.target.value,
                                                }))
                                            }
                                            className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="hr-sticker-category" className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                        Category
                                    </label>
                                    <input
                                        id="hr-sticker-category"
                                        value={addForm.category}
                                        onChange={(event) =>
                                            setAddForm((current) => ({
                                                ...current,
                                                category: event.target.value,
                                            }))
                                        }
                                        placeholder="Recognition"
                                        className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="hr-sticker-icon" className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                        Icon
                                    </label>
                                    <input
                                        key={iconInputResetKey}
                                        ref={iconInputRef}
                                        id="hr-sticker-icon"
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) =>
                                            setAddForm((current) => ({
                                                ...current,
                                                iconFile: event.target.files?.[0] ?? null,
                                            }))
                                        }
                                        className="sr-only"
                                    />
                                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                                        <button
                                            type="button"
                                            onClick={() => iconInputRef.current?.click()}
                                            className="inline-flex h-8 items-center justify-center rounded-xl bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-800"
                                        >
                                            Choose file
                                        </button>
                                        <span className="truncate text-sm text-slate-600">
                                            {addForm.iconFile ? addForm.iconFile.name : "No file chosen"}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500">PNG/JPG/WebP recommended.</p>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="hr-sticker-description" className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                        Description
                                    </label>
                                    <textarea
                                        id="hr-sticker-description"
                                        value={addForm.description}
                                        onChange={(event) =>
                                            setAddForm((current) => ({
                                                ...current,
                                                description: event.target.value,
                                            }))
                                        }
                                        rows={3}
                                        placeholder="Optional description"
                                        className="w-full resize-none rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                {addState.error ? (
                                    <div className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                                        {addState.error}
                                    </div>
                                ) : null}

                                {addState.success ? (
                                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                                        {addState.success}
                                    </div>
                                ) : null}

                                <button
                                    type="submit"
                                    disabled={addState.loading}
                                    className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                    {addState.loading ? "Adding..." : "Add to Sticker Pool"}
                                </button>
                            </form>

                            <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current Sticker Types</p>
                                    <button
                                        type="button"
                                        onClick={() => void reloadStickerTypes()}
                                        disabled={stickerTypesState.loading}
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400"
                                    >
                                        {stickerTypesState.loading ? "Refreshing..." : "Refresh"}
                                    </button>
                                </div>

                                {stickerTypesState.error ? (
                                    <p className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                                        {stickerTypesState.error}
                                    </p>
                                ) : null}

                                {stickerTypesState.loading && stickerTypesState.data.length === 0 ? (
                                    <div className="space-y-2">
                                        {Array.from({ length: 3 }, (_, index) => (
                                            <div key={`hr-sticker-skeleton-${index}`} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                                        ))}
                                    </div>
                                ) : stickerTypesState.data.length === 0 ? (
                                    <p className="text-xs text-slate-500">No sticker types found.</p>
                                ) : (
                                    <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                                        {stickerTypesState.data.map((item) => {
                                            const hasIcon = Boolean(item.iconUrl);

                                            return (
                                                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${
                                                                hasIcon ? "bg-slate-100 text-transparent" : "bg-white text-slate-600"
                                                            }`}
                                                            style={
                                                                hasIcon
                                                                    ? {
                                                                          backgroundImage: `url("${item.iconUrl}")`,
                                                                          backgroundPosition: "center",
                                                                          backgroundSize: "cover",
                                                                      }
                                                                    : undefined
                                                            }
                                                            aria-hidden="true"
                                                        >
                                                            {hasIcon ? "." : item.name.slice(0, 1).toUpperCase()}
                                                        </span>

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <p className="truncate text-sm font-semibold text-slate-800">{item.name}</p>
                                                                <span className="text-xs font-semibold text-blue-600">{item.pointCost} pt</span>
                                                            </div>
                                                            <p className="mt-1 text-[11px] text-slate-500">
                                                                {item.category || "General"} | Order {item.displayOrder}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                </section>
            </aside>

            <section className="min-w-0 space-y-6">
                    <LeaderboardOverview
                        departmentId={filters.departmentId}
                        departments={departmentsState.data}
                        departmentsError={departmentsState.error}
                        filterLabel={filterMeta.label}
                        filterSummary={filterMeta.summary}
                        onDepartmentChange={(departmentId) => {
                            if (filters.departmentId === departmentId) {
                                return;
                            }

                            setLeaderboardState((current) => ({
                                ...current,
                                error: null,
                                loading: true,
                            }));
                            setFilters((current) => ({
                                ...current,
                                departmentId,
                            }));
                        }}
                        onTimeFilterChange={(timeFilter) => {
                            if (filters.timeFilter === timeFilter) {
                                return;
                            }

                            setLeaderboardState((current) => ({
                                ...current,
                                error: null,
                                loading: true,
                            }));
                            setFilters((current) => ({
                                ...current,
                                timeFilter,
                            }));
                        }}
                        selectedDepartment={selectedDepartment}
                        selectedTimeFilter={filters.timeFilter}
                        visibleRanks={rankedEntries.length}
                    />

                    <LeaderboardResults
                        currentEmployeeId=""
                        error={leaderboardState.error}
                        loading={leaderboardState.loading}
                        normalizedReceiverId=""
                        normalizedReceiverName=""
                        onReceiverPick={() => {}}
                        rankedEntries={rankedEntries}
                        topThree={topThree}
                    />
            </section>
        </div>
    );
}

