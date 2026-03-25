"use client";

import { FormEvent, useDeferredValue, useEffect, useMemo, useState } from "react";
import { LeaderboardOverview } from "@/components/leaderboard/LeaderboardOverview";
import { LeaderboardResults } from "@/components/leaderboard/LeaderboardResults";
import { PointsBalanceCard } from "@/components/leaderboard/PointsBalanceCard";
import { SendStickerCard } from "@/components/leaderboard/SendStickerCard";
import type {
    DepartmentOption,
    LeaderboardEntry,
    LeaderboardFilters,
    PointBalanceData,
    StickerTypeOption,
} from "@/types/employee";
import {
    DepartmentsResponse,
    buildLeaderboardSearchParams,
    getErrorMessage,
    getTimeFilterMeta,
    isAbortError,
    LeaderboardResponse,
    normalizeDepartments,
    normalizeLeaderboard,
    normalizePointBalance,
    normalizeStickerTypes,
    PointBalanceResponse,
    StickerTypesResponse,
} from "./data";

const DEFAULT_LEADERBOARD_LIMIT = 10;
const DEFAULT_RECEIVER_LIMIT = 50;
const LAST_STICKER_TYPE_STORAGE_KEY = "employee.lastStickerTypeId";

type RemoteState<T> = {
    data: T;
    error: string | null;
    loading: boolean;
};

type SendFormState = {
    message: string;
    receiverId: string;
    receiverName: string;
    stickerTypeId: string;
};

type SendState = {
    error: string | null;
    loading: boolean;
    success: string | null;
};

async function readPointBalance(signal?: AbortSignal) {
    const response = await fetch("/api/employee/stickers/balance", {
        cache: "no-store",
        signal,
    });

    if (!response.ok) {
        const raw = await response.text().catch(() => "");
        throw new Error(getErrorMessage(raw, "Unable to load point balance."));
    }

    return normalizePointBalance((await response.json()) as PointBalanceResponse);
}

