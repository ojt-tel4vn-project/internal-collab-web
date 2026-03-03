"use client";

import React, { useMemo, useState } from "react";
import type { DayCell } from "@/types/dashboard";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "./Icons";

type CalendarView = "monthly" | "weekly";

interface CalendarProps {
    baseDate?: Date;
    viewMode?: CalendarView;
}

function buildWeeks(baseDate: Date): { label: string; weeks: DayCell[][]; focusIndex: number } {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startPad = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lastDay = new Date(year, month, daysInMonth).getDay();
    const endPad = 6 - lastDay;
    const totalCells = startPad + daysInMonth + endPad;

    const cells: DayCell[] = Array.from({ length: totalCells }, (_, idx) => {
        const dayNum = idx - startPad + 1;
        if (dayNum < 1 || dayNum > daysInMonth) return {};
        const isFocus = baseDate.getDate() === dayNum;
        return { day: dayNum, isFocus, hasEvent: isFocus };
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

export function DashboardCalendar({ baseDate, viewMode = "monthly" }: CalendarProps) {
    const [viewDate, setViewDate] = useState<Date>(baseDate ?? new Date());

    const { weeks, label, focusIndex } = useMemo(() => buildWeeks(viewDate), [viewDate]);

    const goPrev = () =>
        setViewDate((d) =>
            viewMode === "weekly" ? new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7) : new Date(d.getFullYear(), d.getMonth() - 1, 1)
        );
    const goNext = () =>
        setViewDate((d) =>
            viewMode === "weekly" ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7) : new Date(d.getFullYear(), d.getMonth() + 1, 1)
        );
    const goToday = () => setViewDate(new Date());

    return (
        <div className="rounded-3xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    <span>{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={goPrev}
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
                        onClick={goNext}
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
                                            className={`relative flex h-10 w-10 items-center justify-center rounded-full ${focus ? "bg-blue-600 text-white" : "text-slate-700"
                                                }`}
                                        >
                                            {cell.day}
                                            {hasEvent ? <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-orange-500" /> : null}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}
