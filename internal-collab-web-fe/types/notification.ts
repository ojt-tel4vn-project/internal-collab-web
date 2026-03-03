import type { ReactNode } from "react";

export type NotificationItem = {
    id: string;
    title: string;
    description: string;
    timeAgo: string;
    accent: string;
    unread: boolean;
    icon?: ReactNode;
    meta?: string;
};