async function readDepartments(signal?: AbortSignal) {
    const response = await fetch("/api/employee?view=departments", {
        cache: "no-store",
        signal,
    });

    if (!response.ok) {
        const raw = await response.text().catch(() => "");
        throw new Error(getErrorMessage(raw, "Department filter is temporarily unavailable."));
    }

    return normalizeDepartments((await response.json()) as DepartmentsResponse);
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

async function readReceiverSuggestions(signal?: AbortSignal) {
    return readLeaderboard(
        {
            departmentId: "all",
            limit: DEFAULT_RECEIVER_LIMIT,
            timeFilter: "all",
        },
        signal,
    );
}

async function readStickerTypes(signal?: AbortSignal) {
    const response = await fetch("/api/employee/stickers/types", {
        cache: "no-store",
        signal,
    });

    if (!response.ok) {
        const raw = await response.text().catch(() => "");
        throw new Error(getErrorMessage(raw, "Unable to load sticker options."));
    }

    return normalizeStickerTypes((await response.json()) as StickerTypesResponse);
}

async function sendSticker(input: {
    message: string;
    receiverEmail: string;
    receiverEmployeeCode: string;
    stickerTypeId: string;
}) {
    const receiverEmail = input.receiverEmail.trim();
    const receiverEmployeeCode = input.receiverEmployeeCode.trim();
    const stickerTypeId = input.stickerTypeId.trim();

    if (!receiverEmail && !receiverEmployeeCode) {
        throw new Error("Selected receiver does not have email or employee code.");
    }

    const payload: Record<string, string> = {
        message: input.message.trim(),
        sticker_type_id: stickerTypeId,
    };

    if (receiverEmail) {
        payload.receiver_email = receiverEmail;
    } else {
        payload.receiver_employee_code = receiverEmployeeCode;
    }

    const response = await fetch("/api/employee/stickers/send", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const raw = await response.text().catch(() => "");
        throw new Error(getErrorMessage(raw, "Unable to send sticker."));
    }
}

function getBalanceError(error: unknown) {
    return error instanceof Error ? error.message : "Unable to load point balance.";
}

function getLeaderboardError(error: unknown) {
    return error instanceof Error ? error.message : "Unable to load leaderboard.";
}

function getDepartmentError(error: unknown) {
    return error instanceof Error ? error.message : "Department filter is temporarily unavailable.";
}

function getStickerTypeError(error: unknown) {
    return error instanceof Error ? error.message : "Unable to load sticker options.";
}

function getSendAvailabilityLabel(hasAvailablePoints: boolean) {
    return hasAvailablePoints ? "Ready" : "No points";
}

export default function LeaderboardPage() {
    const [balanceState, setBalanceState] = useState<RemoteState<PointBalanceData | null>>({
        data: null,
        error: null,
        loading: true,
    });
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
    const [receiverState, setReceiverState] = useState<RemoteState<LeaderboardEntry[]>>({
        data: [],
        error: null,
        loading: true,
    });
    const [stickerTypesState, setStickerTypesState] = useState<RemoteState<StickerTypeOption[]>>({
        data: [],
        error: null,
        loading: true,
    });
    const [form, setForm] = useState<SendFormState>(() => {
        const savedStickerTypeId =
            typeof window === "undefined" ? "" : window.localStorage.getItem(LAST_STICKER_TYPE_STORAGE_KEY) ?? "";

        return {
            message: "",
            receiverId: "",
            receiverName: "",
            stickerTypeId: savedStickerTypeId,
        };
    });
    const [sendState, setSendState] = useState<SendState>({
        error: null,
        loading: false,
        success: null,
    });
    const [isReceiverMenuOpen, setIsReceiverMenuOpen] = useState(false);
    const persistedStickerTypeId =
        stickerTypesState.data.find((item) => item.id === form.stickerTypeId.trim())?.id ?? "";

    useEffect(() => {
        if (stickerTypesState.loading) {
            return;
        }

        try {
            const nextValue = persistedStickerTypeId;
            if (nextValue) {
                window.localStorage.setItem(LAST_STICKER_TYPE_STORAGE_KEY, nextValue);
                return;
            }

            window.localStorage.removeItem(LAST_STICKER_TYPE_STORAGE_KEY);
        } catch {
            return;
        }
    }, [persistedStickerTypeId, stickerTypesState.loading]);

    useEffect(() => {
        let cancelled = false;
        const balanceController = new AbortController();
        const departmentsController = new AbortController();
        const receiverController = new AbortController();
        const stickerTypesController = new AbortController();

        void readPointBalance(balanceController.signal)
            .then((balance) => {
                if (cancelled) {
                    return;
                }

                setBalanceState({
                    data: balance,
                    error: null,
                    loading: false,
                });
            })
            .catch((error) => {
                if (cancelled || isAbortError(error)) {
                    return;
                }

                setBalanceState({
                    data: null,
                    error: getBalanceError(error),
                    loading: false,
                });
            });

        void readDepartments(departmentsController.signal)
            .then((departments) => {
                if (cancelled) {
                    return;
                }

                setDepartmentsState({
                    data: departments,
                    error: null,
                });
                setFilters((current) => {
                    const stillExists = current.departmentId === "all" || departments.some((item) => item.id === current.departmentId);
                    return stillExists ? current : { ...current, departmentId: "all" };
                });
            })
            .catch((error) => {
                if (cancelled || isAbortError(error)) {
                    return;
                }

                setDepartmentsState({
                    data: [],
                    error: getDepartmentError(error),
                });
                setFilters((current) => (current.departmentId === "all" ? current : { ...current, departmentId: "all" }));
            });

        void readReceiverSuggestions(receiverController.signal)
            .then((entries) => {
                if (cancelled) {
                    return;
                }

                setReceiverState({
                    data: entries,
                    error: null,
                    loading: false,
                });
            })
            .catch((error) => {
                if (cancelled || isAbortError(error)) {
                    return;
                }

                setReceiverState({
                    data: [],
                    error: getLeaderboardError(error),
                    loading: false,
                });
            });

        void readStickerTypes(stickerTypesController.signal)
            .then((types) => {
                if (cancelled) {
                    return;
                }

                setStickerTypesState({
                    data: types,
                    error: null,
                    loading: false,
                });
            })
            .catch((error) => {
                if (cancelled || isAbortError(error)) {
                    return;
                }

                setStickerTypesState({
                    data: [],
                    error: getStickerTypeError(error),
                    loading: false,
                });
            });

        return () => {
            cancelled = true;
            balanceController.abort();
            departmentsController.abort();
            receiverController.abort();
            stickerTypesController.abort();
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
    const currentBalance = balanceState.data?.currentPoints ?? 0;
    const initialBalance = balanceState.data?.initialPoints ?? 0;
    const currentEmployeeId = balanceState.data?.employeeId ?? "";
    const normalizedReceiverId = form.receiverId.trim();
    const normalizedReceiverName = form.receiverName.trim().toLowerCase();
    const deferredReceiverQuery = useDeferredValue(normalizedReceiverName);
    const hasAvailablePoints = currentBalance > 0;
    const balanceProgress =
        balanceState.loading
            ? 0
            : initialBalance > 0
                ? Math.min(Math.max((currentBalance / initialBalance) * 100, 0), 100)
                : currentBalance > 0
                    ? 100
                    : 0;
    const isSelfReceiver = Boolean(currentEmployeeId) && normalizedReceiverId === currentEmployeeId;
    const rankedEntries = useMemo(
        () =>
            [...leaderboardState.data].sort(
                (left, right) => right.total - left.total || left.fullName.localeCompare(right.fullName),
            ),
        [leaderboardState.data],
    );
    const receiverEntries = useMemo(
        () =>
            [...receiverState.data]
                .filter((entry) => entry.employeeId !== currentEmployeeId)
                .sort((left, right) => left.fullName.localeCompare(right.fullName)),
        [currentEmployeeId, receiverState.data],
    );
    const topThree = rankedEntries.slice(0, 3);
    const selectedDepartment =
        filters.departmentId === "all"
            ? "All Departments"
            : departmentsState.data.find((department) => department.id === filters.departmentId)?.name ?? "Selected Department";
    const receiverMatches = useMemo(() => {
        const query = deferredReceiverQuery;
        const filtered = query
            ? receiverEntries.filter((entry) => entry.fullName.trim().toLowerCase().includes(query))
            : receiverEntries;

        return filtered.slice(0, 8);
    }, [deferredReceiverQuery, receiverEntries]);
    const selectedReceiver =
        receiverEntries.find((entry) => entry.employeeId === normalizedReceiverId) ??
        rankedEntries.find((entry) => entry.employeeId === normalizedReceiverId) ??
        null;
    const selectedStickerType =
        stickerTypesState.data.find((item) => item.id === persistedStickerTypeId) ?? null;
    const normalizedStickerTypeId = selectedStickerType?.id ?? "";
    const isReceiverPendingSelection = Boolean(form.receiverName.trim()) && !normalizedReceiverId;
    const canSend = Boolean(normalizedReceiverId) && Boolean(selectedStickerType) && hasAvailablePoints && !isSelfReceiver;

    function updateFormField(field: keyof SendFormState, value: string) {
        setForm((current) => {
            if (field === "receiverName") {
                return {
                    ...current,
                    receiverId: "",
                    receiverName: value,
                };
            }

            return {
                ...current,
                [field]: value,
            };
        });
        setSendState((current) =>
            current.error || current.success
                ? {
                    ...current,
                    error: null,
                    success: null,
                }
                : current,
        );
    }

    function handleReceiverPick(receiverId: string) {
        const selectedEntry =
            receiverEntries.find((entry) => entry.employeeId === receiverId) ??
            rankedEntries.find((entry) => entry.employeeId === receiverId);

        setForm((current) => ({
            ...current,
            receiverId,
            receiverName: selectedEntry?.fullName ?? "",
        }));
        setIsReceiverMenuOpen(false);
        setSendState((current) =>
            current.error || current.success
                ? {
                    ...current,
                    error: null,
                    success: null,
                }
                : current,
        );
    }

    async function refreshAfterSend() {
        setBalanceState((current) => ({
            ...current,
            error: null,
            loading: true,
        }));
        setLeaderboardState((current) => ({
            ...current,
            error: null,
            loading: true,
        }));

        const [balanceResult, leaderboardResult, receiverResult] = await Promise.allSettled([
            readPointBalance(),
            readLeaderboard(filters),
            readReceiverSuggestions(),
        ]);

        if (balanceResult.status === "fulfilled") {
            setBalanceState({
                data: balanceResult.value,
                error: null,
                loading: false,
            });
        } else if (!isAbortError(balanceResult.reason)) {
            setBalanceState((current) => ({
                ...current,
                error: getBalanceError(balanceResult.reason),
                loading: false,
            }));
        }

        if (leaderboardResult.status === "fulfilled") {
            setLeaderboardState({
                data: leaderboardResult.value,
                error: null,
                loading: false,
            });
        } else if (!isAbortError(leaderboardResult.reason)) {
            setLeaderboardState((current) => ({
                ...current,
                error: getLeaderboardError(leaderboardResult.reason),
                loading: false,
            }));
        }

        if (receiverResult.status === "fulfilled") {
            setReceiverState((current) => ({
                ...current,
                data: receiverResult.value,
                error: null,
                loading: false,
            }));
        } else if (!isAbortError(receiverResult.reason)) {
            setReceiverState((current) => ({
                ...current,
                error: getLeaderboardError(receiverResult.reason),
                loading: false,
            }));
        }
    }

    async function handleSendSticker(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (sendState.loading) {
            return;
        }

        if (!normalizedReceiverId || !selectedStickerType) {
            setSendState({
                error: !normalizedReceiverId ? "Please choose a receiver from the suggestions." : "Please choose a sticker.",
                loading: false,
                success: null,
            });
            return;
        }

        if (!hasAvailablePoints) {
            setSendState({
                error: "You need remaining points to send a sticker.",
                loading: false,
                success: null,
            });
            return;
        }

        if (isSelfReceiver) {
            setSendState({
                error: "You cannot send a sticker to yourself.",
                loading: false,
                success: null,
            });
            return;
        }

        setSendState({
            error: null,
            loading: true,
            success: null,
        });

        try {
            if (!selectedReceiver) {
                throw new Error("Please choose a receiver from the suggestions.");
            }

            await sendSticker({
                message: form.message,
                receiverEmail: selectedReceiver.email,
                receiverEmployeeCode: selectedReceiver.employeeCode,
                stickerTypeId: normalizedStickerTypeId,
            });
            setForm((current) => ({
                ...current,
                message: "",
                receiverId: "",
                receiverName: "",
            }));
            setSendState({
                error: null,
                loading: false,
                success: "Sticker sent successfully.",
            });
            void refreshAfterSend();
        } catch (error) {
            setSendState({
                error: error instanceof Error ? error.message : "Unable to send sticker.",
                loading: false,
                success: null,
            });
        }
    }

    return (
                        <section className="min-w-0 flex-1 space-y-6">
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
                            setFilters((current) => ({ ...current, timeFilter }));
                        }}
                        selectedDepartment={selectedDepartment}
                        selectedTimeFilter={filters.timeFilter}
                        visibleRanks={rankedEntries.length}
                    />

                    <div className="grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)] xl:items-start">
                        <aside className="space-y-5 xl:sticky xl:top-8">
                            <PointsBalanceCard
                                availabilityLabel={getSendAvailabilityLabel(hasAvailablePoints)}
                                balanceError={balanceState.error}
                                balanceProgress={balanceProgress}
                                currentBalance={currentBalance}
                                hasAvailablePoints={hasAvailablePoints}
                                loading={balanceState.loading}
                                year={balanceState.data?.year ?? new Date().getFullYear()}
                            />

                            <SendStickerCard
                                canSend={canSend}
                                form={{
                                    message: form.message,
                                    receiverName: form.receiverName,
                                    stickerTypeId: form.stickerTypeId,
                                }}
                                isReceiverMenuOpen={isReceiverMenuOpen}
                                isReceiverPendingSelection={isReceiverPendingSelection}
                                isSelfReceiver={isSelfReceiver}
                                onMessageChange={(value) => updateFormField("message", value)}
                                onReceiverBlur={() => {
                                    window.setTimeout(() => setIsReceiverMenuOpen(false), 120);
                                }}
                                onReceiverFocus={() => setIsReceiverMenuOpen(true)}
                                onReceiverNameChange={(value) => {
                                    setIsReceiverMenuOpen(true);
                                    updateFormField("receiverName", value);
                                }}
                                onReceiverPick={handleReceiverPick}
                                onStickerTypeChange={(value) => updateFormField("stickerTypeId", value)}
                                onSubmit={handleSendSticker}
                                receiverError={receiverState.error}
                                receiverLoading={receiverState.loading}
                                receiverMatches={receiverMatches}
                                selectedReceiverName={selectedReceiver?.fullName ?? null}
                                selectedStickerType={selectedStickerType}
                                sendState={sendState}
                                stickerTypeError={stickerTypesState.error}
                                stickerTypeLoading={stickerTypesState.loading}
                                stickerTypes={stickerTypesState.data}
                            />
                        </aside>

                        <LeaderboardResults
                            currentEmployeeId={currentEmployeeId}
                            error={leaderboardState.error}
                            loading={leaderboardState.loading}
                            normalizedReceiverId={normalizedReceiverId}
                            normalizedReceiverName={normalizedReceiverName}
                            onReceiverPick={handleReceiverPick}
                            rankedEntries={rankedEntries}
                            topThree={topThree}
                        />
                    </div>
                </section>
    );
}

