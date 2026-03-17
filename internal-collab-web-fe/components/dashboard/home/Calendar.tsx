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
                            const cellEvents = cell.events ?? [];
                            const hasEvent = cell.hasEvent;
                            const isToday = Boolean(
                                cell.day &&
                                    viewDate.getFullYear() === today.getFullYear() &&
                                    viewDate.getMonth() === today.getMonth() &&
                                    cell.day === today.getDate(),
                            );

                            const bdNames = cellEvents.filter((e) => e.type !== "leave").map((e) => e.name.trim()).filter(Boolean);
                            const leaveNames = cellEvents.filter((e) => e.type === "leave").map((e) => e.name.trim()).filter(Boolean);
                            const hasBirthday = bdNames.length > 0;
                            const hasLeave = leaveNames.length > 0;

                            const dayTone = isToday
                                ? "bg-blue-600 text-white ring-1 ring-blue-600"
                                : hasLeave
                                  ? "cursor-default bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                                  : hasBirthday
                                    ? "cursor-default bg-orange-50 text-orange-700 ring-1 ring-orange-200"
                                    : "text-slate-700";

                            return (
                                <div key={`${rowIndex}-${cellIndex}`} className="flex aspect-square items-center justify-center">
                                    {isEmpty ? null : (
                                        <div
                                            className={`group relative flex h-10 w-10 items-center justify-center rounded-full transition ${dayTone}`}
                                        >
                                            {cell.day}
                                            {hasEvent ? (
                                                <>
                                                    {/* Dots: orange for birthday, blue for leave */}
                                                    <div className="absolute bottom-0.5 flex items-center gap-0.5">
                                                        {hasBirthday && <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />}
                                                        {hasLeave && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                                                    </div>
                                                    {/* Tooltip */}
                                                    <div className="pointer-events-none absolute left-1/2 top-0 z-20 hidden w-52 -translate-x-1/2 -translate-y-[calc(100%+8px)] rounded-xl bg-slate-900 px-3 py-2 text-left text-xs text-white shadow-lg group-hover:block">
                                                        {hasBirthday && (
                                                            <div className="mb-1">
                                                                <p className="font-semibold text-orange-300">🎂 Birthdays</p>
                                                                {bdNames.map((name, idx) => (
                                                                    <p key={`bd-${idx}`} className="truncate">{name}</p>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {hasLeave && (
                                                            <div>
                                                                <p className="font-semibold text-blue-300">🏖️ On Leave</p>
                                                                {leaveNames.map((name, idx) => (
                                                                    <p key={`lv-${idx}`} className="truncate">{name}</p>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
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
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-orange-500" />
                        Birthday
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        On Leave
                    </span>
                    <span className="text-slate-400">Hover a marked date to see names.</span>
                </div>
            </div>
        </div>
    );
}
