/**
 * @context  Loading skeleton for the collection page (cli/ui/app/collection/[name]).
 * @does     Renders a sidebar skeleton and a loading placeholder while the collection data streams in.
 * @depends  components/app-sidebar-skeleton for the sidebar shell.
 * @do       Enhance the skeleton to match the shape of the actual editor being loaded.
 * @dont     Never fetch data or use client state here — this is a pure loading UI.
 */

import { AppSidebarSkeleton } from "@/components/app-sidebar-skeleton";

export default function Loading() {
  return (
    <>
      <AppSidebarSkeleton />
      <main className="studio-main">
        <div className="studio-topbar px-6">
          <div className="h-3.5 w-32 rounded bg-muted-foreground/15" />
        </div>
        <div className="studio-canvas flex items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">Loading collection...</p>
        </div>
      </main>
    </>
  );
}
