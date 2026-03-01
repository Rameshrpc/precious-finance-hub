import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Smartphone, Monitor, Globe, Trash2 } from "lucide-react";

const SecuritySettingsPage = () => {
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [showSetup, setShowSetup] = useState(false);

  // Mock sessions
  const sessions = [
    { id: "1", device: "Chrome on Windows", os: "Windows 11", lastActive: "2 min ago", current: true },
    { id: "2", device: "Safari on iPhone", os: "iOS 18", lastActive: "3 hours ago", current: false },
    { id: "3", device: "Firefox on Mac", os: "macOS 15", lastActive: "1 day ago", current: false },
  ];

  const handle2FAToggle = () => {
    if (!twoFAEnabled) {
      setShowSetup(true);
    } else {
      setTwoFAEnabled(false);
      setShowSetup(false);
      toast.success("2FA disabled");
    }
  };

  const verifyTOTP = () => {
    if (totpCode.length === 6) {
      setTwoFAEnabled(true);
      setShowSetup(false);
      setTotpCode("");
      toast.success("2FA enabled successfully");
    } else {
      toast.error("Invalid code. Enter 6 digits.");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Security Settings</h1>

      {/* 2FA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Two-Factor Authentication</CardTitle>
          <CardDescription>Add an extra layer of security with TOTP-based 2FA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable 2FA</Label>
            <Switch checked={twoFAEnabled} onCheckedChange={handle2FAToggle} />
          </div>
          {showSetup && !twoFAEnabled && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <p className="text-sm">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
              <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                <div className="text-center text-xs text-muted-foreground">
                  <Smartphone className="h-8 w-8 mx-auto mb-2" />
                  QR Code placeholder
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-mono">Secret: JBSWY3DPEHPK3PXP</p>
              <div className="flex gap-2">
                <Input placeholder="Enter 6-digit code" value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} className="max-w-[180px] font-mono" />
                <Button onClick={verifyTOTP}>Verify & Enable</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Monitor className="h-5 w-5" /> Active Sessions</CardTitle>
          <CardDescription>Manage your active sessions across devices. Inactivity timeout: 15 minutes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>OS</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    {s.device}
                  </TableCell>
                  <TableCell>{s.os}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.lastActive}</TableCell>
                  <TableCell>{s.current ? <Badge>Current</Badge> : <Badge variant="secondary">Active</Badge>}</TableCell>
                  <TableCell>
                    {!s.current && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => toast.success("Session revoked")}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettingsPage;
