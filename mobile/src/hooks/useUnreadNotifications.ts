import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { apiClient } from '../utils/api';

/**
 * Returns the count of unread notifications for the authenticated user.
 * Starts at 0 (no badge for new users), polls every 60 s while the app
 * is in the foreground, and refreshes whenever the app comes back to focus.
 */
export function useUnreadNotifications() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await apiClient.get('/notifications');
      const items: Array<{ read: boolean }> = res.data?.data || [];
      setCount(items.filter((n) => !n.read).length);
    } catch {
      // Keep the current count on error rather than flashing 0
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 60_000);

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') refresh();
    });

    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [refresh]);

  return count;
}
