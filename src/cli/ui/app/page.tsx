/**
 * @context  Home page of the studio UI (cli/ui/app), the default route at "/".
 * @does     Fetches all collections and renders an overview grid with cards linking to each collection.
 * @depends  actions/collections for getCollections, components/app-sidebar for navigation.
 * @do       Add workspace-level features (search, recent entries) to this page.
 * @dont     Never render editor components here — each editor lives on its own collection route.
 */

import Link from "next/link";
import {
  FileText,
  Table,
  FileJson,
  ArrowRight,
  Layers2,
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { getCollections } from "@/actions/collections";

export const dynamic = "force-dynamic";

const typeIcons = {
  mdx: FileText,
  "json-array": Table,
  "json-object": FileJson,
} as const;

const typeLabels = {
  mdx: "MDX content",
  "json-array": "JSON array",
  "json-object": "JSON object",
} as const;

export default async function HomePage() {
  const collections = await getCollections();
  const totalEntries = collections.reduce((sum, collection) => sum + collection.count, 0);

  return (
    <>
      <AppSidebar collections={collections} />
      <main className="studio-main">
        <div className="studio-topbar">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/75">
              Overview
            </p>
            <h1 className="text-[16px] font-bold tracking-tight">Collections</h1>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground/80">
            {collections.length} collection{collections.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="studio-canvas">
          {collections.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">No collections found</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    contents/
                  </code>{" "}
                  directory to get started.
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full px-6 py-8">
              <div className="mb-6 studio-surface p-5">
                <h2 className="text-xl font-bold tracking-tight">Workspace</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Browse and edit content collections.
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{collections.length} collections</span>
                  <span>{totalEntries} entries</span>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-bold tracking-tight">All collections</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Open a collection to edit items.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {collections.map((collection) => {
                  const Icon = typeIcons[collection.type];
                  const label = typeLabels[collection.type];

                  return (
                    <Link
                      key={collection.name}
                      href={`/collection/${collection.name}`}
                      className="group studio-surface block p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40"
                    >
                      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[16px] font-bold capitalize tracking-tight">
                          {collection.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {label}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Layers2 className="h-3.5 w-3.5" />
                          {collection.count}{" "}
                          {collection.count === 1 ? "entry" : "entries"}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
