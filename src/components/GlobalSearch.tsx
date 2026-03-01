import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Users, Receipt, FileText, Search } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: "customer" | "loan" | "voucher";
  path: string;
}

const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("recent_searches");
    if (stored) setRecentSearches(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName))) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      const q = `%${query}%`;
      const [custRes, loanRes] = await Promise.all([
        supabase.from("customers").select("id, name, phone, code").ilike("name", q).limit(5),
        supabase.from("loans").select("id, loan_number, amount, product_type").ilike("loan_number", q).limit(5),
      ]);
      const mapped: SearchResult[] = [
        ...(custRes.data || []).map((c) => ({ id: c.id, title: c.name, subtitle: `${c.code} • ${c.phone}`, type: "customer" as const, path: `/customers?q=${c.id}` })),
        ...(loanRes.data || []).map((l) => ({ id: l.id, title: l.loan_number, subtitle: `${l.product_type} • ₹${l.amount}`, type: "loan" as const, path: `/transactions/${l.id}` })),
      ];
      setResults(mapped);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const onSelect = (result: SearchResult) => {
    const updated = [result.title, ...recentSearches.filter((s) => s !== result.title)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recent_searches", JSON.stringify(updated));
    setOpen(false);
    navigate(result.path);
  };

  const typeIcon = { customer: Users, loan: Receipt, voucher: FileText };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search customers, loans, vouchers..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {results.length > 0 && (
          <>
            {["customer", "loan"].map((type) => {
              const group = results.filter((r) => r.type === type);
              if (!group.length) return null;
              const Icon = typeIcon[type as keyof typeof typeIcon];
              return (
                <CommandGroup key={type} heading={type === "customer" ? "Customers" : "Loans"}>
                  {group.map((r) => (
                    <CommandItem key={r.id} onSelect={() => onSelect(r)}>
                      <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{r.subtitle}</p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </>
        )}
        {!query && recentSearches.length > 0 && (
          <CommandGroup heading="Recent Searches">
            {recentSearches.map((s) => (
              <CommandItem key={s} onSelect={() => setQuery(s)}>
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                {s}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default GlobalSearch;
