'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  AuthContext,
  signIn as authSignIn,
  signUp as authSignUp,
  signInWithGoogle as authSignInWithGoogle,
  signOut as authSignOut
} from '@/lib/auth';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user - use getUser() to validate session with server
    // getSession() can return stale data from localStorage
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) {
        setSession(null);
        setUser(null);
      } else {
        // Get the session after confirming user is valid
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          setUser(user);
        });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const result = await authSignIn(email, password);
      return result;
    } catch (err) {
      console.error('AuthProvider signIn error:', err);
      throw err;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    return authSignUp(email, password, displayName);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    return authSignInWithGoogle();
  }, []);

  const signOut = useCallback(async () => {
    return authSignOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
