"use client";

/**
 * @context  UI editor — locale switcher at src/cli/ui/editors/mdx-editor/locale-switcher.tsx
 * @does     Renders a dropdown for switching between locale variants of an MDX entry
 * @depends  next/navigation, @/components/ui/native-select
 * @do       Add locale creation/deletion actions here
 * @dont     Put locale detection logic here — that belongs in locale-parser.ts
 */

import { useRouter } from "next/navigation";
import { NativeSelect } from "@/components/ui/native-select";
import { Globe } from "lucide-react";

interface Props {
  collectionName: string;
  slug: string;
  currentLocale: string;
  locales: { locale: string; slug: string }[];
}

export function LocaleSwitcher({ collectionName, slug, currentLocale, locales }: Props) {
  const router = useRouter();

  if (locales.length <= 1) return null;

  return (
    <div className="flex items-center gap-1.5">
      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
      <NativeSelect
        value={currentLocale}
        onChange={(value) => {
          const params = value === "default" ? "" : `?locale=${value}`;
          router.push(`/collection/${collectionName}/${slug}${params}`);
        }}
        options={locales.map((l) => ({ label: l.locale.toUpperCase(), value: l.locale }))}
        className="h-6 w-auto min-w-16 px-1.5 text-xs"
      />
    </div>
  );
}
