"use client";

import { useMemo, useState } from "react";
import { LeaveHistory } from "@/components/leave/LeaveHistory";
import type { LeaveHistoryItem } from "@/types/leave";

const DEFAULT_VISIBLE_COUNT = 5;
const FILTER_PRIORITY = ["All", "Approved", "Rejected", "Cancelled"] as const;

type HistoryFilter = (typeof FILTER_PRIORITY)[number] | string;

type Props = {
    items: LeaveHistoryItem[];
};

function buildFilterList(items: LeaveHistoryItem[]) {
    const dynamic = new Set(items.map((item) => item.status.label).filter(Boolean));
    const known: string[] = FILTER_PRIORITY.filter((label) => label === "All" || dynamic.has(label));
    const custom = [...dynamic].filter((label) => !known.includes(label));
    return [...known, ...custom];
}

function applyFilter(items: LeaveHistoryItem[], filter: HistoryFilter) {
    if (filter === "All") return items;
    return items.filter((item) => item.status.label === filter);
}

export function LeaveHistoryPanel({ items }: Props) {
    const filters = useMemo(() => buildFilterList(items), [items]);
    const [activeFilter, setActiveFilter] = useState<HistoryFilter>("All");
    const [expanded, setExpanded] = useState(false);
    const safeActiveFilter = filters.includes(activeFilter) ? activeFilter : "All";

    const filteredItems = useMemo(() => applyFilter(items, safeActiveFilter), [items, safeActiveFilter]);
    const canViewAll = filteredItems.length > DEFAULT_VISIBLE_COUNT;
    const visibleItems = expanded || !canViewAll ? filteredItems : filteredItems.slice(0, DEFAULT_VISIBLE_COUNT);

    return (
        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-900">
                <span>Leave History</span>
                {canViewAll ? (
                    <button
                        type="button"
                        onClick={() => setExpanded((prev) => !prev)}
                        className="text-xs font-semibold text-blue-600"
                    >
                        {expanded ? "Show Less" : `View All (${filteredItems.length})`}
                    </button>
                ) : (
                    <span className="text-xs font-semibold text-slate-400">Showing {filteredItems.length}</span>
                )}
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                {filters.map((filter) => (
                    <button
                        key={filter}
                        type="button"
                        onClick={() => {
                            setActiveFilter(filter);
                            setExpanded(false);
                        }}
                        className={`rounded-full px-3 py-1 ${safeActiveFilter === filter ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {visibleItems.length === 0 ? (
                <p className="text-sm text-slate-500">No leave history available for the selected status.</p>
            ) : (
                <LeaveHistory items={visibleItems} />
            )}
        </div>
    );
}
