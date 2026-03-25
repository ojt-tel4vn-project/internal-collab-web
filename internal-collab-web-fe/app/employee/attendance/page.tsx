"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/dashboard/home/Icons";
import { parseApiErrorMessage } from "@/lib/api/errors";
import { asFiniteNumber, asString } from "@/lib/normalize";

type AttendanceDayStatus = "present" | "absent" | "late" | "leave" | "unknown";

type AttendanceApiDayDetail = {
    status?: string;
    check_in_time?: string;
    checkInTime?: string;
    check_out_time?: string;
    checkOutTime?: string;
    work_hours?: number | string;
    workHours?: number | string;
};

type AttendanceApiItem = {
    id?: string;
    month?: number;
    year?: number;
    attendance_data?: Record<string, AttendanceDayStatus | string | AttendanceApiDayDetail>;
    total_days_present?: number;
    total_days_absent?: number;
    total_days_late?: number;
    status?: string;
};

type AttendanceListResponse =
    | AttendanceApiItem[]
    | {
        data?: AttendanceApiItem[];
        body?: AttendanceApiItem[] | { data?: AttendanceApiItem[] };
    };

type AttendanceDetailResponse =
    | AttendanceApiItem
    | {
        data?: AttendanceApiItem | { data?: AttendanceApiItem };
        body?: AttendanceApiItem | { data?: AttendanceApiItem };
    };

type AttendanceRecord = {
    id: string;
    month: number;
    year: number;
    attendanceData: Record<string, AttendanceDayStatus | string | AttendanceApiDayDetail>;
    totalDaysPresent: number;
    totalDaysAbsent: number;
    totalDaysLate: number;
    status: string;
};

const DAY_STATUS_META: Record<AttendanceDayStatus, { label: string; tone: string }> = {
    present: { label: "Present", tone: "bg-emerald-100 text-emerald-700" },
    late: { label: "Late", tone: "bg-amber-100 text-amber-700" },
    absent: { label: "Absent", tone: "bg-rose-100 text-rose-700" },
    leave: { label: "Leave", tone: "bg-blue-100 text-blue-700" },
    unknown: { label: "No data", tone: "bg-slate-100 text-slate-600" },
};

const RECORD_STATUS_META: Record<string, { label: string; tone: string }> = {
    pending: { label: "Pending", tone: "bg-amber-100 text-amber-700" },
    confirmed: { label: "Confirmed", tone: "bg-emerald-100 text-emerald-700" },
    auto_confirmed: { label: "Auto-confirmed", tone: "bg-slate-100 text-slate-600" },
};

const dateLabelFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-GB", { weekday: "long" });

const monthLabelFormatter = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeRecordStatus(value: unknown) {
    const normalized = asString(value).trim().toLowerCase();
    if (!normalized) return "pending";
    if (Object.hasOwn(RECORD_STATUS_META, normalized)) return normalized;
    return normalized;
}

function canConfirmRecord(status: string | null | undefined) {
    const normalized = normalizeRecordStatus(status);
    return normalized !== "confirmed" && normalized !== "auto_confirmed";
}

function toOptionalFiniteNumber(value: unknown) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return null;
}

function extractAttendanceItems(payload: AttendanceListResponse) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.body)) return payload.body as AttendanceApiItem[];
    if (Array.isArray(payload?.body?.data)) return payload.body.data as AttendanceApiItem[];
    return [];
}

function extractAttendanceDetailItem(payload: AttendanceDetailResponse) {
    if (isRecord(payload) && (payload.id || payload.attendance_data || payload.month || payload.year)) {
        return payload as AttendanceApiItem;
    }

    const root = isRecord(payload) ? payload : null;
    const body = isRecord(root?.body) ? root.body : null;
    const data = isRecord(root?.data) ? root.data : null;

    const candidates = [root?.data, root?.body, data?.data, body?.data];
    for (const candidate of candidates) {
        if (isRecord(candidate) && (candidate.id || candidate.attendance_data || candidate.month || candidate.year)) {
            return candidate as AttendanceApiItem;
        }
    }

    return null;
}

