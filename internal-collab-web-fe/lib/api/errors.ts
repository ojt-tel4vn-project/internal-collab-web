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

const TECHNICAL_ERROR_PATTERNS = [
    /^\[object object\]$/i,
    /\bat\s+\S+/i,
    /\bobject object\b/i,
    /\b(?:type|reference|syntax|range|runtime)error\b/i,
    /\btraceback\b/i,
    /\bexception\b/i,
    /\bhttp\s*\d{3}\b/i,
    /\bstatus\s*code\b/i,
    /\bfailed to fetch\b/i,
    /\bfetch failed\b/i,
    /\bnetwork ?error\b/i,
    /\btimeout\b/i,
    /\btimed out\b/i,
    /\binternal server error\b/i,
    /\bbad gateway\b/i,
    /\bservice unavailable\b/i,
    /\bgateway timeout\b/i,
    /\bproxy\b/i,
    /\bpayload\b/i,
    /\btostring\b/i,
    /\bjson\b/i,
    /\bhtml\b/i,
    /\bsql\b/i,
    /\bconstraint\b/i,
    /\bundefined\b/i,
    /\bnull\b/i,
    /\bcannot read properties\b/i,
    /<[a-z][\s\S]*>/i,
    /[a-z0-9]+_[a-z0-9]+/i,
];

function extractApiMessage(raw: string, fallback: string, maxLength = 200) {
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

export function toUserFriendlyErrorMessage(message: string | null | undefined, fallback: string) {
    const normalized = message?.trim() ?? "";
    if (!normalized) {
        return fallback;
    }

    const lower = normalized.toLowerCase();

    if (lower.includes("unauthorized")) {
        return "Your session has expired. Please sign in again.";
    }

    if (lower.includes("forbidden") || lower.includes("access denied")) {
        return "You do not have permission to perform this action.";
    }

    if (lower.includes("receiver_employee_code") || lower.includes("receiver_email")) {
        return "We couldn't identify the selected teammate. Please choose a teammate again.";
    }

    if (lower.includes("sticker_type_id")) {
        return "The selected sticker is invalid. Please choose another sticker and try again.";
    }

    if (lower.includes("receiver not found")) {
        return "The selected teammate could not be found. Please choose another teammate.";
    }

    if (lower.includes("sticker type not found")) {
        return "The selected sticker is no longer available. Please choose another sticker.";
    }

    if (lower.includes("not enough points")) {
        return "You do not have enough points to complete this action.";
    }

    if (lower.includes("cannot send sticker to yourself")) {
        return "You can't send a sticker to yourself.";
    }

    if (lower.includes("invalid request payload")) {
        return "Some information is missing or invalid. Please review and try again.";
    }

    if (lower.includes("expected string to match pattern")) {
        if (normalized.includes("0[0-9]{9}") || normalized.includes("%+-]+@[a-zA-Z0-9.-]+")) {
            return "Contact during leave must be a valid phone number or email address.";
        }

        if (lower.includes("email")) {
            return "Please enter a valid email address.";
        }

        return fallback;
    }

    if (lower.includes("unexpected server response")) {
        return fallback;
    }

    if (lower.includes("unable to connect to server") || lower.includes("unable to connect to the server")) {
        return "The system is temporarily unavailable. Please try again in a moment.";
    }

    if (TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(normalized)) || normalized.includes("\n")) {
        return fallback;
    }

    return normalized;
}

export function toUserFriendlyError(error: unknown, fallback: string) {
    return toUserFriendlyErrorMessage(error instanceof Error ? error.message : "", fallback);
}

export function logErrorToConsole(scope: string, error: unknown, details?: unknown) {
    if (details === undefined) {
        console.error(`[${scope}]`, error);
        return;
    }

    console.error(`[${scope}]`, error, details);
}

export function parseApiErrorMessage(raw: string, fallback: string, maxLength = 200) {
    return toUserFriendlyErrorMessage(extractApiMessage(raw, fallback, maxLength), fallback);
}
