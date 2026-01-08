import { supabase } from '../supabase';

/**
 * Get the current authenticated user's ID
 * Throws an error if not authenticated
 */
export async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Not authenticated');
  }

  return user.id;
}

/**
 * Get the current user ID, or null if not authenticated
 * Use this for optional user context
 */
export async function getCurrentUserIdOrNull(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}