function normalizeAttendance(item: AttendanceApiItem): AttendanceRecord | null {
    const id = asString(item.id);
    const month = asFiniteNumber(item.month);
    const year = asFiniteNumber(item.year);
    if (!id || !month || !year) return null;

    return {
        id,
        month,
        year,
        attendanceData: item.attendance_data ?? {},
        totalDaysPresent: asFiniteNumber(item.total_days_present),
        totalDaysAbsent: asFiniteNumber(item.total_days_absent),
        totalDaysLate: asFiniteNumber(item.total_days_late),
        status: normalizeRecordStatus(item.status),
    };
}

export default function AttendancePage() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [record, setRecord] = useState<AttendanceRecord | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [commentDay, setCommentDay] = useState<number | null>(null);
    const [commentText, setCommentText] = useState("");
    const [commentSaving, setCommentSaving] = useState(false);
    const [selectedEntryDay, setSelectedEntryDay] = useState<number | null>(null);

    const monthLabel = useMemo(() => monthLabelFormatter.format(new Date(year, month - 1, 1)), [month, year]);

    const loadAttendanceDetail = useCallback(async (attendanceId: string) => {
        const res = await fetch(`/api/employee/attendances/${attendanceId}`, { cache: "no-store" });
        if (!res.ok) {
            const raw = await res.text().catch(() => "");
            throw new Error(parseApiErrorMessage(raw, "Unable to load attendance detail."));
        }

        const payload = (await res.json()) as AttendanceDetailResponse;
        const item = extractAttendanceDetailItem(payload);
        return item ? normalizeAttendance(item) : null;
    }, []);

    const loadAttendance = useCallback(async () => {
        setLoading(true);
        setError(null);
        setActionMessage(null);
        try {
            const res = await fetch(`/api/employee/attendances?month=${month}&year=${year}`, { cache: "no-store" });
            if (!res.ok) {
                const raw = await res.text().catch(() => "");
                throw new Error(parseApiErrorMessage(raw, "Unable to load attendance data."));
            }

            const payload = (await res.json()) as AttendanceListResponse;
            const items = extractAttendanceItems(payload);
            const normalized = items.map(normalizeAttendance).filter(Boolean) as AttendanceRecord[];
            const baseRecord = normalized[0] ?? null;
            if (!baseRecord) {
                setRecord(null);
                setSelectedEntryDay(null);
                return;
            }

            const detailedRecord = await loadAttendanceDetail(baseRecord.id).catch(() => null);
            setRecord(detailedRecord ?? baseRecord);
            setSelectedEntryDay(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unable to load attendance data.";
            setError(message);
            setRecord(null);
            setSelectedEntryDay(null);
        } finally {
            setLoading(false);
        }
    }, [loadAttendanceDetail, month, year]);

    const entries = useMemo(() => {
        if (!record) return [];
        const daysInMonth = new Date(record.year, record.month, 0).getDate();
        return Array.from({ length: daysInMonth }, (_, idx) => {
            const dayNumber = idx + 1;
            const date = new Date(record.year, record.month - 1, dayNumber);
            const rawValue = record.attendanceData[String(dayNumber)];
            const detail = isRecord(rawValue) ? rawValue : null;
            const rawStatus = typeof rawValue === "string"
                ? rawValue
                : asString(detail?.status, "unknown").trim().toLowerCase() || "unknown";
            const normalizedStatus = Object.hasOwn(DAY_STATUS_META, rawStatus) ? rawStatus : "unknown";
            const meta = DAY_STATUS_META[normalizedStatus as AttendanceDayStatus] ?? DAY_STATUS_META.unknown;
            return {
                dayNumber,
                dateLabel: dateLabelFormatter.format(date),
                dayLabel: weekdayFormatter.format(date),
                checkIn: asString(detail?.check_in_time ?? detail?.checkInTime, ""),
                checkOut: asString(detail?.check_out_time ?? detail?.checkOutTime, ""),
                workHours: toOptionalFiniteNumber(detail?.work_hours ?? detail?.workHours),
                statusKey: normalizedStatus as AttendanceDayStatus,
                status: meta,
            };
        });
    }, [record]);

    const selectedEntry = useMemo(
        () => entries.find((entry) => entry.dayNumber === selectedEntryDay) ?? null,
        [entries, selectedEntryDay],
    );

    const stats = useMemo(() => {
        if (!record) return [];
        return [
            { label: "Present Days", value: String(record.totalDaysPresent), color: "text-emerald-600" },
            { label: "Late Days", value: String(record.totalDaysLate), color: "text-amber-500" },
            { label: "Absent Days", value: String(record.totalDaysAbsent), color: "text-rose-600" },
            {
                label: "Record Status",
                value: RECORD_STATUS_META[record.status]?.label ?? record.status,
                color: RECORD_STATUS_META[record.status]?.tone ?? "text-slate-600",
            },
        ];
    }, [record]);

    const handlePrevMonth = () => {
        setMonth((prev) => {
            if (prev === 1) {
                setYear((y) => y - 1);
                return 12;
            }
            return prev - 1;
        });
    };

    const handleNextMonth = () => {
        setMonth((prev) => {
            if (prev === 12) {
                setYear((y) => y + 1);
                return 1;
            }
            return prev + 1;
        });
    };

    const handleConfirm = async () => {
        if (!record || confirming) return;
        setConfirming(true);
        setError(null);
        setActionMessage(null);
        try {
            const res = await fetch(`/api/employee/attendances/${record.id}/confirm`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "confirmed" }),
            });
            if (!res.ok) {
                const raw = await res.text().catch(() => "");
                throw new Error(parseApiErrorMessage(raw, "Unable to confirm attendance."));
            }
            await loadAttendance();
            setActionMessage("Attendance confirmed.");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unable to confirm attendance.";
            setError(message);
        } finally {
            setConfirming(false);
        }
    };

    const handleSubmitComment = async () => {
        if (!record || commentDay === null || commentSaving) return;
        if (!commentText.trim()) {
            setError("Comment is required.");
            return;
        }
        setCommentSaving(true);
        setError(null);
        setActionMessage(null);
        const dayNumber = commentDay;
        try {
            const res = await fetch(`/api/employee/attendances/${record.id}/disputes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ comment: commentText.trim(), day_number: commentDay }),
            });
            if (!res.ok) {
                const raw = await res.text().catch(() => "");
                throw new Error(parseApiErrorMessage(raw, "Unable to submit comment."));
            }
            setActionMessage(dayNumber ? `Dispute submitted for day ${dayNumber}.` : "Dispute submitted.");
            setCommentDay(null);
            setCommentText("");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unable to submit comment.";
            setError(message);
        } finally {
            setCommentSaving(false);
        }
    };

    useEffect(() => {
        void loadAttendance();
    }, [loadAttendance]);

    return (
                        <section className="flex-1 space-y-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">My Attendance</h1>
                            <p className="text-sm text-slate-500">Monthly attendance overview.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                                <button className="rounded-full p-1 text-slate-400 hover:bg-slate-50" aria-label="Previous month" onClick={handlePrevMonth}>
                                    <ChevronLeftIcon className="h-4 w-4" />
                                </button>
                                <span>{monthLabel}</span>
                                <button className="rounded-full p-1 text-slate-400 hover:bg-slate-50" aria-label="Next month" onClick={handleNextMonth}>
                                    <ChevronRightIcon className="h-4 w-4" />
                                </button>
                            </div>
                            {record && canConfirmRecord(record.status) ? (
                                <button
                                    className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                                    onClick={handleConfirm}
                                    disabled={confirming}
                                >
                                    {confirming ? "Confirming..." : "Confirm Attendance"}
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {error ? (
                        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {error}
                        </div>
                    ) : null}

                    {actionMessage ? (
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {actionMessage}
                        </div>
                    ) : null}

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {stats.length > 0 ? (
                            stats.map((stat) => (
                                <div key={stat.label} className="rounded-3xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{stat.label}</p>
                                    <p className={`mt-1 text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-3xl border border-slate-100 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
                                {loading ? "Loading stats..." : "No attendance data for this month."}
                            </div>
                        )}
                    </div>

                    <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
                        <div className="grid grid-cols-[140px_1fr_160px_200px] items-center border-b border-slate-100 px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            <span>Date</span>
                            <span>Day</span>
                            <span className="text-center">Status</span>
                            <span className="text-right">Actions</span>
                        </div>

                        {loading ? (
                            <div className="px-6 py-6 text-sm text-slate-500">Loading attendance...</div>
                        ) : entries.length === 0 ? (
                            <div className="px-6 py-6 text-sm text-slate-500">No attendance entries for this month.</div>
                        ) : (
                            entries.map((entry, idx) => (
                                <div
                                    key={`${entry.dayNumber}-${entry.dateLabel}`}
                                    className={`grid grid-cols-[140px_1fr_160px_200px] items-center px-6 py-4 text-sm font-semibold text-slate-800 ${idx !== entries.length - 1 ? "border-b border-slate-100" : ""}`}
                                >
                                    <div className="leading-tight">
                                        <p>{entry.dateLabel}</p>
                                    </div>
                                    <p className="text-slate-600">{entry.dayLabel}</p>
                                    <div className="flex items-center justify-center">
                                        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${entry.status.tone}`}>
                                            {entry.status.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 text-[11px]">
                                        <button
                                            className="rounded-md border border-slate-200 bg-white px-3 py-1 font-semibold uppercase text-slate-600 hover:bg-slate-50"
                                            onClick={() => setSelectedEntryDay(entry.dayNumber)}
                                        >
                                            Detail
                                        </button>
                                        <button
                                            className="rounded-md bg-slate-100 px-3 py-1 font-semibold uppercase text-slate-600 hover:bg-slate-200"
                                            onClick={() => setCommentDay(entry.dayNumber)}
                                        >
                                            Dispute
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {commentDay !== null ? (
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <p className="text-sm font-semibold text-slate-800">Dispute for day {commentDay}</p>
                            <p className="mt-1 text-xs text-slate-500">
                                Use this when you forgot to check in, the record is incorrect, or you worked offsite.
                            </p>
                            <textarea
                                className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
                                rows={3}
                                value={commentText}
                                onChange={(event) => setCommentText(event.target.value)}
                                placeholder="Explain the attendance issue so HR can review."
                            />
                            <div className="mt-3 flex items-center gap-3">
                                <button
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                                    onClick={handleSubmitComment}
                                    disabled={commentSaving}
                                >
                                    {commentSaving ? "Submitting..." : "Submit Dispute"}
                                </button>
                                <button
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                    onClick={() => {
                                        setCommentDay(null);
                                        setCommentText("");
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {selectedEntry ? (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                            <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="text-lg font-semibold text-slate-900">Attendance Detail</p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {selectedEntry.dateLabel} · {selectedEntry.dayLabel}
                                        </p>
                                    </div>
                                    <button
                                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                        onClick={() => setSelectedEntryDay(null)}
                                    >
                                        Close
                                    </button>
                                </div>

                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Status</p>
                                        <p className="mt-1 text-sm font-bold text-slate-800">{selectedEntry.status.label}</p>
                                    </div>
                                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Work Hours</p>
                                        <p className="mt-1 text-sm font-bold text-slate-800">
                                            {selectedEntry.workHours === null ? "--" : `${selectedEntry.workHours.toFixed(2)} h`}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Check In</p>
                                        <p className="mt-1 text-sm font-bold text-slate-800">{selectedEntry.checkIn || "--"}</p>
                                    </div>
                                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Check Out</p>
                                        <p className="mt-1 text-sm font-bold text-slate-800">{selectedEntry.checkOut || "--"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </section>
    );
}

