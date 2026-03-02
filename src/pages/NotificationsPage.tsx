import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Bell, Check, CheckCheck, AlertTriangle, Clock, Shield, Phone,
  Settings, Gavel, Landmark, FileText, Filter,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  approval: Shield,
  overdue: AlertTriangle,
  maturity: Clock,
  collection: Phone,
  system: Settings,
  auction: Gavel,
  disbursement: Landmark,
  application: FileText,
  closure: Check,
};

const CATEGORY_LABELS: Record<string, string> = {
  approval: "Approval",
  overdue: "Overdue",
  maturity: "Maturity",
  collection: "Collection",
  system: "System",
  auction: "Auction",
  disbursement: "Disbursement",
  application: "Application",
  closure: "Closure",
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const { data: allNotifications } = useQuery({
    queryKey: ["all-notifications", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*")
        .eq("user_id", user!.id).order("created_at", { ascending: false }).limit(500);
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    let list = allNotifications || [];
    if (typeFilter !== "all") list = list.filter((n: any) => n.category === typeFilter);
    if (readFilter === "unread") list = list.filter((n: any) => !n.is_read);
    if (readFilter === "read") list = list.filter((n: any) => n.is_read);
    return list;
  }, [allNotifications, typeFilter, readFilter]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await supabase.from("notifications").update({ is_read: true })
        .eq("user_id", user!.id).eq("is_read", false);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-notifications"] }),
  });

  const unreadCount = (allNotifications || []).filter((n: any) => !n.is_read).length;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
            <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(0); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={readFilter} onValueChange={v => { setReadFilter(v); setPage(0); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        {paginated.length === 0 && (
          <Card><CardContent className="p-12 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No notifications found</p>
          </CardContent></Card>
        )}
        {paginated.map((n: any) => {
          const Icon = CATEGORY_ICONS[n.category] || Bell;
          return (
            <Card
              key={n.id}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${!n.is_read ? "border-l-4 border-l-accent" : ""}`}
              onClick={() => {
                if (!n.is_read) markRead.mutate(n.id);
                if (n.entity_id && n.entity_type === "loan") navigate(`/transactions/${n.entity_id}`);
              }}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`rounded-lg p-2 shrink-0 ${!n.is_read ? "bg-accent/10" : "bg-muted"}`}>
                  <Icon className={`h-4 w-4 ${!n.is_read ? "text-accent" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${!n.is_read ? "font-semibold" : "text-muted-foreground"}`}>{n.title}</p>
                    {!n.is_read && <Badge className="bg-accent text-accent-foreground text-[9px] px-1.5">New</Badge>}
                  </div>
                  {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">{CATEGORY_LABELS[n.category] || n.category}</Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(n.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
                {!n.is_read && <span className="w-2.5 h-2.5 rounded-full bg-accent shrink-0 mt-1" />}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground self-center">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
