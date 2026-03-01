import { Outlet } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import TopBar from "@/components/TopBar";
import { SidebarStateProvider, useSidebarState } from "@/contexts/SidebarContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const MobileSidebar = () => {
  const { mobileOpen, setMobileOpen } = useSidebarState();
  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="p-0 w-[260px] border-0">
        <AppSidebar />
      </SheetContent>
    </Sheet>
  );
};

const ShellInner = () => {
  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      {/* Mobile drawer */}
      <MobileSidebar />
      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto bg-muted/30 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AppShell = () => (
  <TenantProvider>
    <SidebarStateProvider>
      <ShellInner />
    </SidebarStateProvider>
  </TenantProvider>
);

export default AppShell;
