"use client";

import { useEffect, useMemo, useState } from "react";
import { extractBirthdayEntries, filterBirthdaysByDate } from "@/lib/birthdays";

type BirthdayNotificationConfig = {
    enabled: boolean;
    notificationTime: string;
    channels: string[];
};

const STORAGE_PREFIX = "birthday_announcement_seen";
const DEFAULT_NOTIFICATION_TIME = "09:00";

function asText(value: unknown) {
    if (typeof value === "string") {
        return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
    }

    return "";
}

function getTodayKey(now = new Date()) {
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, "0");
    const day = `${now.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    return value as Record<string, unknown>;
}

function asBoolean(value: unknown, fallback: boolean) {
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
        .map((entry) => asText(entry).toLowerCase())
        .filter(Boolean);
}

function findConfigRecord(payload: unknown): Record<string, unknown> | null {
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

        if (candidate.enabled !== undefined || candidate.notification_time !== undefined || candidate.channels !== undefined) {
            return candidate;
        }
    }

    return null;
}

function parseBirthdayNotificationConfig(payload: unknown): BirthdayNotificationConfig | null {
    const record = findConfigRecord(payload);
    if (!record) {
        return null;
    }

    const channels = asStringArray(record.channels);

    return {
        enabled: asBoolean(record.enabled, true),
        notificationTime: asText(record.notification_time) || DEFAULT_NOTIFICATION_TIME,
        channels,
    };
}

function getNotificationDelayMs(notificationTime: string, now = new Date()) {
    const match = notificationTime.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!match) {
        return 0;
    }

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    const scheduled = new Date(now);
    scheduled.setHours(hour, minute, 0, 0);

    const diff = scheduled.getTime() - now.getTime();
    return diff > 0 ? diff : 0;
}

export function BirthdayAnnouncementModal({
    userId,
}: {
    userId?: string | null;
}) {
    const [names, setNames] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const title = useMemo(() => {
        if (names.length <= 1) {
            return "Today's Birthday";
        }

        return "Today's Birthdays";
    }, [names.length]);

    useEffect(() => {
        let isCancelled = false;
        let timerId: number | null = null;

        async function checkBirthdays() {
            try {
                const [birthdaysRes, configRes] = await Promise.all([
                    fetch("/api/employee/birthdays", { cache: "no-store" }),
                    fetch("/api/employee/birthdays/config", { cache: "no-store" }),
                ]);

                if (!birthdaysRes.ok || !configRes.ok) {
                    return;
                }

                const configPayload = (await configRes.json().catch(() => null)) as unknown;
                const config = parseBirthdayNotificationConfig(configPayload);
                if (!config || !config.enabled || !config.channels.includes("in_app")) {
                    return;
                }

                const birthdayPayload = (await birthdaysRes.json()) as unknown;
                const birthdayEntries = extractBirthdayEntries(birthdayPayload);
                const todayBirthdays = filterBirthdaysByDate(birthdayEntries);
                if (todayBirthdays.length === 0) {
                    return;
                }

                const uniqueNames = Array.from(
                    new Set(
                        todayBirthdays
                            .map((entry) => entry.name.trim())
                            .filter(Boolean),
                    ),
                );
                if (uniqueNames.length === 0) {
                    return;
                }

                const profileId = asText(userId) || "anonymous";
                const storageKey = `${STORAGE_PREFIX}:${profileId}:${getTodayKey()}`;
                const showModal = () => {
                    try {
                        const seen = window.localStorage.getItem(storageKey);
                        if (seen === "1") {
                            return;
                        }
                        window.localStorage.setItem(storageKey, "1");
                    } catch {
                        // Ignore storage access errors.
                    }

                    if (!isCancelled) {
                        setNames(uniqueNames);
                        setIsOpen(true);
                    }
                };

                const delayMs = getNotificationDelayMs(config.notificationTime);
                if (delayMs > 0) {
                    timerId = window.setTimeout(showModal, delayMs);
                } else {
                    try {
                        const seen = window.localStorage.getItem(storageKey);
                        if (seen === "1") {
                            return;
                        }
                    } catch {
                        // Ignore storage access errors.
                    }
                    showModal();
                }
            } catch {
                // Ignore transient fetch errors.
            }
        }

        void checkBirthdays();

        return () => {
            isCancelled = true;
            if (timerId !== null) {
                window.clearTimeout(timerId);
            }
        };
    }, [userId]);

    if (!isOpen || names.length === 0) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/45 px-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {names.length === 1
                                ? "Let's celebrate our teammate today."
                                : `There are ${names.length} teammates celebrating today.`}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
                        aria-label="Close birthday modal"
                    >
                        x
                    </button>
                </div>

                <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                    <ul className="space-y-1 text-sm font-semibold text-slate-800">
                        {names.map((name) => (
                            <li key={name} className="truncate" title={name}>
                                {name}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mt-5 flex justify-end">
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
