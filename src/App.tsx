import { AuthProvider } from "@/hooks/useAuth";
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
import PnLPage from "./pages/PnLPage";
import BalanceSheetPage from "./pages/BalanceSheetPage";
import DayBookPage from "./pages/DayBookPage";
import LedgerPage from "./pages/LedgerPage";
import TrialBalancePage from "./pages/TrialBalancePage";
import ReportsHubPage from "./pages/ReportsHubPage";
import NPADashboardPage from "./pages/NPADashboardPage";
import DPDTrackerPage from "./pages/DPDTrackerPage";
import CollectionQueuePage from "./pages/CollectionQueuePage";
import TelecallerPage from "./pages/TelecallerPage";
import WhatsAppInboxPage from "./pages/WhatsAppInboxPage";
import TemplatesManagerPage from "./pages/TemplatesManagerPage";
import BorrowerPortalPage from "./pages/BorrowerPortalPage";
import GrievancePage from "./pages/GrievancePage";
import CashManagementPage from "./pages/CashManagementPage";
import SecuritySettingsPage from "./pages/SecuritySettingsPage";
import ApiKeysPage from "./pages/ApiKeysPage";
import GlobalSearch from "./components/GlobalSearch";
import KeyboardShortcuts from "./components/KeyboardShortcuts";
import SessionTimeoutWarning from "./components/SessionTimeoutWarning";
import {
  TransactionsPipelinePage,
} from "./pages/PlaceholderPages";
import SettingsFullPage from "./pages/SettingsFullPage";
import SuperAdminPage from "./pages/SuperAdminPage";
import CronStatusPage from "./pages/CronStatusPage";
import TestChecklistPage from "./pages/TestChecklistPage";
import HelpCenterPage from "./pages/HelpCenterPage";
import NotificationsPage from "./pages/NotificationsPage";
import UserManagementPage from "./pages/UserManagementPage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import WhatsNewDialog from "./components/WhatsNewDialog";
import BranchSettingsPage from "./pages/BranchSettingsPage";
import SchemeSettingsPage from "./pages/SchemeSettingsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <GlobalSearch />
        <KeyboardShortcuts />
        <SessionTimeoutWarning />
        <WhatsNewDialog />
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          {/* Borrower Portal - separate layout */}
          <Route path="/customer-portal" element={<BorrowerPortalPage />} />
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
            <Route path="/auction" element={<AuctionsPage />} />
            <Route path="/transactions/balance-transfer" element={<BalanceTransferPage />} />
            <Route path="/transactions/los" element={<LOSPipelinePage />} />
            <Route path="/transactions/los/new" element={<NewApplicationPage />} />
            <Route path="/vault" element={<VaultPage />} />
            <Route path="/accounting/chart" element={<ChartOfAccountsPage />} />
            <Route path="/accounting/vouchers" element={<ManualVoucherPage />} />
            <Route path="/accounting/daybook" element={<DayBookPage />} />
            <Route path="/accounting/ledger" element={<LedgerPage />} />
            <Route path="/accounting/trial-balance" element={<TrialBalancePage />} />
            <Route path="/accounting/pnl" element={<PnLPage />} />
            <Route path="/accounting/balance-sheet" element={<BalanceSheetPage />} />
            <Route path="/accounting/cash" element={<CashManagementPage />} />
            <Route path="/reports" element={<ReportsHubPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/collection" element={<CollectionQueuePage />} />
            <Route path="/collection/npa" element={<NPADashboardPage />} />
            <Route path="/collection/dpd" element={<DPDTrackerPage />} />
            <Route path="/collection/queue" element={<CollectionQueuePage />} />
            <Route path="/collection/telecaller" element={<TelecallerPage />} />
            <Route path="/collection/grievance" element={<GrievancePage />} />
            <Route path="/communications/whatsapp" element={<WhatsAppInboxPage />} />
            <Route path="/communications/templates" element={<TemplatesManagerPage />} />
            <Route path="/settings" element={<SettingsFullPage />} />
            <Route path="/settings/masters" element={<MastersPage />} />
            <Route path="/settings/cron-status" element={<CronStatusPage />} />
            <Route path="/settings/security" element={<SecuritySettingsPage />} />
            <Route path="/settings/api-keys" element={<ApiKeysPage />} />
            <Route path="/settings/users" element={<UserManagementPage />} />
            <Route path="/settings/branches" element={<BranchSettingsPage />} />
            <Route path="/settings/schemes" element={<SchemeSettingsPage />} />
            <Route path="/settings/profile" element={<ProfileSettingsPage />} />
            <Route path="/admin" element={<SuperAdminPage />} />
            <Route path="/admin/test-checklist" element={<TestChecklistPage />} />
            <Route path="/help" element={<HelpCenterPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
