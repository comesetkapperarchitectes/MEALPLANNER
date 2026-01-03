import { supabase } from '../supabase';
import type { Settings } from '@/types';

export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .single();

  if (error) {
    console.error('getSettings error:', error.message, error.code, error.details);
    // Create default settings if not exist
    const { data: newData, error: insertError } = await supabase
      .from('settings')
      .insert({ family_size: 4 })
      .select()
      .single();

    if (insertError) {
      console.error('Insert settings error:', insertError.message, insertError.code);
      throw insertError;
    }
    return newData as Settings;
  }

  return data as Settings;
}

export async function updateSettings(settings: Partial<Settings>): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .update(settings)
    .eq('id', 1);

  if (error) throw error;
}
