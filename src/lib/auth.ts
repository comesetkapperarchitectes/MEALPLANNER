'use client';

import { createContext, useContext } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Types
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

// Context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return a default state instead of throwing during SSR/initial render
    return {
      user: null,
      session: null,
      loading: true,
      signIn: async () => ({ error: null }),
      signUp: async () => ({ error: null }),
      signInWithGoogle: async () => ({ error: null }),
      signOut: async () => ({ error: null }),
    } as AuthContextType;
  }
  return context;
}

// Auth functions
export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { error };
}

export async function signUp(email: string, password: string, displayName?: string) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: displayName,
      },
    },
  });
  return { error };
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
