import type { CalendarEvent } from "@/types/dashboard";

export type BirthdayEntry = {
    id: string;
    name: string;
    birthDate: string;
};

function asText(value: unknown) {
    if (typeof value === "string") {
        return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
    }

    return "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    return value as Record<string, unknown>;
}

function asRecords(value: unknown): Record<string, unknown>[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((item) => asRecord(item))
        .filter((item): item is Record<string, unknown> => Boolean(item));
}

function normalizeBirthdayDate(value: unknown) {
    const raw = asText(value);
    if (!raw) {
        return "";
    }

    const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymd) {
        return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
    }

    const md = raw.match(/^(\d{2})-(\d{2})$/);
    if (md) {
        return `${md[1]}-${md[2]}`;
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
        return "";
    }

    const year = parsed.getFullYear();
    const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
    const day = `${parsed.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function extractMonthDay(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    const ymd = trimmed.match(/^\d{4}-(\d{2})-(\d{2})/);
    if (ymd) {
        return `${ymd[1]}-${ymd[2]}`;
    }

    const md = trimmed.match(/^(\d{2})-(\d{2})$/);
    if (md) {
        return `${md[1]}-${md[2]}`;
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
    const day = `${parsed.getDate()}`.padStart(2, "0");
    return `${month}-${day}`;
}

function normalizeBirthdayRecord(record: Record<string, unknown>): BirthdayEntry | null {
    const id = asText(record.id ?? record.ID);
    const name = asText(record.full_name ?? record.FullName ?? record.name ?? record.Name);
    const birthDate = normalizeBirthdayDate(
        record.birth_date ??
            record.BirthDate ??
            record.date_of_birth ??
            record.dateOfBirth ??
            record.birthday,
    );

    if (!name || !birthDate) {
        return null;
    }

    return {
        id: id || `${name}-${birthDate}`,
        name,
        birthDate,
    };
}

export function extractBirthdayEntries(payload: unknown): BirthdayEntry[] {
    const root = asRecord(payload);
    const candidates: unknown[] = [];

    if (Array.isArray(payload)) {
        candidates.push(payload);
    }

    if (root) {
        candidates.push(
            root.employees,
            root.data,
            asRecord(root.data)?.employees,
            root.body,
            asRecord(root.body)?.employees,
            asRecord(root.body)?.data,
            asRecord(asRecord(root.body)?.data)?.employees,
        );
    }

    for (const candidate of candidates) {
        const records = asRecords(candidate);
        if (!records.length) {
            continue;
        }

        const unique = new Map<string, BirthdayEntry>();
        for (const record of records) {
            const normalized = normalizeBirthdayRecord(record);
            if (!normalized) {
                continue;
            }

            const key = `${normalized.id}|${normalized.birthDate}|${normalized.name}`;
            unique.set(key, normalized);
        }

        return Array.from(unique.values());
    }

    return [];
}

export function toCalendarEvents(entries: BirthdayEntry[]): CalendarEvent[] {
    return entries
        .map((entry) => ({
            id: entry.id,
            name: entry.name,
            date: entry.birthDate,
        }))
        .sort((left, right) => left.date.localeCompare(right.date) || left.name.localeCompare(right.name));
}

export function filterBirthdaysByDate(entries: BirthdayEntry[], date = new Date()) {
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    const target = `${month}-${day}`;

    return entries.filter((entry) => extractMonthDay(entry.birthDate) === target);
}

