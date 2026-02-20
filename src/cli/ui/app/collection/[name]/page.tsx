import { AppSidebar } from "@/components/app-sidebar";
import { getCollections, getCollectionEntries } from "@/actions/collections";
import { JsonSheetEditor } from "@/components/json-sheet/json-sheet-editor";
import { JsonFormEditor } from "@/components/json-form/json-form-editor";
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

  const collectionsWithEntries = collections.map((c) =>
    c.name === name && c.type === "mdx"
      ? {
          ...c,
          entries: entries.map((e) => ({
            slug: e.slug,
            title: String(e.data.title ?? e.slug),
          })),
        }
      : c,
  );

  return (
    <>
      <AppSidebar collections={collectionsWithEntries} activeCollection={name} />
      <main className="flex flex-1 flex-col overflow-hidden">
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
