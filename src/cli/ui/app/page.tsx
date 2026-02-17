import { AppSidebar } from "@/components/app-sidebar";
import { getCollections } from "@/actions/collections";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const collections = await getCollections();

  return (
    <>
      <AppSidebar collections={collections} />
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Welcome to nextjs-studio</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Select a collection from the sidebar to start editing
          </p>
          {collections.length > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
              {collections.length} collection{collections.length !== 1 ? "s" : ""} found
            </p>
          )}
        </div>
      </main>
    </>
  );
}
