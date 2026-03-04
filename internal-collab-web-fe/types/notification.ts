export const NOTIFICATION_TYPES = [
  "system",
  "leave",
  "birthday",
  "document",
  "announcement",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export type NotificationPriority = "high" | "normal";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  employee_id: string;
  action_url: string;
};

export type ListNotificationResponse = {
  $schema?: string;
  page: number;
  limit: number;
  total: number;
  unread_count: number;
  notifications: NotificationItem[];
};

export type UnreadCountResponse = {
  $schema?: string;
  count: number;
};
