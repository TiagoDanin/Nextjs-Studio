/**
 * @context  MDX entry page in the studio UI (cli/ui/app/collection/[name]/[slug]).
 * @does     Loads a single MDX entry's frontmatter and body, then renders the full MDX editor.
 * @depends  actions/collections for getMdxEntry, editors/mdx-editor for the TipTap-based editor.
 * @do       Add entry-level metadata (word count, last saved) to this page.
 * @dont     Never render JSON editors here — this page is exclusively for MDX entries.
 */

import { notFound } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { MdxEditor } from "@/editors/mdx-editor/mdx-editor";
import { getCollections, getMdxEntry, getCollectionEntries, getComponentRegistry } from "@/actions/collections";

export const dynamic = "force-dynamic";

export default async function MdxEntryPage({
  params,
}: {
  params: Promise<{ name: string; slug: string }>;
}) {
  const { name, slug } = await params;

  const [collections, entry, collectionResult, registry] = await Promise.all([
    getCollections(),
    getMdxEntry(name, slug),
    getCollectionEntries(name),
    getComponentRegistry(),
  ]);

  if (!entry) notFound();

  const collectionsWithEntries = collections.map((collection) =>
    collection.name === name && collection.type === "mdx" && collectionResult
      ? {
          ...collection,
          entries: collectionResult.entries.map((entry) => ({
            slug: entry.slug,
            title: String(entry.data.title ?? entry.slug),
          })),
        }
      : collection,
  );

  return (
    <>
      <AppSidebar
        collections={collectionsWithEntries}
        activeCollection={name}
        activeSlug={slug}
      />
      <main className="studio-main">
        <MdxEditor
          collectionName={name}
          slug={slug}
          filePath={entry.filePath}
          frontmatter={entry.frontmatter}
          body={entry.body}
          registry={registry}
        />
      </main>
    </>
  );
}
