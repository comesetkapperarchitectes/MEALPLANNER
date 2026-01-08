import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Use createBrowserClient from @supabase/ssr for proper cookie handling
// This ensures sessions are stored in cookies and accessible by middleware
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createBrowserClient<any>(supabaseUrl, supabaseAnonKey);
