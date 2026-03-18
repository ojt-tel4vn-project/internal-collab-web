export type ApiErrorPayload = {
    message?: string;
    detail?: string;
    title?: string;
    error?: string;
};

export function parseApiErrorMessage(raw: string, fallback: string, maxLength = 200) {
    if (!raw) return fallback;

    try {
        const parsed = JSON.parse(raw) as ApiErrorPayload;
        return parsed.message || parsed.detail || parsed.title || parsed.error || fallback;
    } catch {
        return raw.slice(0, maxLength);
    }
}
