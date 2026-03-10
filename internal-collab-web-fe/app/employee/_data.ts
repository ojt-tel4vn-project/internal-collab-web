import type { LeaderboardItem, Milestone, NavItem, TaskItem } from "@/types/dashboard";
import { CalendarIcon, ClockIcon, DocumentIcon, GridIcon } from "@/components/dashboard/home/Icons";

export const navItems: NavItem[] = [
  { label: "Home", href: "/employee", active: true, icon: GridIcon },
  { label: "Attendance", href: "/employee/attendance", icon: ClockIcon },
  { label: "Leave", href: "/employee/leaverequest", icon: CalendarIcon },
  { label: "Documents", href: "/employee/documents", icon: DocumentIcon },
];

export const leaderboard: LeaderboardItem[] = [
  { name: "Elena Rodriguez", role: "Sales Development", points: 124, rank: 1, highlight: true },
  { name: "Tom Henderson", role: "Customer Support", points: 98, rank: 2 },
  { name: "Sophie Walker", role: "Product Manager", points: 85, rank: 3 },
];

export const tasks: TaskItem[] = [
  { title: "Review API Refactor documentation", done: true },
  { title: "Submit Q4 expense reports" },
  { title: "Update design system components" },
  { title: "Sync with marketing team on Q4 roadmap" },
];

export const milestones: Milestone[] = [
  {
    day: 14,
    month: "OCT",
    title: "David's 3rd Work Anniversary",
    subtitle: "Celebrate with a 'Veteran' sticker!",
  },
  {
    day: 16,
    month: "OCT",
    title: "New Team Lunch",
    subtitle: "Welcome our 4 new designers!",
  },
];


