import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, MapPin, Calendar } from "lucide-react";
import { formatINR, formatDateIN } from "@/lib/indian-locale";
import { Link } from "react-router-dom";

interface CustomerQuickCardProps {
  customerId: string;
  children: ReactNode;
}

export default function CustomerQuickCard({ customerId, children }: CustomerQuickCardProps) {
  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer-quick", customerId],
    enabled: !!customerId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, code, phone, city, category, status, photo_url")
        .eq("id", customerId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: loanStats } = useQuery({
    queryKey: ["customer-loan-stats", customerId],
    enabled: !!customerId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loans")
        .select("id, amount, status, created_at")
        .eq("customer_id", customerId)
        .eq("status", "active");
      if (error) throw error;
      const rows = data || [];
      return {
        activeLoans: rows.length,
        totalOutstanding: rows.reduce((sum, l) => sum + Number(l.amount), 0),
        lastTxnDate: rows.length > 0
          ? rows.sort((a, b) => b.created_at.localeCompare(a.created_at))[0].created_at
          : null,
      };
    },
  });

  const stats = loanStats || { activeLoans: 0, totalOutstanding: 0, lastTxnDate: null as string | null };

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-72 shadow-xl p-0" side="right" align="start">
        {isLoading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        ) : customer ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 pb-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={customer.photo_url || undefined} />
                <AvatarFallback className="bg-accent/20 text-accent font-semibold text-sm">
                  {customer.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-foreground truncate">{customer.name}</p>
                <Badge variant="outline" className="text-[10px] font-mono mt-0.5">{customer.code}</Badge>
              </div>
            </div>

            {/* Body */}
            <div className="px-4 pb-3 space-y-2 text-xs text-muted-foreground">
              <a href={`tel:${customer.phone}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Phone className="h-3 w-3" />{customer.phone}
              </a>
              {customer.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />{customer.city}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">{customer.category}</Badge>
                {customer.status !== "active" && <Badge variant="destructive" className="text-[10px]">{customer.status}</Badge>}
              </div>
              <div className="flex justify-between pt-1 border-t border-border">
                <span>Active Loans: <strong className="text-foreground">{stats.activeLoans}</strong></span>
                <span>Outstanding: <strong className="text-foreground">{formatINR(stats.totalOutstanding, 0)}</strong></span>
              </div>
              {stats.lastTxnDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />Last txn: {formatDateIN(stats.lastTxnDate)}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-2">
              <Link to={`/customers/${customer.id}`} className="text-xs font-medium text-accent hover:underline">
                View Profile →
              </Link>
            </div>
          </>
        ) : (
          <div className="p-4 text-xs text-muted-foreground">Customer not found</div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
