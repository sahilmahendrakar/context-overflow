import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import Header from "../components/Header";
import { SidebarInset } from "@/components/ui/sidebar";
import { SidebarShell } from "@/app/components/SidebarShell";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarShell>
      <AppSidebar />
      <SidebarInset>
        <Suspense
          fallback={
            <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_86%,transparent)] backdrop-blur-md">
              <div className="mx-auto flex h-[var(--co-header-height)] w-full min-w-0 max-w-6xl items-center px-4 sm:px-5" />
            </header>
          }
        >
          <Header />
        </Suspense>
        <div className="mx-auto w-full min-w-0 max-w-6xl px-4 py-8 sm:px-5">{children}</div>
      </SidebarInset>
    </SidebarShell>
  );
}
