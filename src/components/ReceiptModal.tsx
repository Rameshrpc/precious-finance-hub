import { useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatINR, formatDate } from "@/lib/formatters";
import { getLabel } from "@/lib/labels";
import { Printer, Download, X } from "lucide-react";

interface ReceiptData {
  receiptNumber: string;
  loanNumber: string;
  customerName: string;
  productType: string;
  schemeName?: string;
  collectedBy: string;
  paymentMode: string;
  reference?: string;
  totalAmount: number;
  collectedAt: string;
  lineItems: {
    periodStart: string;
    periodEnd: string;
    chargeType: string;
    dueAmount: number;
    paidAmount: number;
    mode: string;
  }[];
  branch?: {
    name: string;
    address?: string;
    phone?: string;
  };
}

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ReceiptData | null;
}

export default function ReceiptModal({ open, onOpenChange, data }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!data) return null;

  const chargeLabel = getLabel(data.productType, "charge");

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    // Simple: open print dialog which allows "Save as PDF"
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 print:max-w-none print:shadow-none print:border-none">
        {/* Action buttons - hidden in print */}
        <div className="flex items-center justify-end gap-2 p-3 border-b print:hidden">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" />Print
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5" />Download PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Receipt content */}
        <div ref={receiptRef} id="receipt-printable" className="p-6 bg-white text-black print:p-8">
          {/* Header with accent bar */}
          <div className="border-b-4 border-[hsl(var(--accent))] pb-4 mb-4">
            <div className="text-center">
              {data.branch ? (
                <>
                  <h2 className="text-lg font-bold uppercase tracking-wide">{data.branch.name}</h2>
                  {data.branch.address && <p className="text-xs text-gray-500 mt-0.5">{data.branch.address}</p>}
                  {data.branch.phone && <p className="text-xs text-gray-500">Ph: {data.branch.phone}</p>}
                </>
              ) : (
                <h2 className="text-lg font-bold uppercase tracking-wide">Charge Collection Receipt</h2>
              )}
            </div>
          </div>

          {/* Title & Receipt Number */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold uppercase text-gray-600">{chargeLabel} Collection Receipt</h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Receipt No.</p>
              <p className="font-mono font-bold text-sm">{data.receiptNumber}</p>
            </div>
          </div>

          <Separator className="mb-4 bg-gray-200" />

          {/* Loan Summary */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm mb-4">
            <ReceiptRow label="Loan No" value={data.loanNumber} />
            <ReceiptRow label="Customer" value={data.customerName} />
            <ReceiptRow label="Product" value={getLabel(data.productType, "product")} />
            {data.schemeName && <ReceiptRow label="Scheme" value={data.schemeName} />}
          </div>

          <Separator className="mb-4 bg-gray-200" />

          {/* Charge Details Table */}
          <table className="w-full text-xs border-collapse mb-4">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-1.5 font-semibold text-gray-600">Period</th>
                <th className="text-left py-1.5 font-semibold text-gray-600">Type</th>
                <th className="text-right py-1.5 font-semibold text-gray-600">Due</th>
                <th className="text-right py-1.5 font-semibold text-gray-600">Paid</th>
                <th className="text-right py-1.5 font-semibold text-gray-600">Mode</th>
              </tr>
            </thead>
            <tbody>
              {data.lineItems.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-1.5">{formatDate(item.periodStart)} – {formatDate(item.periodEnd)}</td>
                  <td className="py-1.5">{item.chargeType}</td>
                  <td className="py-1.5 text-right">{formatINR(item.dueAmount)}</td>
                  <td className="py-1.5 text-right font-medium">{formatINR(item.paidAmount)}</td>
                  <td className="py-1.5 text-right capitalize">{item.mode}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-400">
                <td colSpan={3} className="py-2 font-bold text-sm text-right">Total Collected</td>
                <td className="py-2 font-bold text-sm text-right">{formatINR(data.totalAmount)}</td>
                <td />
              </tr>
            </tfoot>
          </table>

          {data.reference && (
            <p className="text-xs text-gray-500 mb-4">Reference: {data.reference}</p>
          )}

          <Separator className="mb-4 bg-gray-200" />

          {/* Footer */}
          <div className="flex justify-between text-xs text-gray-500 mb-6">
            <div>
              <p>Collected by: <span className="text-black font-medium">{data.collectedBy}</span></p>
              <p>Date: {new Date(data.collectedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
            </div>
            <div className="text-right">
              <p>Payment Mode: <span className="text-black capitalize">{data.paymentMode}</span></p>
            </div>
          </div>

          {/* Signature line */}
          <div className="flex justify-between mt-8 pt-2">
            <div className="text-center">
              <div className="w-36 border-t border-gray-400 mt-8" />
              <p className="text-[10px] text-gray-500 mt-1">Customer Signature</p>
            </div>
            <div className="text-center">
              <div className="w-36 border-t border-gray-400 mt-8" />
              <p className="text-[10px] text-gray-500 mt-1">Authorized Signature</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
