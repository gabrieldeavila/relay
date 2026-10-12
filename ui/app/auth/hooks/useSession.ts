import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { supabase } from "../api/supabase-client";

/** Current login, kept in sync with sign in, sign out and token refresh. */
export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { session, loading };
};
