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
