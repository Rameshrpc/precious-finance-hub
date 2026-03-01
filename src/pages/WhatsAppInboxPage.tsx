import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/lib/formatters";
import { toast } from "sonner";
import { Send, Paperclip, Search, Bot, User, FileText } from "lucide-react";

export default function WhatsAppInboxPage() {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedConvo, setSelectedConvo] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [templateOpen, setTemplateOpen] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);

  // Conversations
  const { data: conversations } = useQuery({
    queryKey: ["wa-conversations", tenantId, filter],
    queryFn: async () => {
      let q = supabase.from("wa_conversations").select("*").eq("tenant_id", tenantId)
        .order("last_message_at", { ascending: false }).limit(100);
      if (filter === "unread") q = q.gt("unread_count", 0);
      if (filter === "mine") q = q.eq("assigned_to", user?.id);
      const { data } = await q;
      return data || [];
    },
  });

  // Messages for selected conversation
  const { data: messages } = useQuery({
    queryKey: ["wa-messages", selectedConvo?.id],
    enabled: !!selectedConvo,
    queryFn: async () => {
      const { data } = await supabase.from("wa_messages").select("*")
        .eq("conversation_id", selectedConvo.id).order("created_at", { ascending: true }).limit(200);
      return data || [];
    },
  });

  // Templates
  const { data: templates } = useQuery({
    queryKey: ["wa-templates", tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("wa_templates").select("*").eq("tenant_id", tenantId).eq("is_active", true);
      return data || [];
    },
  });

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!selectedConvo || !message.trim()) return;
      await supabase.from("wa_messages").insert({
        tenant_id: tenantId,
        conversation_id: selectedConvo.id,
        direction: "outgoing",
        sender: user?.id,
        body: message,
        message_type: "text",
      });
      await supabase.from("wa_conversations").update({
        last_message: message,
        last_message_at: new Date().toISOString(),
      }).eq("id", selectedConvo.id);
    },
    onSuccess: () => {
      setMessage("");
      qc.invalidateQueries({ queryKey: ["wa-messages"] });
      qc.invalidateQueries({ queryKey: ["wa-conversations"] });
    },
  });

  const toggleBot = async () => {
    if (!selectedConvo) return;
    await supabase.from("wa_conversations").update({ bot_enabled: !selectedConvo.bot_enabled }).eq("id", selectedConvo.id);
    setSelectedConvo({ ...selectedConvo, bot_enabled: !selectedConvo.bot_enabled });
    qc.invalidateQueries({ queryKey: ["wa-conversations"] });
  };

  const filteredConvos = (conversations || []).filter((c: any) =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );

  return (
    <div className="animate-fade-in flex h-[calc(100vh-8rem)] gap-0 border rounded-lg overflow-hidden">
      {/* Left - Conversation List */}
      <div className="w-80 border-r flex flex-col shrink-0 bg-card">
        <div className="p-3 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
          </div>
          <div className="flex gap-1">
            {["all", "unread", "mine"].map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "ghost"} className="text-[10px] h-6 capitalize" onClick={() => setFilter(f)}>{f}</Button>
            ))}
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filteredConvos.map((c: any) => (
            <div key={c.id}
              className={`flex items-start gap-2 p-3 border-b cursor-pointer hover:bg-muted/50 ${selectedConvo?.id === c.id ? "bg-primary/5" : ""}`}
              onClick={() => setSelectedConvo(c)}>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-[10px] bg-muted">{(c.name || c.phone || "?")[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-medium truncate">{c.name || c.phone}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">{c.last_message_at ? formatDate(c.last_message_at) : ""}</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{c.last_message || "No messages"}</p>
                {c.unread_count > 0 && <Badge variant="destructive" className="text-[9px] mt-0.5">{c.unread_count}</Badge>}
              </div>
            </div>
          ))}
          {filteredConvos.length === 0 && <p className="text-center text-muted-foreground text-xs py-8">No conversations</p>}
        </ScrollArea>
      </div>

      {/* Right - Chat View */}
      <div className="flex-1 flex flex-col bg-background">
        {!selectedConvo ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Select a conversation</div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-14 border-b flex items-center justify-between px-4 shrink-0">
              <div>
                <p className="text-sm font-medium">{selectedConvo.name || selectedConvo.phone}</p>
                <p className="text-[10px] text-muted-foreground">{selectedConvo.phone}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <Bot className="h-3.5 w-3.5" />
                  <Switch checked={selectedConvo.bot_enabled} onCheckedChange={toggleBot} className="scale-75" />
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {(messages || []).map((m: any) => (
                  <div key={m.id} className={`flex ${m.direction === "outgoing" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-lg px-3 py-2 text-xs ${
                      m.is_bot ? "bg-purple-100 text-purple-900" :
                      m.direction === "outgoing" ? "bg-green-100 text-green-900" :
                      "bg-muted text-foreground"
                    }`}>
                      {m.is_bot && <span className="text-[9px] font-medium block mb-0.5">🤖 Bot</span>}
                      <p>{m.body}</p>
                      <span className="text-[9px] opacity-60 mt-1 block">{new Date(m.created_at).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                ))}
                <div ref={chatEnd} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t p-3 flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><Paperclip className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setTemplateOpen(true)}><FileText className="h-4 w-4" /></Button>
              <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..."
                className="text-xs h-8" onKeyDown={(e) => e.key === "Enter" && sendMessage.mutate()} />
              <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => sendMessage.mutate()} disabled={!message.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Template Picker Dialog */}
      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Template</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-64 overflow-auto">
            {(templates || []).map((t: any) => (
              <div key={t.id} className="border rounded-md p-3 cursor-pointer hover:bg-muted/50" onClick={() => {
                setMessage(t.body);
                setTemplateOpen(false);
              }}>
                <p className="text-xs font-medium">{t.name}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{t.body}</p>
                <div className="flex gap-1 mt-1">{(t.variables || []).map((v: string) => <Badge key={v} variant="outline" className="text-[9px]">{v}</Badge>)}</div>
              </div>
            ))}
            {(templates || []).length === 0 && <p className="text-center text-muted-foreground text-xs py-4">No templates configured</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
