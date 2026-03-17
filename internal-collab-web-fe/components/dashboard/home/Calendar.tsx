"use client";

import React, { useMemo, useState } from "react";
import type { CalendarEvent, DayCell } from "@/types/dashboard";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "./Icons";

type CalendarView = "monthly" | "weekly";

interface CalendarProps {
    baseDate?: Date;
    viewMode?: CalendarView;
    events?: CalendarEvent[];
    eventGroupLabel?: string;
}

function buildEventMap(events: CalendarEvent[]) {
    const eventMap = new Map<string, CalendarEvent[]>();

    for (const event of events) {
        const parsed = new Date(event.date);
        if (Number.isNaN(parsed.getTime())) {
            continue;
        }

        const key = `${parsed.getMonth() + 1}-${parsed.getDate()}`;
        const existing = eventMap.get(key) ?? [];
        existing.push(event);
        eventMap.set(key, existing);
    }

    return eventMap;
}

function buildWeeks(baseDate: Date, events: CalendarEvent[]): { label: string; weeks: DayCell[][]; focusIndex: number } {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startPad = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lastDay = new Date(year, month, daysInMonth).getDay();
    const endPad = 6 - lastDay;
    const totalCells = startPad + daysInMonth + endPad;
    const eventMap = buildEventMap(events);

    const cells: DayCell[] = Array.from({ length: totalCells }, (_, idx) => {
        const dayNum = idx - startPad + 1;
        if (dayNum < 1 || dayNum > daysInMonth) return {};
        const isFocus = baseDate.getDate() === dayNum;
        const cellEvents = eventMap.get(`${month + 1}-${dayNum}`) ?? [];
        return { day: dayNum, isFocus, hasEvent: cellEvents.length > 0, events: cellEvents };
    });

    const weeks: DayCell[][] = [];
    let focusIndex = 0;
    for (let i = 0; i < cells.length; i += 7) {
        const slice = cells.slice(i, i + 7);
        weeks.push(slice);
        if (slice.some((cell) => cell.isFocus)) {
            focusIndex = weeks.length - 1;
        }
    }

    const label = baseDate.toLocaleString("en-US", { month: "long", year: "numeric" });
    return { label, weeks, focusIndex };
}

export function DashboardCalendar({ baseDate, viewMode = "monthly", events = [], eventGroupLabel = "birthdays" }: CalendarProps) {
    const [viewDate, setViewDate] = useState<Date>(baseDate ?? new Date());
    const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

    const { weeks, label, focusIndex } = useMemo(() => buildWeeks(viewDate, events), [events, viewDate]);
    const selectedEvents = useMemo(() => {
        if (!selectedDayKey) {
            return [];
        }

        for (const row of weeks) {
            for (const cell of row) {
                if (cell.day && `${viewDate.getMonth() + 1}-${cell.day}` === selectedDayKey) {
                    return cell.events ?? [];
                }
            }
        }

        return [];
    }, [selectedDayKey, viewDate, weeks]);
    const selectedDayLabel = useMemo(() => {
        if (!selectedDayKey) {
            return null;
        }

        const [, rawDay] = selectedDayKey.split("-");
        const day = Number(rawDay);
        if (!Number.isFinite(day)) {
            return null;
        }

        return new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
        });
    }, [selectedDayKey, viewDate]);

    const shiftMonth = (delta: number) => {
        setViewDate((d) => {
            const currentDay = d.getDate();
            const target = new Date(d.getFullYear(), d.getMonth() + delta, 1);
            const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
            return new Date(target.getFullYear(), target.getMonth(), Math.min(currentDay, lastDay));
        });
    };

    const goPrev = () =>
        setViewDate((d) => (viewMode === "weekly" ? new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7) : d));
    const goNext = () =>
        setViewDate((d) => (viewMode === "weekly" ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7) : d));
    const goToday = () => setViewDate(new Date());

    // Re-route monthly navigation through month shifter to preserve selected day across months
    const handlePrev = () => (viewMode === "weekly" ? goPrev() : shiftMonth(-1));
    const handleNext = () => (viewMode === "weekly" ? goNext() : shiftMonth(1));

    return (
        <div className="rounded-3xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    <span>{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrev}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50"
                        aria-label="Previous period"
                    >
                        <ChevronLeftIcon className="h-4 w-4" />
                    </button>
                    <button
                        onClick={goToday}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                        Today
                    </button>
                    <button
                        onClick={handleNext}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50"
                        aria-label="Next period"
                    >
                        <ChevronRightIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 rounded-2xl bg-slate-50 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="py-2">
                        {day}
                    </div>
                ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1 text-center text-sm font-semibold text-slate-700">
                {(viewMode === "weekly" ? [weeks[focusIndex]] : weeks).map((row, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                        {row.map((cell, cellIndex) => {
                            const isEmpty = !cell.day;
                            const focus = cell.isFocus;
                            const hasEvent = cell.hasEvent;

                            return (
                                <div key={`${rowIndex}-${cellIndex}`} className="flex aspect-square items-center justify-center">
                                    {isEmpty ? null : (
                                        <div
                                            className={`relative flex h-10 w-10 items-center justify-center rounded-full transition ${focus ? "bg-blue-600 text-white" : "text-slate-700"} ${hasEvent ? "cursor-pointer hover:bg-orange-50" : ""}`}
                                            onClick={() => {
                                                if (!hasEvent || !cell.day) {
                                                    return;
                                                }

                                                const nextKey = `${viewDate.getMonth() + 1}-${cell.day}`;
                                                setSelectedDayKey((current) => (current === nextKey ? null : nextKey));
                                            }}
                                        >
                                            {cell.day}
                                            {hasEvent ? (
                                                <>
                                                    <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-orange-500" />
                                                    {(cell.events?.length ?? 0) > 1 ? (
                                                        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                                                            {cell.events?.length}
                                                        </span>
                                                    ) : null}
                                                </>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                {!selectedEvents.length ? (
                    <p className="text-sm text-slate-500">Click a highlighted date to see {eventGroupLabel}.</p>
                ) : (
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-900">{selectedDayLabel} — {eventGroupLabel}</p>
                        <div className="flex flex-wrap gap-2">
                            {selectedEvents.map((event) => (
                                <span
                                    key={event.id}
                                    className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700"
                                >
                                    {event.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
