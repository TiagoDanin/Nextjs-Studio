"use client";

/**
 * @context  UI editor — locale switcher at src/cli/ui/editors/mdx-editor/locale-switcher.tsx
 * @does     Renders inline tabs for switching between locale variants and creating new ones
 * @depends  next/navigation, @/actions/collections
 * @do       Add locale deletion or duplication actions here
 * @dont     Put locale detection logic here — that belongs in locale-parser.ts
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { createLocaleVariant } from "@/actions/collections";
import { toast } from "@/components/ui/toast";

interface Props {
  collectionName: string;
  slug: string;
  currentLocale: string;
  locales: { locale: string; slug: string }[];
}

export function LocaleSwitcher({ collectionName, slug, currentLocale, locales }: Props) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  const handleCreate = () => {
    const code = draft.trim().toLowerCase();
    if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(code)) {
      toast("Use a locale like 'pt' or 'pt-BR'", "error");
      return;
    }
    if (locales.some((l) => l.locale === code)) {
      toast("Variant already exists", "error");
      return;
    }
    startTransition(async () => {
      const result = await createLocaleVariant(collectionName, slug, code);
      if (!result.success) {
        toast(result.error ?? "Failed to create variant", "error");
        return;
      }
      toast(`Created ${code.toUpperCase()} variant`, "success");
      setAdding(false);
      setDraft("");
      router.push(`/collection/${collectionName}/${slug}?locale=${code}`);
      router.refresh();
    });
  };

  const showTabs = locales.length > 1;
  if (!showTabs && !adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="flex items-center gap-1 rounded-md border border-dashed border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground hover:border-foreground/40 hover:text-foreground"
        title="Add locale variant"
      >
        <Plus className="h-3 w-3" />
        Locale
      </button>
    );
  }

  return (
    <div
      role="tablist"
      aria-label="Locale variants"
      className="flex items-center gap-0.5 rounded-md border border-border/60 bg-background/40 p-0.5"
    >
      {locales.map(({ locale }) => {
        const isActive = currentLocale === locale;
        const label = locale === "default" ? "Default" : locale.toUpperCase();
        return (
          <button
            key={locale}
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              const params = locale === "default" ? "" : `?locale=${locale}`;
              router.push(`/collection/${collectionName}/${slug}${params}`);
            }}
            className={cn(
              "rounded px-2 py-0.5 text-[11px] font-medium tracking-wide transition-colors",
              isActive
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
            )}
          >
            {label}
          </button>
        );
      })}
      {adding ? (
        <div className="flex items-center gap-0.5">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") {
                setAdding(false);
                setDraft("");
              }
            }}
            placeholder="pt"
            className="h-5 w-12 rounded bg-background px-1.5 text-[11px] outline-none ring-1 ring-border focus:ring-foreground/40"
            disabled={pending}
          />
          <button
            onClick={handleCreate}
            disabled={pending}
            className="flex h-5 w-5 items-center justify-center rounded text-foreground/70 hover:bg-foreground/5 hover:text-foreground disabled:opacity-50"
            title="Create variant"
          >
            <Check className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
          title="Add locale variant"
        >
          <Plus className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
