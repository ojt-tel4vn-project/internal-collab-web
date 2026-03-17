"use client";

import { useEffect, useMemo, useState } from "react";
import { extractBirthdayEntries, filterBirthdaysByDate } from "@/lib/birthdays";

type ProfileSummary = {
    id?: unknown;
    email?: unknown;
    employee_code?: unknown;
    data?: {
        id?: unknown;
        email?: unknown;
        employee_code?: unknown;
    };
    body?: {
        id?: unknown;
        email?: unknown;
        employee_code?: unknown;
        data?: {
            id?: unknown;
            email?: unknown;
            employee_code?: unknown;
        };
    };
};

const STORAGE_PREFIX = "birthday_announcement_seen";

function asText(value: unknown) {
    if (typeof value === "string") {
        return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
    }

    return "";
}

function getProfileIdentifier(payload: ProfileSummary | null) {
    if (!payload) {
        return "";
    }

    const rootId = asText(payload.id);
    if (rootId) {
        return rootId;
    }

    const rootCode = asText(payload.employee_code);
    if (rootCode) {
        return rootCode;
    }

    const rootEmail = asText(payload.email);
    if (rootEmail) {
        return rootEmail;
    }

    const bodyId = asText(payload.body?.id ?? payload.body?.data?.id ?? payload.data?.id);
    if (bodyId) {
        return bodyId;
    }

    const bodyCode = asText(
        payload.body?.employee_code ?? payload.body?.data?.employee_code ?? payload.data?.employee_code,
    );
    if (bodyCode) {
        return bodyCode;
    }

    return asText(payload.body?.email ?? payload.body?.data?.email ?? payload.data?.email);
}

function getTodayKey(now = new Date()) {
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, "0");
    const day = `${now.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function BirthdayAnnouncementModal() {
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

        async function checkBirthdays() {
            try {
                const [profileRes, birthdaysRes] = await Promise.all([
                    fetch("/api/employee/me", { cache: "no-store" }),
                    fetch("/api/employee/birthdays", { cache: "no-store" }),
                ]);

                if (!profileRes.ok || !birthdaysRes.ok) {
                    return;
                }

                const profilePayload = (await profileRes.json().catch(() => null)) as ProfileSummary | null;
                const profileId = getProfileIdentifier(profilePayload);
                if (!profileId) {
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

                const storageKey = `${STORAGE_PREFIX}:${profileId}:${getTodayKey()}`;
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
            } catch {
                // Ignore transient fetch errors.
            }
        }

        void checkBirthdays();

        return () => {
            isCancelled = true;
        };
    }, []);

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

