import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell, Check, AlertTriangle, Clock, Shield, Phone, Settings } from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  approval: Shield,
  overdue: AlertTriangle,
  maturity: Clock,
  collection: Phone,
  system: Settings,
};

const CATEGORY_ROUTES: Record<string, string> = {
  approval: "/approvals",
  overdue: "/collection/dpd",
  maturity: "/transactions",
  collection: "/collection/queue",
  system: "/settings",
};

export default function NotificationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*")
        .eq("user_id", user!.id).order("created_at", { ascending: false }).limit(30);
      return data || [];
    },
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await supabase.from("notifications").update({ is_read: true })
        .eq("user_id", user!.id).eq("is_read", false);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const all = notifications || [];
  const unreadCount = all.filter((n: any) => !n.is_read).length;

  const handleClick = (n: any) => {
    if (!n.is_read) markRead.mutate(n.id);
    const route = CATEGORY_ROUTES[n.category] || "/dashboard";
    navigate(n.entity_id ? `${route}/${n.entity_id}` : route);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-medium">Notifications</p>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={() => markAllRead.mutate()}>
              <Check className="h-3 w-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-80">
          {all.length === 0 && <p className="text-center text-muted-foreground text-xs py-6">No notifications</p>}
          {all.map((n: any) => {
            const Icon = CATEGORY_ICONS[n.category] || Bell;
            return (
              <DropdownMenuItem key={n.id} className="flex items-start gap-2 py-2.5 cursor-pointer" onClick={() => handleClick(n)}>
                <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${n.is_read ? "text-muted-foreground" : "text-primary"}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${n.is_read ? "text-muted-foreground" : "font-medium"}`}>{n.title}</p>
                  {n.body && <p className="text-[10px] text-muted-foreground truncate">{n.body}</p>}
                  <p className="text-[9px] text-muted-foreground mt-0.5">{new Date(n.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
              </DropdownMenuItem>
            );
          })}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
