"use client";

import { useCallback, useEffect, useState } from "react";

type LeaveTypeItem = {
    id: string;
    name: string;
    description: string;
    totalDays: number;
};

type QuotaConfigurationSectionProps = {
    leaveTypesEndpoint: string;
    updateLeaveTypeEndpointBase: string;
    description?: string;
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

function asNumber(value: unknown, fallback: number): number {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string") {
        const parsed = Number(value.trim());
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return fallback;
}

function parseErrorMessage(raw: string, fallback: string): string {
    if (!raw) {
        return fallback;
    }

    try {
        const parsed = JSON.parse(raw) as {
            message?: string;
            detail?: string;
            title?: string;
            error?: string;
        };

        return parsed.message || parsed.detail || parsed.title || parsed.error || fallback;
    } catch {
        return raw.slice(0, 200) || fallback;
    }
}

function parseArrayPayload(payload: unknown): Record<string, unknown>[] {
    const root = asRecord(payload);
    const body = asRecord(root?.body);
    const data = asRecord(root?.data);

    const source =
        (Array.isArray(payload) ? payload : null) ||
        (Array.isArray(root?.data) ? root?.data : null) ||
        (Array.isArray(body?.data) ? body?.data : null) ||
        (Array.isArray(data?.data) ? data?.data : null) ||
        [];

    return source
        .map((item) => asRecord(item))
        .filter((item): item is Record<string, unknown> => Boolean(item));
}

function parseLeaveTypes(payload: unknown): LeaveTypeItem[] {
    return parseArrayPayload(payload)
        .map((item) => ({
            id: asText(item.id),
            name: asText(item.name),
            description: asText(item.description),
            totalDays: asNumber(item.total_days, 0),
        }))
        .filter((item) => Boolean(item.id))
        .sort((left, right) => {
            const leftKey = (left.name || left.id).toLowerCase();
            const rightKey = (right.name || right.id).toLowerCase();
            return leftKey.localeCompare(rightKey, "en");
        });
}

function parseSuccessMessage(payload: unknown, fallback: string): string {
    const root = asRecord(payload);
    const body = asRecord(root?.body);
    const data = asRecord(root?.data);

    return (
        asText(body?.message) ||
        asText(data?.message) ||
        asText(root?.message) ||
        fallback
    );
}

export function QuotaConfigurationSection({
    leaveTypesEndpoint,
    updateLeaveTypeEndpointBase,
    description = "Manage leave type quota defaults.",
}: QuotaConfigurationSectionProps) {
    const [leaveTypes, setLeaveTypes] = useState<LeaveTypeItem[]>([]);
    const [draftTotalDays, setDraftTotalDays] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);
    const [savingLeaveTypeId, setSavingLeaveTypeId] = useState<string | null>(null);

    const loadLeaveTypes = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);
        setActionError(null);
        setActionSuccess(null);

        try {
            const response = await fetch(leaveTypesEndpoint, { cache: "no-store" });
            if (!response.ok) {
                const raw = await response.text().catch(() => "");
                throw new Error(parseErrorMessage(raw, "Unable to load leave types."));
            }

            const payload = (await response.json().catch(() => null)) as unknown;
            const parsedLeaveTypes = parseLeaveTypes(payload);

            setLeaveTypes(parsedLeaveTypes);
            setDraftTotalDays((current) => {
                const next = { ...current };

                for (const item of parsedLeaveTypes) {
                    next[item.id] = String(item.totalDays);
                }

                return next;
            });
        } catch (error) {
            setLeaveTypes([]);
            setLoadError(error instanceof Error ? error.message : "Unable to load leave types.");
        } finally {
            setIsLoading(false);
        }
    }, [leaveTypesEndpoint]);

    useEffect(() => {
        void loadLeaveTypes();
    }, [loadLeaveTypes]);

    const handleSaveRow = async (leaveType: LeaveTypeItem) => {
        setActionError(null);
        setActionSuccess(null);

        const parsedTotalDays = Number(draftTotalDays[leaveType.id] ?? String(leaveType.totalDays));
        if (!Number.isFinite(parsedTotalDays) || parsedTotalDays < 0) {
            setActionError("Total days must be a number greater than or equal to 0.");
            return;
        }

        setSavingLeaveTypeId(leaveType.id);
        try {
            const response = await fetch(`${updateLeaveTypeEndpointBase}/${encodeURIComponent(leaveType.id)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    total_days: parsedTotalDays,
                }),
            });

            const raw = await response.text().catch(() => "");
            if (!response.ok) {
                throw new Error(
                    parseErrorMessage(raw, `Unable to update leave type quota (HTTP ${response.status}).`),
                );
            }

            let payload: unknown = null;
            if (raw) {
                try {
                    payload = JSON.parse(raw) as unknown;
                } catch {
                    payload = null;
                }
            }

            setLeaveTypes((current) => current.map((item) => {
                if (item.id !== leaveType.id) {
                    return item;
                }

                return {
                    ...item,
                    totalDays: parsedTotalDays,
                };
            }));

            setDraftTotalDays((current) => ({
                ...current,
                [leaveType.id]: String(parsedTotalDays),
            }));

            setActionSuccess(
                parseSuccessMessage(payload, `Quota updated for ${leaveType.name || leaveType.id}.`),
            );
        } catch (error) {
            setActionError(error instanceof Error ? error.message : "Unable to update leave type quota.");
        } finally {
            setSavingLeaveTypeId(null);
        }
    };

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-1">
                <h2 className="text-xl font-semibold text-slate-950">Quota Configuration</h2>
                <p className="text-sm text-slate-500">{description}</p>
                <p className="text-xs text-slate-500">
                    Source: <span className="font-mono">GET /leave-types</span>. Update: <span className="font-mono">PUT /leave-types/{"{id}"}</span> with <span className="font-mono">total_days</span>.
                </p>
            </div>

            <div className="mt-4">
                <button
                    type="button"
                    onClick={() => void loadLeaveTypes()}
                    disabled={isLoading}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isLoading ? "Loading..." : "Reload"}
                </button>
            </div>

            {loadError ? (
                <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {loadError}
                </div>
            ) : null}

            {actionError ? (
                <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {actionError}
                </div>
            ) : null}

            {actionSuccess ? (
                <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {actionSuccess}
                </div>
            ) : null}

            <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr className="text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            <th className="px-4 py-3">Leave Type</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3">Total Days</th>
                            <th className="px-4 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                                    Loading leave types...
                                </td>
                            </tr>
                        ) : leaveTypes.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                                    No leave types available.
                                </td>
                            </tr>
                        ) : (
                            leaveTypes.map((leaveType) => {
                                const isSaving = savingLeaveTypeId === leaveType.id;

                                return (
                                    <tr key={leaveType.id} className="align-top">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">{leaveType.name || "--"}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 max-w-xs">
                                            {leaveType.description || "--"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                min={0}
                                                step="1"
                                                value={draftTotalDays[leaveType.id] ?? String(leaveType.totalDays)}
                                                onChange={(event) => setDraftTotalDays((current) => ({
                                                    ...current,
                                                    [leaveType.id]: event.target.value,
                                                }))}
                                                className="w-28 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => void handleSaveRow(leaveType)}
                                                disabled={isSaving}
                                                className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                                            >
                                                {isSaving ? "Saving..." : "Save"}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
