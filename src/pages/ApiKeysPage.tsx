import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Key, Plus, Copy, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/formatters";

const ApiKeysPage = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);

  const { data: keys = [] } = useQuery({
    queryKey: ["api_keys"],
    queryFn: async () => {
      const { data } = await supabase.from("api_keys").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const createKey = useMutation({
    mutationFn: async () => {
      if (!profile?.tenant_id || !keyName.trim()) throw new Error("Name required");
      const raw = `cfz_${crypto.randomUUID().replace(/-/g, "")}`;
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(raw));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      const { error } = await supabase.from("api_keys").insert({
        tenant_id: profile.tenant_id,
        name: keyName.trim(),
        key_hash: hashHex,
        key_prefix: raw.slice(0, 12),
        created_by: profile.id,
      });
      if (error) throw error;
      return raw;
    },
    onSuccess: (raw) => {
      queryClient.invalidateQueries({ queryKey: ["api_keys"] });
      setNewKey(raw);
      setKeyName("");
      toast.success("API key created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_keys").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["api_keys"] }); toast.success("Key deleted"); },
  });

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-sm text-muted-foreground">Manage API keys for REST API access. Rate limit: 100 requests/hour per key.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setNewKey(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Create Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{newKey ? "Key Created" : "Create API Key"}</DialogTitle></DialogHeader>
            {newKey ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Copy this key now. It won't be shown again.</p>
                <div className="flex gap-2">
                  <Input value={newKey} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(newKey); toast.success("Copied"); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button className="w-full" onClick={() => { setDialogOpen(false); setNewKey(null); }}>Done</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Input placeholder="Key name (e.g., Production, Testing)" value={keyName} onChange={(e) => setKeyName(e.target.value)} />
                <Button className="w-full" onClick={() => createKey.mutate()} disabled={!keyName.trim() || createKey.isPending}>
                  {createKey.isPending ? "Creating..." : "Generate Key"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key Prefix</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Rate Limit</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((k: any) => (
                <TableRow key={k.id}>
                  <TableCell className="font-medium">{k.name}</TableCell>
                  <TableCell className="font-mono text-xs">{k.key_prefix}...</TableCell>
                  <TableCell>{(k.scopes || []).map((s: string) => <Badge key={s} variant="secondary" className="mr-1">{s}</Badge>)}</TableCell>
                  <TableCell>{k.rate_limit}/hr</TableCell>
                  <TableCell className="text-sm">{formatDate(k.created_at)}</TableCell>
                  <TableCell>{k.is_active ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteKey.mutate(k.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!keys.length && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No API keys created yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> API Documentation</CardTitle>
          <CardDescription>Available REST API endpoints</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 font-mono text-sm">
          <div className="flex gap-2 items-center"><Badge>GET</Badge><span>/functions/v1/rest-api?resource=loans</span></div>
          <div className="flex gap-2 items-center"><Badge>GET</Badge><span>/functions/v1/rest-api?resource=customers</span></div>
          <div className="flex gap-2 items-center"><Badge>GET</Badge><span>/functions/v1/rest-api?resource=receipts</span></div>
          <div className="flex gap-2 items-center"><Badge>GET</Badge><span>/functions/v1/rest-api?resource=summary</span></div>
          <p className="text-xs text-muted-foreground mt-4">Include header: <code>x-api-key: your_key</code></p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiKeysPage;
