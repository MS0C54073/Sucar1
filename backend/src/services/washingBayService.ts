import { supabase } from '../config/supabase';

export type BayStatus = 'available' | 'occupied' | 'maintenance' | 'offline';

export class WashingBayService {
  static async ensureBaysForCarWash(carWashId: string, bayCount: number) {
    const count = Math.max(1, Math.min(bayCount || 3, 20));
    const { data: existing } = await supabase
      .from('washing_bays')
      .select('id, bay_number')
      .eq('car_wash_id', carWashId)
      .order('bay_number', { ascending: true });

    const have = (existing || []).length;
    if (have >= count) return existing || [];

    const toCreate = [];
    for (let n = have + 1; n <= count; n++) {
      toCreate.push({
        car_wash_id: carWashId,
        bay_number: n,
        name: `Bay ${n}`,
        status: 'available',
      });
    }

    if (toCreate.length) {
      const { data, error } = await supabase.from('washing_bays').insert(toCreate).select();
      if (error) throw error;
      return [...(existing || []), ...(data || [])];
    }
    return existing || [];
  }

  static async listBays(carWashId: string) {
    const { data, error } = await supabase
      .from('washing_bays')
      .select('*')
      .eq('car_wash_id', carWashId)
      .order('bay_number', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getAvailableBay(carWashId: string, serviceType?: string) {
    const bays = await this.listBays(carWashId);
    return (
      bays.find((b: { status: string }) => b.status === 'available') ||
      null
    );
  }

  static async occupyBay(bayId: string, sessionId: string) {
    const { data, error } = await supabase
      .from('washing_bays')
      .update({
        status: 'occupied',
        current_wash_session_id: sessionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bayId)
      .eq('status', 'available')
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Bay is no longer available');
    return data;
  }

  static async releaseBay(bayId: string) {
    const { data, error } = await supabase
      .from('washing_bays')
      .update({
        status: 'available',
        current_wash_session_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bayId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
