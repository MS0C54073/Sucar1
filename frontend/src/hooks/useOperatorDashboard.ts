import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

export interface OperationsDashboard {
  bays: BayPanelItem[];
  queue: QueuePanelItem[];
  pendingPayments: PendingPaymentItem[];
  activity: {
    activeSessions: Record<string, unknown>[];
    completedToday: number;
    waitingCount: number;
    metrics: {
      availableBays: number;
      waiting: number;
      inWash: number;
      delayed: number;
      utilization: number;
    };
  };
  updatedAt: string;
  legacyMode?: boolean;
  setupHint?: string;
}

export interface BayPanelItem {
  id: string;
  bayNumber: number;
  name: string;
  status: string;
  sessionId?: string;
  operationalStatus?: string;
  remainingMinutes?: number | null;
  paymentStatus?: string;
  clientName?: string;
  plateNo?: string;
}

export interface QueuePanelItem {
  id: string;
  position: number;
  operationalStatus: string;
  priority: number;
  isExpress: boolean;
  estimatedStart?: string;
  estimatedCompletion?: string;
  durationMinutes?: number;
  booking?: Record<string, unknown>;
}

export interface PendingPaymentItem {
  id: string;
  bookingId?: string;
  booking_id?: string;
  amount?: number;
  method?: string;
  status?: string;
  proofUrl?: string;
  proof_url?: string;
  transactionId?: string;
  transaction_id?: string;
  createdAt?: string;
  created_at?: string;
  booking?: Record<string, unknown>;
}

export function useOperatorDashboard(carWashId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const id = carWashId || user?.id;

  const query = useQuery({
    queryKey: ['operations-dashboard', id],
    queryFn: async (): Promise<OperationsDashboard> => {
      const response = await api.get('/operations/dashboard');
      return response.data.data;
    },
    enabled: Boolean(id),
    refetchInterval: 3000,
    staleTime: 1000,
  });

  useEffect(() => {
    if (!id || !isSupabaseConfigured || !supabase) return;

    const client = supabase;
    const channel = client
      .channel(`operator-ops-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'car_wash_queue', filter: `car_wash_id=eq.${id}` },
        () => queryClient.invalidateQueries({ queryKey: ['operations-dashboard', id] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'washing_bays', filter: `car_wash_id=eq.${id}` },
        () => queryClient.invalidateQueries({ queryKey: ['operations-dashboard', id] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wash_sessions', filter: `car_wash_id=eq.${id}` },
        () => queryClient.invalidateQueries({ queryKey: ['operations-dashboard', id] })
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [id, queryClient]);

  return query;
}
