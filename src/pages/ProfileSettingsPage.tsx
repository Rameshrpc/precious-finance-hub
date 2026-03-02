import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User, Lock, Building2, Shield } from "lucide-react";
import { ROLE_LABELS } from "@/lib/indian-locale";

export default function ProfileSettingsPage() {
  const { user, profile, roles } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [saving, setSaving] = useState(false);

  const updateProfile = useMutation({
    mutationFn: async () => {
      setSaving(true);
      const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Profile updated"); setSaving(false); },
    onError: () => { toast.error("Failed to update profile"); setSaving(false); },
  });

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error("Failed to send reset email");
    else toast.success("Password reset email sent");
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4 text-accent" /> Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled className="bg-muted" />
            <p className="text-[10px] text-muted-foreground">Email cannot be changed</p>
          </div>
          <Button onClick={() => updateProfile.mutate()} disabled={saving || fullName === profile?.full_name}>
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Role & Branch */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4 text-accent" /> Role & Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Current Role</Label>
            <div className="flex gap-1">
              {roles.map(r => <Badge key={r} variant="default" className="text-xs">{ROLE_LABELS[r] || r}</Badge>)}
              {roles.length === 0 && <Badge variant="outline">No role assigned</Badge>}
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /> Branch</Label>
            <span className="text-sm text-muted-foreground">{profile?.branch_id ? "Assigned" : "Not assigned"}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Contact your administrator to change role or branch assignment.</p>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Lock className="h-4 w-4 text-accent" /> Security</CardTitle>
          <CardDescription>Manage your password and security settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handlePasswordReset}>
            <Lock className="h-4 w-4 mr-1" /> Send Password Reset Email
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
