import type { ComponentType, ReactNode, SVGProps } from "react";

export type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export interface NavItem {
    label: string;
    href: string;
    icon: IconType;
    active?: boolean;
    badge?: string;
}

export interface DayCell {
    day?: number;
    isFocus?: boolean;
    hasEvent?: boolean;
    events?: CalendarEvent[];
}

export interface CalendarEvent {
    id: string;
    name: string;
    date: string;
}

export interface TaskItem {
    title: string;
    done?: boolean;
}

export interface LeaderboardItem {
    name: string;
    role: string;
    points: number;
    rank: number;
    highlight?: boolean;
}

export interface SectionCardProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    footerSlot?: ReactNode;
    children: ReactNode;
    className?: string;
}
