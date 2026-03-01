import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { revealSensitiveField } from "@/lib/dataMasking";
import { useAuth } from "@/hooks/useAuth";
import { maskAadhaar, maskPAN } from "@/lib/formatters";

interface MaskedFieldProps {
  value: string | null;
  type: "aadhaar" | "pan";
  entityType?: string;
  entityId?: string;
  tenantId?: string;
}

const MaskedField = ({ value, type, entityType = "customer", entityId = "", tenantId = "" }: MaskedFieldProps) => {
  const [revealed, setRevealed] = useState(false);
  const { user, profile } = useAuth();

  const maskedValue = !value ? "—" : type === "aadhaar" ? maskAadhaar(value) : maskPAN(value);

  const handleReveal = useCallback(async () => {
    if (!value) return;
    setRevealed(true);
    if (tenantId && entityId) {
      await revealSensitiveField(entityType, entityId, type, tenantId, user?.id, profile?.full_name || undefined);
    }
    setTimeout(() => setRevealed(false), 10000);
  }, [value, entityType, entityId, tenantId, type, user, profile]);

  if (!value) return <span className="text-muted-foreground">—</span>;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono text-sm">{revealed ? value : maskedValue}</span>
      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={revealed ? () => setRevealed(false) : handleReveal}>
        {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
      </Button>
    </span>
  );
};

export default MaskedField;
