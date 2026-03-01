import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Download, Filter } from "lucide-react";

export interface ReportFilterValues {
  dateFrom: string;
  dateTo: string;
  productType: string;
  metalType: string;
  branch: string;
}

interface ReportFiltersProps {
  onFilter: (filters: ReportFilterValues) => void;
  onExport?: (format: "pdf" | "excel") => void;
  showMetal?: boolean;
  showBranch?: boolean;
}

export default function ReportFilters({ onFilter, onExport, showMetal = true, showBranch = false }: ReportFiltersProps) {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [filters, setFilters] = useState<ReportFilterValues>({
    dateFrom: monthAgo,
    dateTo: today,
    productType: "all",
    metalType: "all",
    branch: "all",
  });

  const update = (key: keyof ReportFilterValues, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onFilter(next);
  };

  return (
    <div className="flex flex-wrap items-end gap-3 p-4 bg-muted/30 rounded-lg border">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">From</label>
        <Input type="date" value={filters.dateFrom} onChange={(e) => update("dateFrom", e.target.value)} className="w-36" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">To</label>
        <Input type="date" value={filters.dateTo} onChange={(e) => update("dateTo", e.target.value)} className="w-36" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Product</label>
        <Select value={filters.productType} onValueChange={(v) => update("productType", v)}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="GL">GL</SelectItem>
            <SelectItem value="PO">PO</SelectItem>
            <SelectItem value="SA">SA</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {showMetal && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Metal</label>
          <Select value={filters.metalType} onValueChange={(v) => update("metalType", v)}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="silver">Silver</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <Button variant="outline" size="sm" onClick={() => onFilter(filters)}>
        <Filter className="h-4 w-4 mr-1" /> Apply
      </Button>
      {onExport && (
        <div className="flex gap-1 ml-auto">
          <Button variant="outline" size="sm" onClick={() => onExport("excel")}>
            <Download className="h-4 w-4 mr-1" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExport("pdf")}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
        </div>
      )}
    </div>
  );
}
