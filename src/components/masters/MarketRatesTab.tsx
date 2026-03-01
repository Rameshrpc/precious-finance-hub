import { useState, useMemo } from "react";
import { useMarketRates, useUpsertMarketRate } from "@/hooks/useMasters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/indian-locale";
import { format, subDays } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export default function MarketRatesTab() {
  const { data, isLoading } = useMarketRates();
  const upsertRate = useUpsertMarketRate();
  const today = format(new Date(), "yyyy-MM-dd");

  const todayRate = (data || []).find((r: any) => r.rate_date === today);
  const [gold22k, setGold22k] = useState(todayRate ? String(todayRate.gold_22k) : "");
  const [gold24k, setGold24k] = useState(todayRate ? String(todayRate.gold_24k) : "");
  const [silverKg, setSilverKg] = useState(todayRate ? String(todayRate.silver_per_kg) : "");

  // Sync when data loads
  useState(() => {
    if (todayRate) {
      setGold22k(String(todayRate.gold_22k));
      setGold24k(String(todayRate.gold_24k));
      setSilverKg(String(todayRate.silver_per_kg));
    }
  });

  const handleSave = () => {
    upsertRate.mutate({ rate_date: today, gold_22k: parseFloat(gold22k || "0"), gold_24k: parseFloat(gold24k || "0"), silver_per_kg: parseFloat(silverKg || "0") });
  };

  const silverPerGram = silverKg ? (parseFloat(silverKg) / 1000).toFixed(2) : "0";

  const rateDates = useMemo(() => (data || []).map((r: any) => new Date(r.rate_date)), [data]);

  const chartData = useMemo(() => {
    const last30 = Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), 29 - i), "yyyy-MM-dd"));
    return last30.map((d) => {
      const r = (data || []).find((x: any) => x.rate_date === d);
      return { date: format(new Date(d), "dd/MM"), gold_22k: r ? Number(r.gold_22k) : null, silver_per_kg: r ? Number(r.silver_per_kg) : null };
    });
  }, [data]);

  if (isLoading) return <div className="space-y-2 mt-4">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>;

  return (
    <div className="mt-4 space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-lg">Today's Rates — {format(new Date(), "dd MMM yyyy")}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Gold 22K (₹/g)</Label>
              <Input type="number" value={gold22k} onChange={e => setGold22k(e.target.value)} placeholder="6842" />
            </div>
            <div>
              <Label>Gold 24K (₹/g)</Label>
              <Input type="number" value={gold24k} onChange={e => setGold24k(e.target.value)} placeholder="7450" />
            </div>
            <div>
              <Label>Silver (₹/kg)</Label>
              <Input type="number" value={silverKg} onChange={e => setSilverKg(e.target.value)} placeholder="92000" />
              {silverKg && <p className="text-xs text-muted-foreground mt-1">= ₹{silverPerGram}/g</p>}
            </div>
          </div>
          <Button onClick={handleSave} className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90" disabled={upsertRate.isPending}>
            {upsertRate.isPending ? "Saving..." : "Save Rates"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Rate Calendar</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="multiple"
              selected={rateDates}
              className="pointer-events-auto"
              modifiersClassNames={{ selected: "bg-accent text-accent-foreground" }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">30-Day Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <Tooltip formatter={(v: number) => formatINR(v, 0)} />
                <Legend />
                <Line type="monotone" dataKey="gold_22k" name="Gold 22K" stroke="hsl(49 89% 38%)" strokeWidth={2} connectNulls dot={false} />
                <Line type="monotone" dataKey="silver_per_kg" name="Silver/kg" stroke="hsl(200 5% 53%)" strokeWidth={2} connectNulls dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
