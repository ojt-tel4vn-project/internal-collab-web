import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function GridIcon(props: IconProps) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
            <rect x="3" y="3" width="8" height="8" rx="2" />
            <rect x="13" y="3" width="8" height="8" rx="2" />
            <rect x="3" y="13" width="8" height="8" rx="2" />
            <rect x="13" y="13" width="8" height="8" rx="2" />
        </svg>
    );
}

export function ClockIcon(props: IconProps) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </svg>
    );
}

export function CalendarIcon(props: IconProps) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
            <rect x="4" y="6" width="16" height="14" rx="3" />
            <path d="M8 4v4M16 4v4M4 10h16" />
        </svg>
    );
}

export function TrophyIcon(props: IconProps) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
            <path d="M7 5h10v4a5 5 0 1 1-10 0V5Z" />
            <path d="M7 5H4v2a4 4 0 0 0 4 4" />
            <path d="M17 5h3v2a4 4 0 0 1-4 4" />
            <path d="M12 14v3" />
            <path d="M9 20h6" />
        </svg>
    );
}

export function BellIcon(props: IconProps) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
            <path d="M18 14V11a6 6 0 1 0-12 0v3l-1.5 2.5a1 1 0 0 0 .85 1.5h15.3a1 1 0 0 0 .85-1.5L18 14Z" />
            <path d="M10 18a2 2 0 0 0 4 0" />
        </svg>
    );
}

export function NoteIcon(props: IconProps) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M7 4h8l4 4v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
            <path d="M15 4v4h4" />
        </svg>
    );
}

export function ChevronRightIcon(props: IconProps) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="m9 6 6 6-6 6" />
        </svg>
    );
}

export function ArrowUpRightIcon(props: IconProps) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M7 17 17 7M9 7h8v8" />
        </svg>
    );
}

export function MedalIcon(props: IconProps) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <circle cx="12" cy="8" r="4" />
            <path d="m8 12-2 8 6-3 6 3-2-8" />
        </svg>
    );
}

export function ChevronLeftIcon(props: IconProps) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="m15 6-6 6 6 6" />
        </svg>
    );
}

export function DocumentIcon(props: IconProps) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
            <path d="M14 3v5h5" />
        </svg>
    );
}

export function PencilIcon(props: IconProps) {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="m4 20 4-1 9-9-3-3-9 9-1 4Z" />
            <path d="m14 4 3 3" />
        </svg>
    );
}

export function TrashIcon(props: IconProps) {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M5 7h14" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 4h6l1 3H8l1-3Z" />
            <path d="M6 7h12v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7Z" />
        </svg>
    );
}

export function DownloadIcon(props: IconProps) {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M12 3v12" />
            <path d="m7 11 5 5 5-5" />
            <path d="M5 19h14" />
        </svg>
    );
}

export function AlertTriangleIcon(props: IconProps) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3l-8.47-14.14a2 2 0 0 0-3.42 0Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
        </svg>
    );
}

export function ChevronDownIcon(props: IconProps) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
}

export function CrownIcon(props: IconProps) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="m3 7 4 4 5-6 5 6 4-4v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Z" />
            <path d="M9 16h6" />
        </svg>
    );
}
