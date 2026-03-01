import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  tenant_id: string | null;
  branch_id: string | null;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  roles: string[];
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    roles: [],
    loading: true,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          // Fetch profile and roles in parallel
          const [profileRes, rolesRes] = await Promise.all([
            supabase.from("profiles").select("*").eq("id", session.user.id).single(),
            supabase.from("user_roles").select("role").eq("user_id", session.user.id),
          ]);

          setState({
            user: session.user,
            profile: profileRes.data as UserProfile | null,
            roles: (rolesRes.data || []).map((r) => r.role),
            loading: false,
          });
        } else {
          setState({ user: null, profile: null, roles: [], loading: false });
        }
      }
    );

    supabase.auth.getSession();

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasRole = (role: string) => state.roles.includes(role);

  return { ...state, signOut, hasRole };
}
