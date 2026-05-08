"use client";

import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

export default function NotificationWatcher() {
  useRealtimeNotifications();
  return null;
}
