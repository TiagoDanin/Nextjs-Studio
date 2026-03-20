"use client";

/**
 * @context  UI editor — JSON form view at src/cli/ui/editors/json-form/json-form-editor.tsx
 * @does     Renders a JSON object as a sectioned form with collapsible groups and rich text support
 * @depends  @/stores/editor-store, ./form-toolbar, ./form-section, ./form-field, ./form-add-*
 * @do       Add form-level features (validation summary, keyboard shortcuts) here
 * @dont     Put individual field rendering here — that belongs in form-field.tsx
 */

import { useEffect } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { FormToolbar } from "./form-toolbar";
import { FormSection } from "./form-section";
import { FormField } from "./form-field";
import { FormAddField } from "./form-add-field";
import { FormAddSection } from "./form-add-section";
import { ScrollArea } from "@/components/ui/scroll-area";
import { keyLabel } from "@shared/field-utils";
import type { CollectionSummary } from "@/actions/collections";

interface Props {
  collection: CollectionSummary;
  data: Record<string, unknown>;
  filePath: string;
  hasSync?: boolean;
}

type DisplaySection =
  | { kind: "flat"; entries: [string, unknown][] }
  | { kind: "object"; key: string; data: Record<string, unknown> };

const RICH_TEXT_PRIORITY = ["description", "descriptions", "text", "content"];
const LONG_TEXT_THRESHOLD = 200;

/** Determine which field should get the TipTap rich text editor. */
function getPrimaryRichTextField(
  data: Record<string, unknown>,
  fieldDefs: Record<string, { type?: string }>,
): string | null {
  const flatKeys = Object.entries(data)
    .filter(([, value]) => typeof value === "string")
    .map(([k]) => k);

  // Check priority names first
  for (const candidate of RICH_TEXT_PRIORITY) {
    if (flatKeys.includes(candidate)) return candidate;
  }

  // Fallback: first field marked as long-text, or first long string
  for (const key of flatKeys) {
    if (fieldDefs[key]?.type === "long-text") return key;
  }
  for (const key of flatKeys) {
    const val = data[key] as string;
    if (val.length > LONG_TEXT_THRESHOLD || val.includes("\n")) return key;
  }

  return null;
}

/** Build an ordered list of sections preserving the original key order. */
function buildSections(data: Record<string, unknown>): DisplaySection[] {
  const sections: DisplaySection[] = [];
  let flatBuf: [string, unknown][] = [];

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      if (flatBuf.length > 0) {
        sections.push({ kind: "flat", entries: flatBuf });
        flatBuf = [];
      }
      sections.push({ kind: "object", key, data: value as Record<string, unknown> });
    } else {
      flatBuf.push([key, value]);
    }
  }

  if (flatBuf.length > 0) {
    sections.push({ kind: "flat", entries: flatBuf });
  }

  return sections;
}

export function JsonFormEditor({ collection, data, filePath, hasSync }: Props) {
  const initForm = useEditorStore((s) => s.initForm);
  const formData = useEditorStore((s) => s.formData);
  const fieldDefs = useEditorStore((s) => s.fieldDefs);
  const reorderSection = useEditorStore((s) => s.reorderSection);

  useEffect(() => {
    initForm(collection.name, filePath, data, collection.fields);
  }, [collection.name, filePath, data, collection.fields, initForm]);

  const sections = buildSections(formData);
  const primaryRichTextField = getPrimaryRichTextField(formData, fieldDefs);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FormToolbar collectionName={collection.name} hasSync={hasSync} />
      <ScrollArea className="studio-canvas">
        <div className="h-full w-full px-4 py-4 md:px-6">
          <div className="studio-surface flex min-h-full flex-col gap-6 p-6">

            {sections.map((section, idx) => {
              const canUp = idx > 0
                ? () => reorderSection(section.kind === "flat" ? "__flat__" : section.key, "up")
                : undefined;
              const canDown = idx < sections.length - 1
                ? () => reorderSection(section.kind === "flat" ? "__flat__" : section.key, "down")
                : undefined;

              if (section.kind === "flat") {
                return (
                  <FormSection
                    key="__flat__"
                    title="General"
                    sectionKey="__flat__"
                    defaultOpen
                    footer={<FormAddField path="" />}
                    onMoveUp={canUp}
                    onMoveDown={canDown}
                  >
                    <div className="flex flex-col gap-4">
                      {section.entries.map(([key, value]) => (
                        <FormField
                          key={key}
                          fieldKey={key}
                          path={key}
                          value={value}
                          isRichText={key === primaryRichTextField}
                        />
                      ))}
                    </div>
                  </FormSection>
                );
              }

              return (
                <FormSection
                  key={section.key}
                  title={keyLabel(section.key)}
                  sectionKey={section.key}
                  defaultOpen
                  footer={<FormAddField path={section.key} />}
                  onMoveUp={canUp}
                  onMoveDown={canDown}
                >
                  <div className="flex flex-col gap-4">
                    {Object.entries(section.data).map(([fieldKey, value]) => (
                      <FormField
                        key={fieldKey}
                        fieldKey={fieldKey}
                        path={`${section.key}.${fieldKey}`}
                        value={value}
                      />
                    ))}
                  </div>
                </FormSection>
              );
            })}

            <FormAddSection />

          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
