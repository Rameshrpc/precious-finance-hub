import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const shortcuts = [
  { keys: ["Ctrl", "N"], description: "New Transaction" },
  { keys: ["Ctrl", "R"], description: "Receipts / Transactions" },
  { keys: ["Ctrl", "D"], description: "Dashboard" },
  { keys: ["Ctrl", "F"], description: "Search (Global)" },
  { keys: ["Ctrl", "K"], description: "Command Palette" },
  { keys: ["?"], description: "Show Keyboard Shortcuts" },
  { keys: ["Esc"], description: "Close Dialog" },
];

const KeyboardShortcuts = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "n") { e.preventDefault(); navigate("/transactions/new"); }
      if ((e.ctrlKey || e.metaKey) && e.key === "r") { e.preventDefault(); navigate("/transactions"); }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") { e.preventDefault(); navigate("/dashboard"); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [navigate]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div key={s.description} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-muted-foreground">{s.description}</span>
              <div className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd key={k} className="px-2 py-0.5 text-xs font-mono rounded border bg-muted text-muted-foreground">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcuts;
