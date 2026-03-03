import type { ReactNode, ComponentType, SVGProps } from "react";

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

export interface Milestone {
    day: number;
    month: string;
    title: string;
    subtitle: string;
}

export interface SectionCardProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    footerSlot?: ReactNode;
    children: ReactNode;
    className?: string;
}
