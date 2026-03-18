export function asFiniteNumber(value: unknown, fallback = 0) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
}

export function asString(value: unknown, fallback = "") {
    return typeof value === "string" ? value : fallback;
}

export function asTrimmedString(value: unknown, fallback = "", emptyAsFallback = false) {
    if (typeof value !== "string") {
        return fallback;
    }

    const trimmed = value.trim();
    return emptyAsFallback ? (trimmed || fallback) : trimmed;
}
