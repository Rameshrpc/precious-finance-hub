import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import AppShell from "./components/AppShell";
import DashboardHome from "./pages/DashboardHome";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import {
  CustomersPage,
  TransactionsNewPage,
  TransactionsListPage,
  TransactionsPipelinePage,
  VaultPage,
  VouchersPage,
  DayBookPage,
  LedgerPage,
  TrialBalancePage,
  PnLPage,
  BalanceSheetPage,
  ReportsPage,
  ApprovalsPage,
  CollectionPage,
  WhatsAppInboxPage,
  TemplatesPage,
  SettingsPage,
} from "./pages/PlaceholderPages";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/transactions/new" element={<TransactionsNewPage />} />
            <Route path="/transactions" element={<TransactionsListPage />} />
            <Route path="/transactions/pipeline" element={<TransactionsPipelinePage />} />
            <Route path="/vault" element={<VaultPage />} />
            <Route path="/accounting/vouchers" element={<VouchersPage />} />
            <Route path="/accounting/daybook" element={<DayBookPage />} />
            <Route path="/accounting/ledger" element={<LedgerPage />} />
            <Route path="/accounting/trial-balance" element={<TrialBalancePage />} />
            <Route path="/accounting/pnl" element={<PnLPage />} />
            <Route path="/accounting/balance-sheet" element={<BalanceSheetPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/collection" element={<CollectionPage />} />
            <Route path="/communications/whatsapp" element={<WhatsAppInboxPage />} />
            <Route path="/communications/templates" element={<TemplatesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
