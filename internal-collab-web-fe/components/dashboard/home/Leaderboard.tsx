"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LeaderboardItem } from "@/types/dashboard";
import { ArrowUpRightIcon, MedalIcon } from "./Icons";
import { SectionCard } from "./common/SectionCard";

type HomeLeaderboardApiItem = {
    employee_id?: unknown;
    full_name?: unknown;
    total?: unknown;
};

type HomeLeaderboardResponse = {
    data?: HomeLeaderboardApiItem[];
    body?: HomeLeaderboardApiItem[] | { data?: HomeLeaderboardApiItem[] };
    message?: string;
    detail?: string;
    title?: string;
    error?: string;
};

type HomeLeaderboardEntry = {
    employeeId: string;
    highlight: boolean;
    name: string;
    points: number;
    rank: number;
    role?: string;
};

type RemoteState = {
    data: HomeLeaderboardEntry[];
    error: string | null;
    loading: boolean;
};

interface LeaderboardProps {
    entries?: LeaderboardItem[];
    viewAllHref?: string;
}

function asNumber(value: unknown) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string" && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return 0;
}

function asText(value: unknown, fallback = "") {
    return typeof value === "string" ? value.trim() || fallback : fallback;
}

function extractEnvelopeData(payload: HomeLeaderboardResponse | null | undefined) {
    if (!payload) {
        return [];
    }

    if (Array.isArray(payload.data)) {
        return payload.data;
    }

    if (Array.isArray(payload.body)) {
        return payload.body;
    }

    if (payload.body && typeof payload.body === "object" && Array.isArray(payload.body.data)) {
        return payload.body.data;
    }

    return [];
}

function getErrorMessage(raw: string, fallback: string) {
    if (!raw) {
        return fallback;
    }

    try {
        const parsed = JSON.parse(raw) as {
            detail?: string;
            error?: string;
            message?: string;
            title?: string;
        };

        return parsed.message || parsed.detail || parsed.title || parsed.error || fallback;
    } catch {
        return fallback;
    }
}

function getCurrentMonthRange() {
    const now = new Date();
    const year = now.getFullYear();
    const monthIndex = now.getMonth();
    const formatDateParam = (date: Date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    };

    return {
        end: formatDateParam(new Date(year, monthIndex + 1, 0, 23, 59, 59, 999)),
        start: formatDateParam(new Date(year, monthIndex, 1)),
    };
}

async function readHomeLeaderboard(signal?: AbortSignal) {
    const { end, start } = getCurrentMonthRange();
    const params = new URLSearchParams({
        end_date: end,
        limit: "3",
        start_date: start,
    });

    const response = await fetch(`/api/employee/stickers/leaderboard?${params.toString()}`, {
        cache: "no-store",
        signal,
    });

    if (!response.ok) {
        const raw = await response.text().catch(() => "");
        throw new Error(getErrorMessage(raw, "Unable to load leaderboard."));
    }

    const payload = (await response.json()) as HomeLeaderboardResponse;

    return extractEnvelopeData(payload)
        .map((entry) => ({
            employeeId: asText(entry.employee_id),
            name: asText(entry.full_name, "Unnamed employee"),
            points: asNumber(entry.total),
        }))
        .filter((entry) => entry.employeeId)
        .sort((left, right) => right.points - left.points)
        .slice(0, 3)
        .map((entry, index) => ({
            ...entry,
            highlight: index === 0,
            rank: index + 1,
        }));
}

export function LeaderboardCard({ entries, viewAllHref = "/employee/leaderboard" }: LeaderboardProps) {
    const hasProvidedEntries = Boolean(entries?.length);
    const [state, setState] = useState<RemoteState>({
        data: [],
        error: null,
        loading: true,
    });

    useEffect(() => {
        if (hasProvidedEntries) {
            return;
        }

        let cancelled = false;
        const controller = new AbortController();

        void readHomeLeaderboard(controller.signal)
            .then((entries) => {
                if (cancelled) {
                    return;
                }

                setState({
                    data: entries,
                    error: null,
                    loading: false,
                });
            })
            .catch((error) => {
                if (cancelled || (error instanceof DOMException && error.name === "AbortError")) {
                    return;
                }

                setState({
                    data: [],
                    error: error instanceof Error ? error.message : "Unable to load leaderboard.",
                    loading: false,
                });
            });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [hasProvidedEntries]);

    const topEntries = useMemo(() => {
        const sourceEntries: HomeLeaderboardEntry[] = hasProvidedEntries
            ? (entries ?? []).map((entry) => ({
                  employeeId: `${entry.name}-${entry.role}-${entry.points}`,
                  highlight: Boolean(entry.highlight),
                  name: entry.name,
                  points: entry.points,
                  rank: entry.rank,
                  role: entry.role,
              }))
            : state.data;

        return [...sourceEntries]
            .sort((left, right) => right.points - left.points)
            .slice(0, 3)
            .map((entry, index) => ({
                ...entry,
                highlight: index === 0 || entry.highlight,
                rank: index + 1,
            }));
    }, [entries, hasProvidedEntries, state.data]);

    return (
        <SectionCard
            title="Leaderboard"
            description="This Month"
            icon={<MedalIcon className="h-6 w-6 text-orange-500" />}
            footerSlot={
                <Link
                    href={viewAllHref}
                    className="block w-full rounded-2xl bg-orange-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                    View Full Rankings <ArrowUpRightIcon className="ml-2 inline h-4 w-4" />
                </Link>
            }
        >
            {!hasProvidedEntries && state.error ? (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {state.error}
                </div>
            ) : (
                <ul className="space-y-3">
                    {!hasProvidedEntries && state.loading
                        ? Array.from({ length: 3 }, (_, index) => (
                              <li key={`leaderboard-skeleton-${index}`} className="h-[72px] animate-pulse rounded-3xl bg-slate-100" />
                          ))
                        : topEntries.map((entry) => {
                              const initials = entry.name
                                  .split(" ")
                                  .map((part) => part[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase();

                              const highlightClasses = entry.highlight
                                  ? "border border-orange-200 bg-orange-50"
                                  : "border border-slate-100";

                              return (
                                  <li
                                      key={entry.employeeId}
                                      className={`flex items-center justify-between rounded-3xl px-4 py-3 ${highlightClasses}`}
                                  >
                                      <div className="flex items-center gap-4">
                                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                                              {entry.rank}
                                          </span>
                                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-600">
                                              {initials}
                                          </div>
                                          <div>
                                              <p className="text-sm font-semibold text-slate-900">{entry.name}</p>
                                              <p className="text-xs text-slate-500">{entry.role || "Top receiver"}</p>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <p className="text-lg font-bold text-slate-900">{entry.points}</p>
                                          <p className="text-[10px] font-semibold tracking-wide text-slate-400">STICKERS</p>
                                      </div>
                                  </li>
                              );
                          })}
                </ul>
            )}
        </SectionCard>
    );
}
