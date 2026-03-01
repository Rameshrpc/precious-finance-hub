import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Unauthorized from "./pages/Unauthorized";
import AppShell from "./components/AppShell";
import DashboardHome from "./pages/DashboardHome";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import CustomersPage from "./pages/CustomersPage";
import MastersPage from "./pages/MastersPage";
import LOSPipelinePage from "./pages/LOSPipelinePage";
import NewApplicationPage from "./pages/NewApplicationPage";
import TransactionsNewPage from "./pages/TransactionsNewPage";
import TransactionsListPage from "./pages/TransactionsListPage";
import TransactionDetailPage from "./pages/TransactionDetailPage";
import VaultPage from "./pages/VaultPage";
import OpeningBalanceImportPage from "./pages/OpeningBalanceImportPage";
import ForfeituresPage from "./pages/ForfeituresPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import AuctionsPage from "./pages/AuctionsPage";
import BalanceTransferPage from "./pages/BalanceTransferPage";
import ChartOfAccountsPage from "./pages/ChartOfAccountsPage";
import ManualVoucherPage from "./pages/ManualVoucherPage";
import DayBookPage from "./pages/DayBookPage";
import LedgerPage from "./pages/LedgerPage";
import TrialBalancePage from "./pages/TrialBalancePage";
import {
  TransactionsPipelinePage,
  PnLPage,
  BalanceSheetPage,
  ReportsPage,
  CollectionPage,
  WhatsAppInboxPage,
  TemplatesPage,
  SettingsPage,
} from "./pages/PlaceholderPages";
import CronStatusPage from "./pages/CronStatusPage";

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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/transactions" element={<TransactionsListPage />} />
            <Route path="/transactions/new" element={<TransactionsNewPage />} />
            <Route path="/transactions/:id" element={<TransactionDetailPage />} />
            <Route path="/transactions/pipeline" element={<TransactionsPipelinePage />} />
            <Route path="/transactions/import" element={<OpeningBalanceImportPage />} />
            <Route path="/transactions/forfeitures" element={<ForfeituresPage />} />
            <Route path="/transactions/auctions" element={<AuctionsPage />} />
            <Route path="/transactions/los" element={<LOSPipelinePage />} />
            <Route path="/transactions/los/new" element={<NewApplicationPage />} />
            <Route path="/vault" element={<VaultPage />} />
            <Route path="/accounting/vouchers" element={<ManualVoucherPage />} />
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
            <Route path="/settings/masters" element={<MastersPage />} />
            <Route path="/settings/cron-status" element={<CronStatusPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
