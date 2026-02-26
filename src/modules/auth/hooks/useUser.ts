/**
 * @module auth/hooks
 * @description Hook for managing user auth state with persistence
 * @safety RED
 */

"use client";

import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/infra/supabase/client";

interface UseUserResult {
  user: User | null;
  loading: boolean;
}

/**
 * Hook that manages user authentication state with real-time updates.
 *
 * - Gets initial session on mount
 * - Listens for auth state changes (login, logout, token refresh)
 * - Prevents "ghost logouts" by keeping state in sync
 */
export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    // Listen for auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
