import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  tenant_id: string | null;
  branch_id: string | null;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  roles: string[];
  loading: boolean;
  signOut: () => Promise<void>;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Single auth subscription
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
          setProfile(null);
          setRoles([]);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile + roles outside auth callback
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const fetchData = async () => {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      if (!cancelled) {
        setProfile(profileRes.data as UserProfile | null);
        setRoles((rolesRes.data || []).map((r) => r.role));
        setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasRole = (role: string) => roles.includes(role);

  return (
    <AuthContext.Provider value={{ user, profile, roles, loading, signOut, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
