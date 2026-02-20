import { notFound } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { MdxEditor } from "@/components/mdx-editor/mdx-editor";
import { getCollections, getMdxEntry, getCollectionEntries } from "@/actions/collections";

export const dynamic = "force-dynamic";

export default async function MdxEntryPage({
  params,
}: {
  params: Promise<{ name: string; slug: string }>;
}) {
  const { name, slug } = await params;

  const [collections, entry, collectionResult] = await Promise.all([
    getCollections(),
    getMdxEntry(name, slug),
    getCollectionEntries(name),
  ]);

  if (!entry) notFound();

  const collectionsWithEntries = collections.map((c) =>
    c.name === name && c.type === "mdx" && collectionResult
      ? {
          ...c,
          entries: collectionResult.entries.map((e) => ({
            slug: e.slug,
            title: String(e.data.title ?? e.slug),
          })),
        }
      : c,
  );

  return (
    <>
      <AppSidebar
        collections={collectionsWithEntries}
        activeCollection={name}
        activeSlug={slug}
      />
      <main className="flex flex-1 flex-col overflow-hidden">
        <MdxEditor
          collectionName={name}
          slug={slug}
          filePath={entry.filePath}
          frontmatter={entry.frontmatter}
          body={entry.body}
        />
      </main>
    </>
  );
}
