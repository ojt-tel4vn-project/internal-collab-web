"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { QuotaConfigurationSection } from "@/components/configuration/QuotaConfigurationSection";

type AttendanceConfiguration = {
    confirmationDeadlineDays: number;
    autoConfirmEnabled: boolean;
    reminderBeforeDeadlineDays: number;
};

type PointConfiguration = {
    yearlyPoints: number;
    resetMonth: number;
    resetDay: number;
};

type BirthdayConfiguration = {
    enabled: boolean;
    notificationTime: string;
    channels: string[];
};

const DEFAULT_ATTENDANCE_CONFIGURATION: AttendanceConfiguration = {
    confirmationDeadlineDays: 5,
    autoConfirmEnabled: true,
    reminderBeforeDeadlineDays: 2,
};

const DEFAULT_POINT_CONFIGURATION: PointConfiguration = {
    yearlyPoints: 500,
    resetMonth: 1,
    resetDay: 1,
};

const DEFAULT_BIRTHDAY_CONFIGURATION: BirthdayConfiguration = {
    enabled: true,
    notificationTime: "09:00",
    channels: ["in_app", "email"],
};

const BIRTHDAY_CHANNEL_OPTIONS = [
    { label: "In App", value: "in_app" },
    { label: "Email", value: "email" },
] as const;

const HOUR_12_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));
const MERIDIEM_OPTIONS = ["AM", "PM"] as const;
const CONFIG_TABS = [
    { id: "attendance", label: "Attendance" },
    { id: "point", label: "Point" },
    { id: "birthday", label: "Birthday" },
    { id: "quota", label: "Quota" },
] as const;

type ConfigurationTab = (typeof CONFIG_TABS)[number]["id"];

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

function asBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "true") {
            return true;
        }

        if (normalized === "false") {
            return false;
        }
    }

    return fallback;
}

function asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((entry) => asText(entry))
        .filter(Boolean);
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

function findConfigRecord(payload: unknown, keys: string[]): Record<string, unknown> | null {
    const root = asRecord(payload);
    const body = asRecord(root?.body);
    const data = asRecord(root?.data);

    const candidates = [
        asRecord(body?.data),
        asRecord(data?.data),
        asRecord(root?.data),
        body,
        data,
        root,
    ];

    for (const candidate of candidates) {
        if (!candidate) {
            continue;
        }

        if (keys.some((key) => candidate[key] !== undefined)) {
            return candidate;
        }
    }

    return null;
}

function parseAttendanceConfig(payload: unknown): AttendanceConfiguration | null {
    const record = findConfigRecord(payload, [
        "confirmation_deadline_days",
        "auto_confirm_enabled",
        "reminder_before_deadline_days",
    ]);

    if (!record) {
        return null;
    }

    return {
        confirmationDeadlineDays: asNumber(
            record.confirmation_deadline_days,
            DEFAULT_ATTENDANCE_CONFIGURATION.confirmationDeadlineDays,
        ),
        autoConfirmEnabled: asBoolean(
            record.auto_confirm_enabled,
            DEFAULT_ATTENDANCE_CONFIGURATION.autoConfirmEnabled,
        ),
        reminderBeforeDeadlineDays: asNumber(
            record.reminder_before_deadline_days,
            DEFAULT_ATTENDANCE_CONFIGURATION.reminderBeforeDeadlineDays,
        ),
    };
}

function parsePointConfig(payload: unknown): PointConfiguration | null {
    const record = findConfigRecord(payload, ["yearly_points", "reset_month", "reset_day"]);
    if (!record) {
        return null;
    }

    return {
        yearlyPoints: asNumber(record.yearly_points, DEFAULT_POINT_CONFIGURATION.yearlyPoints),
        resetMonth: asNumber(record.reset_month, DEFAULT_POINT_CONFIGURATION.resetMonth),
        resetDay: asNumber(record.reset_day, DEFAULT_POINT_CONFIGURATION.resetDay),
    };
}

