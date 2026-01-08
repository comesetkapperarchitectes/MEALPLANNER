import { supabase } from '../supabase';
import { getCurrentUserId } from './utils';
import type { Settings } from '@/types';

export async function getSettings(): Promise<Settings> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    // Create default settings for this user if not exist
    const { data: newData, error: insertError } = await supabase
      .from('settings')
      .insert({ family_size: 4, user_id: userId })
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
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('settings')
    .update(settings)
    .eq('user_id', userId);

  if (error) throw error;
}
