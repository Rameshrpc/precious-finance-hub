import { useState, useCallback } from "react";
import { useCustomers, useBranches, type Customer } from "@/hooks/useCustomers";
import CustomerSheet from "@/components/CustomerSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, Users, ChevronLeft, ChevronRight, Phone } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-muted text-muted-foreground border-border",
  blocked: "bg-destructive/10 text-destructive border-destructive/20",
};

const categoryColors: Record<string, string> = {
  Regular: "bg-secondary text-secondary-foreground",
  VIP: "bg-gold/10 text-gold border-gold/20",
  Corporate: "bg-primary/10 text-primary border-primary/20",
};

const CustomersPage = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const isMobile = useIsMobile();

  const { data: branches = [] } = useBranches();
  const { data, isLoading } = useCustomers({
    search: debouncedSearch,
    branch_id: branchFilter || undefined,
    category: categoryFilter || undefined,
    status: statusFilter || undefined,
    page,
    pageSize: 25,
  });

  const customers = data?.data || [];
  const total = data?.count || 0;
  const totalPages = Math.ceil(total / 25);

  // Debounced search
  const debounceRef = useCallback(() => {
    let timer: ReturnType<typeof setTimeout>;
    return (val: string) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setDebouncedSearch(val);
        setPage(0);
      }, 300);
    };
  }, [])();

  const handleSearch = (val: string) => {
    setSearch(val);
    debounceRef(val);
  };

  const openAdd = () => {
    setEditCustomer(null);
    setSheetOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditCustomer(c);
    setSheetOpen(true);
  };

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">{total} customer{total !== 1 ? "s" : ""} registered</p>
        </div>
        <Button variant="gold" className="gap-2 shrink-0" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Customer
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or code..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={branchFilter} onValueChange={(v) => { setBranchFilter(v === "all" ? "" : v); setPage(0); }}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v === "all" ? "" : v); setPage(0); }}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Regular">Regular</SelectItem>
            <SelectItem value="VIP">VIP</SelectItem>
            <SelectItem value="Corporate">Corporate</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(0); }}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : customers.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-display font-bold text-foreground mb-1">No customers found</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            {debouncedSearch ? "Try adjusting your search or filters." : "Add your first customer to get started."}
          </p>
          {!debouncedSearch && (
            <Button variant="gold" className="gap-2" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add Customer
            </Button>
          )}
        </div>
      ) : isMobile ? (
        /* Mobile card layout */
        <div className="space-y-2">
          {customers.map((c) => (
            <Card key={c.id} className="cursor-pointer hover:border-gold/30 transition-colors" onClick={() => openEdit(c)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{c.code}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> +91 {c.phone}
                    </div>
                    {c.city && <p className="text-xs text-muted-foreground mt-0.5">{c.city}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="outline" className={categoryColors[c.category] || ""}>{c.category}</Badge>
                    <Badge variant="outline" className={statusColors[c.status] || ""}>{c.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Desktop table */
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-24">Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="w-24">Category</TableHead>
                <TableHead className="w-20 text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => openEdit(c)}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">{c.code}</TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-sm">+91 {c.phone}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.city || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${categoryColors[c.category] || ""}`}>{c.category}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`text-[10px] ${statusColors[c.status] || ""}`}>{c.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Showing {page * 25 + 1}–{Math.min((page + 1) * 25, total)} of {total}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Sheet */}
      <CustomerSheet open={sheetOpen} onOpenChange={setSheetOpen} customer={editCustomer} />
    </div>
  );
};

export default CustomersPage;
