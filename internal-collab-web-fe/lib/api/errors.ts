export type ApiErrorPayload = {
    message?: string;
    detail?: string;
    title?: string;
    error?: string;
    errors?: Array<{
        message?: string;
        detail?: string;
        error?: string;
    }>;
};

export function parseApiErrorMessage(raw: string, fallback: string, maxLength = 200) {
    if (!raw) return fallback;

    try {
        const parsed = JSON.parse(raw) as ApiErrorPayload;
        if (Array.isArray(parsed.errors) && parsed.errors.length > 0) {
            const nestedMessage = parsed.errors
                .map((item) => item.message || item.detail || item.error || "")
                .find((value) => value.trim().length > 0);
            if (nestedMessage) {
                return nestedMessage;
            }
        }
        return parsed.message || parsed.detail || parsed.title || parsed.error || fallback;
    } catch {
        return raw.slice(0, maxLength);
    }
}
