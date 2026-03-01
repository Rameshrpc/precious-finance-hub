import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useBranches } from "@/hooks/useMasters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, CalendarIcon, List, CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TYPE_COLORS: Record<string, string> = {
  national: "bg-destructive text-destructive-foreground",
  state: "bg-warning text-warning-foreground",
  custom: "bg-primary text-primary-foreground",
};

const TYPE_DOT_COLORS: Record<string, string> = {
  national: "bg-destructive",
  state: "bg-[hsl(var(--warning))]",
  custom: "bg-primary",
};

export default function HolidaysTab() {
  const { tenantId } = useTenant();
  const { data: branches } = useBranches();
  const qc = useQueryClient();
  const [view, setView] = useState<"calendar" | "table">("calendar");
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [name, setName] = useState("");
  const [holidayType, setHolidayType] = useState("custom");
  const [branchId, setBranchId] = useState("all");

  const { data: holidays, isLoading } = useQuery({
    queryKey: ["holidays", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("holidays")
        .select("*, branches(name)")
        .eq("tenant_id", tenantId!)
        .order("holiday_date", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (row: { holiday_date: string; name: string; holiday_type: string; branch_id: string | null }) => {
      const { error } = await supabase.from("holidays").insert({ ...row, tenant_id: tenantId! });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["holidays", tenantId] });
      toast.success("Holiday added");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("holidays").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["holidays", tenantId] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleAdd = () => {
    if (!selectedDate || !name) return;
    addMutation.mutate({
      holiday_date: format(selectedDate, "yyyy-MM-dd"),
      name,
      holiday_type: holidayType,
      branch_id: branchId === "all" ? null : branchId,
    });
  };

  const openDialog = () => {
    setSelectedDate(undefined);
    setName("");
    setHolidayType("custom");
    setBranchId("all");
    setOpen(true);
  };

  // Group holidays by date for calendar dots
  const holidaysByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    (holidays || []).forEach((h: any) => {
      const key = h.holiday_date;
      if (!map[key]) map[key] = [];
      map[key].push(h);
    });
    return map;
  }, [holidays]);

  const holidayDates = useMemo(() => (holidays || []).map((h: any) => new Date(h.holiday_date)), [holidays]);

  if (isLoading) return <div className="space-y-2 mt-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1">
          <Button size="sm" variant={view === "calendar" ? "default" : "outline"} onClick={() => setView("calendar")}
            className={view === "calendar" ? "bg-accent text-accent-foreground" : ""}>
            <CalendarDays className="h-4 w-4 mr-1" />Calendar
          </Button>
          <Button size="sm" variant={view === "table" ? "default" : "outline"} onClick={() => setView("table")}
            className={view === "table" ? "bg-accent text-accent-foreground" : ""}>
            <List className="h-4 w-4 mr-1" />Table
          </Button>
        </div>
        <Button onClick={openDialog} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4 mr-1" />Add Holiday
        </Button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-destructive" />National</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--warning))]" />State</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary" />Custom</span>
      </div>

      {view === "calendar" ? (
        <Card>
          <CardContent className="pt-4 flex justify-center">
            <Calendar
              mode="multiple"
              selected={holidayDates}
              className="pointer-events-auto"
              components={{
                DayContent: ({ date }) => {
                  const key = format(date, "yyyy-MM-dd");
                  const dayHolidays = holidaysByDate[key];
                  return (
                    <div className="relative flex flex-col items-center">
                      <span>{date.getDate()}</span>
                      {dayHolidays && (
                        <div className="flex gap-0.5 mt-0.5">
                          {dayHolidays.slice(0, 3).map((h: any, i: number) => (
                            <span key={i} className={cn("w-1.5 h-1.5 rounded-full", TYPE_DOT_COLORS[h.holiday_type] || "bg-primary")} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                },
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Branch</TableHead><TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(holidays || []).map((h: any) => (
              <TableRow key={h.id}>
                <TableCell>{format(new Date(h.holiday_date), "dd/MM/yyyy")}</TableCell>
                <TableCell className="font-medium">{h.name}</TableCell>
                <TableCell><Badge className={TYPE_COLORS[h.holiday_type]}>{h.holiday_type}</Badge></TableCell>
                <TableCell>{h.branches?.name || "All"}</TableCell>
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Delete "{h.name}"?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(h.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
            {(!holidays || holidays.length === 0) && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No holidays yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Add Holiday Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Holiday</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Republic Day" /></div>
            <div>
              <Label>Type</Label>
              <RadioGroup value={holidayType} onValueChange={setHolidayType} className="flex gap-4 mt-1">
                <div className="flex items-center gap-2"><RadioGroupItem value="national" id="hn" /><Label htmlFor="hn">National</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="state" id="hs" /><Label htmlFor="hs">State</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="custom" id="hc" /><Label htmlFor="hc">Custom</Label></div>
              </RadioGroup>
            </div>
            <div>
              <Label>Branch</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {(branches || []).map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd} disabled={addMutation.isPending || !selectedDate || !name} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {addMutation.isPending ? "Saving..." : "Save Holiday"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
