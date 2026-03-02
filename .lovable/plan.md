

## Problem: Login Spinner Never Resolves

The login API call succeeds (HTTP 200), profile and roles data exist in the database, and RLS policies are correct. The issue is a **deadlock in the `useAuth` hook**.

### Root Cause

In `src/hooks/useAuth.ts`, the `onAuthStateChange` callback performs `await` calls back to Supabase (`profiles` and `user_roles` queries). The Supabase JS client internally locks during auth state change processing, so making additional Supabase requests inside the callback causes it to hang indefinitely. The `loading` state never becomes `false`, so `ProtectedRoute` shows the spinner forever.

### Fix

Refactor `useAuth.ts` to **defer the profile/roles fetch outside the callback**:

1. **In `onAuthStateChange`**: Only capture the `session.user` synchronously. Do not `await` any Supabase queries.
2. **Use a separate `useEffect`** that watches the `user` state and fetches `profiles` + `user_roles` when a user is present.
3. This breaks the deadlock because the Supabase queries run after the auth state change callback has already returned.

### Changes

**File: `src/hooks/useAuth.ts`**
- Remove the `await Promise.all(...)` from inside `onAuthStateChange`
- Add a second `useEffect` that triggers profile/roles fetch when `user` changes
- Set `loading: false` only after both the auth state and profile data are resolved

```
// Pseudostructure:
onAuthStateChange((_event, session) => {
  setUser(session?.user ?? null);  // synchronous, no await
  if (!session?.user) { setProfile(null); setRoles([]); setLoading(false); }
});

useEffect(() => {
  if (!user) return;
  // fetch profiles + user_roles here, then setLoading(false)
}, [user]);
```

This is a single-file fix in `useAuth.ts`.

