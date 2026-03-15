/**
 * @context  Collection detail page in the studio UI (cli/ui/app/collection/[name]).
 * @does     Fetches a collection's entries and renders the appropriate editor (sheet for arrays/mdx, form for objects).
 * @depends  actions/collections for data loading, editors/json-sheet and editors/json-form editors.
 * @do       Add new editor types (e.g. YAML) by branching on collection.type here.
 * @dont     Never embed editor logic directly — delegate to the dedicated editor components.
 */

import { AppSidebar } from "@/components/app-sidebar";
import { getCollections, getCollectionEntries } from "@/actions/collections";
import { JsonSheetEditor } from "@/editors/json-sheet/json-sheet-editor";
import { JsonFormEditor } from "@/editors/json-form/json-form-editor";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const [collections, result] = await Promise.all([
    getCollections(),
    getCollectionEntries(name),
  ]);

  if (!result) notFound();

  const { collection, entries, filePath } = result;

  const collectionsWithEntries = collections.map((collection) =>
    collection.name === name && collection.type === "mdx"
      ? {
          ...collection,
          entries: entries.map((entry) => ({
            slug: entry.slug,
            title: String(entry.data.title ?? entry.slug),
          })),
        }
      : collection,
  );

  return (
    <>
      <AppSidebar collections={collectionsWithEntries} activeCollection={name} />
      <main className="studio-main">
        {(collection.type === "json-array" || collection.type === "mdx") && (
          <JsonSheetEditor
            collection={collection}
            entries={entries}
            filePath={filePath}
          />
        )}
        {collection.type === "json-object" && (
          <JsonFormEditor
            collection={collection}
            data={entries[0]?.data ?? {}}
            filePath={filePath}
          />
        )}
      </main>
    </>
  );
}