function parseBirthdayConfig(payload: unknown): BirthdayConfiguration | null {
    const record = findConfigRecord(payload, ["enabled", "notification_time", "channels"]);
    if (!record) {
        return null;
    }

    const channels = asStringArray(record.channels);

    return {
        enabled: asBoolean(record.enabled, DEFAULT_BIRTHDAY_CONFIGURATION.enabled),
        notificationTime: asText(record.notification_time) || DEFAULT_BIRTHDAY_CONFIGURATION.notificationTime,
        channels: channels.length > 0 ? channels : DEFAULT_BIRTHDAY_CONFIGURATION.channels,
    };
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

function maxDayInMonth(month: number): number {
    const monthDays = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return monthDays[month - 1] ?? 31;
}

function formatTimeAsAmPm(value: string): string {
    const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!match) {
        return "--";
    }

    const hour24 = Number(match[1]);
    const minute = match[2];
    const period = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

    return `${String(hour12).padStart(2, "0")}:${minute} ${period}`;
}

type NotificationTimeParts = {
    hour: string;
    minute: string;
    period: (typeof MERIDIEM_OPTIONS)[number];
};

function splitNotificationTime(value: string): NotificationTimeParts {
    const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!match) {
        return { hour: "09", minute: "00", period: "AM" };
    }

    const hour24 = Number(match[1]);
    const minute = match[2];
    const period: NotificationTimeParts["period"] = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

    return {
        hour: String(hour12).padStart(2, "0"),
        minute,
        period,
    };
}

function composeNotificationTime(
    hour: string,
    minute: string,
    period: NotificationTimeParts["period"],
): string {
    const hourNumber = Number(hour);
    const minuteNumber = Number(minute);

    const isValidHour = Number.isInteger(hourNumber) && hourNumber >= 1 && hourNumber <= 12;
    const isValidMinute = Number.isInteger(minuteNumber) && minuteNumber >= 0 && minuteNumber <= 59;
    if (!isValidHour || !isValidMinute) {
        return DEFAULT_BIRTHDAY_CONFIGURATION.notificationTime;
    }

    let hour24 = hourNumber % 12;
    if (period === "PM") {
        hour24 += 12;
    }

    return `${String(hour24).padStart(2, "0")}:${String(minuteNumber).padStart(2, "0")}`;
}

