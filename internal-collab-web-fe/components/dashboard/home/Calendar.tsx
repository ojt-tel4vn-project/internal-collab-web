"use client";

import React, { useEffect, useMemo, useState } from "react";
import { extractBirthdayEntries, toCalendarEvents } from "@/lib/birthdays";
import type { CalendarEvent, DayCell } from "@/types/dashboard";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "./Icons";

type CalendarView = "monthly" | "weekly";

interface CalendarProps {
    baseDate?: Date;
    viewMode?: CalendarView;
    events?: CalendarEvent[];
    eventGroupLabel?: string;
}

function getMonthDayKey(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    const mdMatch = trimmed.match(/^(\d{2})-(\d{2})$/);
    if (mdMatch) {
        const month = Number(mdMatch[1]);
        const day = Number(mdMatch[2]);
        if (Number.isFinite(month) && Number.isFinite(day) && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return `${month}-${day}`;
        }
    }

    const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymdMatch) {
        const month = Number(ymdMatch[2]);
        const day = Number(ymdMatch[3]);
        if (Number.isFinite(month) && Number.isFinite(day) && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return `${month}-${day}`;
        }
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return `${parsed.getMonth() + 1}-${parsed.getDate()}`;
}

function buildEventMap(events: CalendarEvent[]) {
    const eventMap = new Map<string, CalendarEvent[]>();

    for (const event of events) {
        const key = getMonthDayKey(event.date);
        if (!key) {
            continue;
        }

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

export function DashboardCalendar({ baseDate, viewMode = "monthly", events }: CalendarProps) {
    const [viewDate, setViewDate] = useState<Date>(baseDate ?? new Date());
    const [fetchedEvents, setFetchedEvents] = useState<CalendarEvent[]>([]);
    const today = useMemo(() => new Date(), []);

    const externalEvents = events ?? [];
    const hasExternalEvents = externalEvents.length > 0;

    useEffect(() => {
        if (hasExternalEvents) {
            return;
        }

        let isCancelled = false;

        async function loadBirthdays() {
            try {
                const response = await fetch("/api/employee/birthdays", {
                    cache: "no-store",
                });

                if (!response.ok) {
                    throw new Error("Unable to load birthdays.");
                }

                const payload = (await response.json()) as unknown;
                const birthdayEntries = extractBirthdayEntries(payload);
                const nextEvents = toCalendarEvents(birthdayEntries);

                if (!isCancelled) {
                    setFetchedEvents(nextEvents);
                }
            } catch {
                if (!isCancelled) {
                    setFetchedEvents([]);
                }
            }
        }

        void loadBirthdays();

        return () => {
            isCancelled = true;
        };
    }, [hasExternalEvents]);

    const calendarEvents = hasExternalEvents ? externalEvents : fetchedEvents;

    const { weeks, label, focusIndex } = useMemo(
        () => buildWeeks(viewDate, calendarEvents),
        [calendarEvents, viewDate],
    );

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
                            const hasEvent = cell.hasEvent;
                            const isToday = Boolean(
                                cell.day &&
                                    viewDate.getFullYear() === today.getFullYear() &&
                                    viewDate.getMonth() === today.getMonth() &&
                                    cell.day === today.getDate(),
                            );
                            const birthdayNames = (cell.events ?? [])
                                .map((event) => event.name.trim())
                                .filter(Boolean);
                            const tooltipTitle = birthdayNames.join(", ");
                            const dayTone = isToday
                                ? "bg-blue-600 text-white ring-1 ring-blue-600"
                                : hasEvent
                                  ? "cursor-default bg-orange-50 text-orange-700 ring-1 ring-orange-200"
                                  : "text-slate-700";

                            return (
                                <div key={`${rowIndex}-${cellIndex}`} className="flex aspect-square items-center justify-center">
                                    {isEmpty ? null : (
                                        <div
                                            title={hasEvent && tooltipTitle ? tooltipTitle : undefined}
                                            className={`group relative flex h-10 w-10 items-center justify-center rounded-full transition ${dayTone}`}
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
                                                    {birthdayNames.length > 0 ? (
                                                        <div className="pointer-events-none absolute left-1/2 top-0 z-20 hidden w-52 -translate-x-1/2 -translate-y-[calc(100%+8px)] rounded-xl bg-slate-900 px-3 py-2 text-left text-xs text-white shadow-lg group-hover:block">
                                                            <p className="mb-1 font-semibold text-orange-200">Birthdays</p>
                                                            <div className="space-y-1">
                                                                {birthdayNames.map((name, idx) => (
                                                                    <p key={`${name}-${idx}`} className="truncate" title={name}>
                                                                        {name}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        </div>
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
                <p className="text-sm text-slate-500">Birthday dates are marked in orange. Hover each date to see names.</p>
            </div>
        </div>
    );
}
