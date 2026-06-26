import { useEffect, useRef } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Supabase Realtime hook for React Native.
 *
 * Subscribes to booking changes and invokes a callback when updates occur.
 * Automatically pauses/resumes when the app goes to background/foreground.
 *
 * Usage:
 *   useRealtimeBookings({
 *     onBookingChange: () => refetchBookings(),
 *     userId: user?.id,
 *   });
 */

// Supabase client for realtime (configure via env or constants)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 5,
        },
      },
    });
  }
  return supabase;
}

interface UseRealtimeBookingsOptions {
  /** Callback fired when any booking change is detected */
  onBookingChange?: (payload: any) => void;
  /** Filter by user ID */
  userId?: string;
  /** Whether the hook is enabled */
  enabled?: boolean;
}

export function useRealtimeBookings(options: UseRealtimeBookingsOptions = {}) {
  const { onBookingChange, userId, enabled = true } = options;
  const channelRef = useRef<RealtimeChannel | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client || !enabled) return;

    const subscribe = () => {
      if (channelRef.current) return; // Already subscribed

      const channelName = userId ? `mobile-bookings-${userId}` : 'mobile-bookings-all';

      const channel = client
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            ...(userId ? { filter: `client_id=eq.${userId}` } : {}),
          },
          (payload) => {
            console.log('[Realtime] Booking change:', payload.eventType);
            onBookingChange?.(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[Realtime] Mobile subscribed to ${channelName}`);
          }
        });

      channelRef.current = channel;
    };

    const unsubscribe = () => {
      if (channelRef.current) {
        client.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };

    // Handle app state changes (pause in background, resume in foreground)
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        // App came to foreground — resubscribe
        subscribe();
        // Also trigger a refresh
        onBookingChange?.({ eventType: 'app_resume' });
      } else if (nextState.match(/inactive|background/)) {
        // App went to background — unsubscribe to save battery
        unsubscribe();
      }
      appStateRef.current = nextState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Initial subscription
    subscribe();

    return () => {
      unsubscribe();
      subscription.remove();
    };
  }, [userId, enabled]);
}

/**
 * Hook for real-time chat messages in mobile.
 */
export function useRealtimeChat(options: {
  bookingId?: string;
  onNewMessage?: (payload: any) => void;
  enabled?: boolean;
}) {
  const { bookingId, onNewMessage, enabled = true } = options;
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client || !bookingId || !enabled) return;

    const channel = client
      .channel(`mobile-chat-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          onNewMessage?.(payload);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        client.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [bookingId, enabled]);
}

/**
 * Hook for real-time location tracking in mobile.
 */
export function useRealtimeLocation(options: {
  bookingId?: string;
  onLocationUpdate?: (payload: any) => void;
  enabled?: boolean;
}) {
  const { bookingId, onLocationUpdate, enabled = true } = options;
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client || !bookingId || !enabled) return;

    const channel = client
      .channel(`mobile-location-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'location_updates',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          onLocationUpdate?.(payload);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        client.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [bookingId, enabled]);
}

export default useRealtimeBookings;