export default function HrConfigurationPage() {
    const [attendanceConfig, setAttendanceConfig] = useState<AttendanceConfiguration>(
        DEFAULT_ATTENDANCE_CONFIGURATION,
    );
    const [pointConfig, setPointConfig] = useState<PointConfiguration>(DEFAULT_POINT_CONFIGURATION);
    const [birthdayConfig, setBirthdayConfig] = useState<BirthdayConfiguration>(
        DEFAULT_BIRTHDAY_CONFIGURATION,
    );

    const [isLoading, setIsLoading] = useState(true);
    const [attendanceLoadError, setAttendanceLoadError] = useState<string | null>(null);
    const [pointLoadError, setPointLoadError] = useState<string | null>(null);
    const [birthdayLoadError, setBirthdayLoadError] = useState<string | null>(null);

    const [attendanceSaving, setAttendanceSaving] = useState(false);
    const [attendanceSuccess, setAttendanceSuccess] = useState<string | null>(null);
    const [attendanceError, setAttendanceError] = useState<string | null>(null);

    const [pointSaving, setPointSaving] = useState(false);
    const [pointSuccess, setPointSuccess] = useState<string | null>(null);
    const [pointError, setPointError] = useState<string | null>(null);

    const [birthdaySaving, setBirthdaySaving] = useState(false);
    const [birthdaySuccess, setBirthdaySuccess] = useState<string | null>(null);
    const [birthdayError, setBirthdayError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ConfigurationTab>("attendance");

    const birthdayTimeParts = useMemo(
        () => splitNotificationTime(birthdayConfig.notificationTime),
        [birthdayConfig.notificationTime],
    );

    const loadConfigurations = useCallback(async () => {
        setIsLoading(true);
        setAttendanceLoadError(null);
        setPointLoadError(null);
        setBirthdayLoadError(null);

        try {
            const [attendanceResponse, pointResponse, birthdayResponse] = await Promise.all([
                fetch("/api/hr/attendance-config", { cache: "no-store" }),
                fetch("/api/hr/point-config", { cache: "no-store" }),
                fetch("/api/hr/birthday-config", { cache: "no-store" }),
            ]);

            if (attendanceResponse.ok) {
                const payload = (await attendanceResponse.json().catch(() => null)) as unknown;
                const parsed = parseAttendanceConfig(payload);
                if (parsed) {
                    setAttendanceConfig(parsed);
                }
            } else {
                const raw = await attendanceResponse.text().catch(() => "");
                setAttendanceLoadError(
                    parseErrorMessage(raw, "Unable to load attendance configuration."),
                );
            }

            if (pointResponse.ok) {
                const payload = (await pointResponse.json().catch(() => null)) as unknown;
                const parsed = parsePointConfig(payload);

                if (parsed) {
                    setPointConfig(parsed);
                } else {
                    setPointLoadError("Unable to load point configuration.");
                }
            } else {
                const raw = await pointResponse.text().catch(() => "");
                setPointLoadError(
                    parseErrorMessage(
                        raw,
                        "Unable to load point configuration.",
                    ),
                );
            }

            if (birthdayResponse.ok) {
                const payload = (await birthdayResponse.json().catch(() => null)) as unknown;
                const parsed = parseBirthdayConfig(payload);

                if (parsed) {
                    setBirthdayConfig(parsed);
                } else {
                    setBirthdayLoadError("Unable to load birthday configuration.");
                }
            } else {
                const raw = await birthdayResponse.text().catch(() => "");
                setBirthdayLoadError(
                    parseErrorMessage(
                        raw,
                        "Unable to load birthday configuration.",
                    ),
                );
            }
        } catch (error) {
            const fallback = error instanceof Error ? error.message : "Unable to load configuration.";
            setAttendanceLoadError(fallback);
            setPointLoadError("Unable to load point configuration.");
            setBirthdayLoadError("Unable to load birthday configuration.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadConfigurations();
    }, [loadConfigurations]);

    const handleSaveAttendance = async () => {
        setAttendanceError(null);
        setAttendanceSuccess(null);

        const deadline = Math.trunc(attendanceConfig.confirmationDeadlineDays);
        const reminder = Math.trunc(attendanceConfig.reminderBeforeDeadlineDays);

        if (deadline < 1 || deadline > 30) {
            setAttendanceError("Confirmation deadline must be between 1 and 30 days.");
            return;
        }

        if (reminder < 0 || reminder > 10) {
            setAttendanceError("Reminder before deadline must be between 0 and 10 days.");
            return;
        }

        if (reminder > deadline) {
            setAttendanceError("Reminder days cannot be greater than confirmation deadline days.");
            return;
        }

        setAttendanceSaving(true);
        try {
            const response = await fetch("/api/hr/attendance-config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    confirmation_deadline_days: deadline,
                    auto_confirm_enabled: attendanceConfig.autoConfirmEnabled,
                    reminder_before_deadline_days: reminder,
                }),
            });

            const raw = await response.text().catch(() => "");
            if (!response.ok) {
                throw new Error(
                    parseErrorMessage(raw, `Unable to update attendance configuration (HTTP ${response.status}).`),
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

            setAttendanceConfig((current) => ({
                ...current,
                confirmationDeadlineDays: deadline,
                reminderBeforeDeadlineDays: reminder,
            }));
            setAttendanceSuccess(parseSuccessMessage(payload, "Attendance configuration updated."));
        } catch (error) {
            setAttendanceError(
                error instanceof Error ? error.message : "Unable to update attendance configuration.",
            );
        } finally {
            setAttendanceSaving(false);
        }
    };

    const handleSavePoint = async () => {
        setPointError(null);
        setPointSuccess(null);

        const yearlyPoints = Math.trunc(pointConfig.yearlyPoints);
        const resetMonth = Math.trunc(pointConfig.resetMonth);
        const resetDay = Math.trunc(pointConfig.resetDay);

        if (yearlyPoints < 1) {
            setPointError("Yearly points must be greater than 0.");
            return;
        }

        if (resetMonth < 1 || resetMonth > 12) {
            setPointError("Reset month must be between 1 and 12.");
            return;
        }

        if (resetDay < 1 || resetDay > maxDayInMonth(resetMonth)) {
            setPointError(`Reset day must be between 1 and ${maxDayInMonth(resetMonth)} for the selected month.`);
            return;
        }

        setPointSaving(true);
        try {
            const response = await fetch("/api/hr/point-config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    yearly_points: yearlyPoints,
                    reset_month: resetMonth,
                    reset_day: resetDay,
                }),
            });

            const raw = await response.text().catch(() => "");
            if (!response.ok) {
                throw new Error(
                    parseErrorMessage(raw, `Unable to update point configuration (HTTP ${response.status}).`),
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

            setPointConfig((current) => ({
                ...current,
                yearlyPoints,
                resetMonth,
                resetDay,
            }));
            setPointSuccess(parseSuccessMessage(payload, "Point configuration updated."));
        } catch (error) {
            setPointError(error instanceof Error ? error.message : "Unable to update point configuration.");
        } finally {
            setPointSaving(false);
        }
    };

    const handleSaveBirthday = async () => {
        setBirthdayError(null);
        setBirthdaySuccess(null);

        const notificationTime = birthdayConfig.notificationTime.trim();
        if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(notificationTime)) {
            setBirthdayError("Notification time must be in HH:mm format.");
            return;
        }

        const channels = Array.from(new Set(birthdayConfig.channels.map((item) => item.trim()).filter(Boolean)));
        if (channels.length === 0) {
            setBirthdayError("Please select at least one notification channel.");
            return;
        }

        setBirthdaySaving(true);
        try {
            const response = await fetch("/api/hr/birthday-config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    enabled: birthdayConfig.enabled,
                    notification_time: notificationTime,
                    channels,
                }),
            });

            const raw = await response.text().catch(() => "");
            if (!response.ok) {
                throw new Error(
                    parseErrorMessage(raw, `Unable to update birthday configuration (HTTP ${response.status}).`),
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

            setBirthdayConfig((current) => ({
                ...current,
                notificationTime,
                channels,
            }));
            setBirthdaySuccess(parseSuccessMessage(payload, "Birthday configuration updated."));
        } catch (error) {
            setBirthdayError(error instanceof Error ? error.message : "Unable to update birthday configuration.");
        } finally {
            setBirthdaySaving(false);
        }
    };

    return (
                        <section className="w-full space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Configuration</h1>
                            <p className="text-sm text-slate-500">
                                Manage attendance, point, birthday, and quota configuration from one place.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => void loadConfigurations()}
                            disabled={isLoading}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isLoading ? "Loading..." : "Refresh"}
                        </button>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                        <div
                            role="tablist"
                            aria-label="Configuration sections"
                            className="flex flex-wrap gap-2"
                        >
                            {CONFIG_TABS.map((tab) => {
                                const isActive = activeTab === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                                            isActive
                                                ? "bg-blue-600 text-white shadow-sm"
                                                : "text-slate-600 hover:bg-slate-100"
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {activeTab === "attendance" ? (
                        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="space-y-1">
                                <h2 className="text-xl font-semibold text-slate-950">Attendance Configuration</h2>
                                <p className="text-sm text-slate-500">
                                    Define attendance confirmation timeline and reminder behavior for employees.
                                </p>
                            </div>

                            {attendanceLoadError ? (
                                <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    {attendanceLoadError}
                                </div>
                            ) : null}

                            <form
                                className="mt-5 space-y-4"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    void handleSaveAttendance();
                                }}
                            >
                                <div className="space-y-2">
                                    <label htmlFor="attendance-deadline" className="text-sm font-semibold text-slate-700">
                                        Confirmation Deadline (days)
                                    </label>
                                    <input
                                        id="attendance-deadline"
                                        type="number"
                                        min={1}
                                        max={30}
                                        value={attendanceConfig.confirmationDeadlineDays}
                                        onChange={(event) => setAttendanceConfig((current) => ({
                                            ...current,
                                            confirmationDeadlineDays: Number(event.target.value),
                                        }))}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="attendance-reminder" className="text-sm font-semibold text-slate-700">
                                        Reminder Before Deadline (days)
                                    </label>
                                    <input
                                        id="attendance-reminder"
                                        type="number"
                                        min={0}
                                        max={10}
                                        value={attendanceConfig.reminderBeforeDeadlineDays}
                                        onChange={(event) => setAttendanceConfig((current) => ({
                                            ...current,
                                            reminderBeforeDeadlineDays: Number(event.target.value),
                                        }))}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                                    />
                                </div>

                                <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <span className="text-sm font-semibold text-slate-700">Enable Auto Confirm</span>
                                    <input
                                        type="checkbox"
                                        checked={attendanceConfig.autoConfirmEnabled}
                                        onChange={(event) => setAttendanceConfig((current) => ({
                                            ...current,
                                            autoConfirmEnabled: event.target.checked,
                                        }))}
                                        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </label>

                                {attendanceError ? (
                                    <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                        {attendanceError}
                                    </div>
                                ) : null}

                                {attendanceSuccess ? (
                                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                        {attendanceSuccess}
                                    </div>
                                ) : null}

                                <button
                                    type="submit"
                                    disabled={attendanceSaving}
                                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                                >
                                    {attendanceSaving ? "Saving..." : "Save Attendance Configuration"}
                                </button>
                            </form>
                        </section>
                        ) : null}

                        {activeTab === "point" ? (
                        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="space-y-1">
                                <h2 className="text-xl font-semibold text-slate-950">Point Configuration</h2>
                                <p className="text-sm text-slate-500">
                                    Configure yearly points and reset date used by the rewards system.
                                </p>
                            </div>

                            {pointLoadError ? (
                                <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    {pointLoadError}
                                </div>
                            ) : null}

                            <form
                                className="mt-5 space-y-4"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    void handleSavePoint();
                                }}
                            >
                                <div className="space-y-2">
                                    <label htmlFor="yearly-points" className="text-sm font-semibold text-slate-700">
                                        Yearly Points Per Employee
                                    </label>
                                    <input
                                        id="yearly-points"
                                        type="number"
                                        min={1}
                                        value={pointConfig.yearlyPoints}
                                        onChange={(event) => setPointConfig((current) => ({
                                            ...current,
                                            yearlyPoints: Number(event.target.value),
                                        }))}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label htmlFor="reset-month" className="text-sm font-semibold text-slate-700">
                                            Reset Month
                                        </label>
                                        <input
                                            id="reset-month"
                                            type="number"
                                            min={1}
                                            max={12}
                                            value={pointConfig.resetMonth}
                                            onChange={(event) => setPointConfig((current) => ({
                                                ...current,
                                                resetMonth: Number(event.target.value),
                                            }))}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="reset-day" className="text-sm font-semibold text-slate-700">
                                            Reset Day
                                        </label>
                                        <input
                                            id="reset-day"
                                            type="number"
                                            min={1}
                                            max={31}
                                            value={pointConfig.resetDay}
                                            onChange={(event) => setPointConfig((current) => ({
                                                ...current,
                                                resetDay: Number(event.target.value),
                                            }))}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                                        />
                                    </div>
                                </div>

                                {pointError ? (
                                    <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                        {pointError}
                                    </div>
                                ) : null}

                                {pointSuccess ? (
                                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                        {pointSuccess}
                                    </div>
                                ) : null}

                                <button
                                    type="submit"
                                    disabled={pointSaving}
                                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                                >
                                    {pointSaving ? "Saving..." : "Save Point Configuration"}
                                </button>
                            </form>
                        </section>
                        ) : null}

                        {activeTab === "birthday" ? (
                        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="space-y-1">
                                <h2 className="text-xl font-semibold text-slate-950">Birthday Configuration</h2>
                                <p className="text-sm text-slate-500">
                                    Configure birthday notification settings for the whole company.
                                </p>
                            </div>

                            {birthdayLoadError ? (
                                <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    {birthdayLoadError}
                                </div>
                            ) : null}

                            <form
                                className="mt-5 space-y-4"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    void handleSaveBirthday();
                                }}
                            >
                                <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <span className="text-sm font-semibold text-slate-700">Enable Birthday Notifications</span>
                                    <input
                                        type="checkbox"
                                        checked={birthdayConfig.enabled}
                                        onChange={(event) => setBirthdayConfig((current) => ({
                                            ...current,
                                            enabled: event.target.checked,
                                        }))}
                                        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </label>

                                <div className="space-y-2">
                                    <label htmlFor="birthday-notification-time" className="text-sm font-semibold text-slate-700">
                                        Notification Time
                                    </label>
                                    <div id="birthday-notification-time" className="grid gap-2 sm:grid-cols-3">
                                        <select
                                            aria-label="Notification hour"
                                            value={birthdayTimeParts.hour}
                                            onChange={(event) => setBirthdayConfig((current) => ({
                                                ...current,
                                                notificationTime: composeNotificationTime(
                                                    event.target.value,
                                                    birthdayTimeParts.minute,
                                                    birthdayTimeParts.period,
                                                ),
                                            }))}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                                        >
                                            {HOUR_12_OPTIONS.map((hour) => (
                                                <option key={hour} value={hour}>{hour}</option>
                                            ))}
                                        </select>

                                        <select
                                            aria-label="Notification minute"
                                            value={birthdayTimeParts.minute}
                                            onChange={(event) => setBirthdayConfig((current) => ({
                                                ...current,
                                                notificationTime: composeNotificationTime(
                                                    birthdayTimeParts.hour,
                                                    event.target.value,
                                                    birthdayTimeParts.period,
                                                ),
                                            }))}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                                        >
                                            {MINUTE_OPTIONS.map((minute) => (
                                                <option key={minute} value={minute}>{minute}</option>
                                            ))}
                                        </select>

                                        <select
                                            aria-label="Notification period"
                                            value={birthdayTimeParts.period}
                                            onChange={(event) => setBirthdayConfig((current) => ({
                                                ...current,
                                                notificationTime: composeNotificationTime(
                                                    birthdayTimeParts.hour,
                                                    birthdayTimeParts.minute,
                                                    event.target.value as NotificationTimeParts["period"],
                                                ),
                                            }))}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                                        >
                                            {MERIDIEM_OPTIONS.map((period) => (
                                                <option key={period} value={period}>{period}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Display time: {formatTimeAsAmPm(birthdayConfig.notificationTime)}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-slate-700">Channels</p>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {BIRTHDAY_CHANNEL_OPTIONS.map((option) => {
                                            const checked = birthdayConfig.channels.includes(option.value);

                                            return (
                                                <label key={option.value} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={(event) => setBirthdayConfig((current) => {
                                                            if (event.target.checked) {
                                                                return {
                                                                    ...current,
                                                                    channels: Array.from(new Set([...current.channels, option.value])),
                                                                };
                                                            }

                                                            return {
                                                                ...current,
                                                                channels: current.channels.filter((item) => item !== option.value),
                                                            };
                                                        })}
                                                        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span>{option.label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                {birthdayError ? (
                                    <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                        {birthdayError}
                                    </div>
                                ) : null}

                                {birthdaySuccess ? (
                                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                        {birthdaySuccess}
                                    </div>
                                ) : null}

                                <button
                                    type="submit"
                                    disabled={birthdaySaving}
                                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                                >
                                    {birthdaySaving ? "Saving..." : "Save Birthday Configuration"}
                                </button>
                            </form>
                        </section>
                        ) : null}

                        {activeTab === "quota" ? (
                        <QuotaConfigurationSection
                            leaveTypesEndpoint="/api/hr/leave-types"
                            updateLeaveTypeEndpointBase="/api/hr/leave-types"
                            description="Load leave type quota defaults and update total days."
                        />
                        ) : null}
                    </div>
                </section>
    );
}

