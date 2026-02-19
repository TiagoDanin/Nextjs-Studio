"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { FormToolbar } from "./form-toolbar";
import { FormSection } from "./form-section";
import { FormField } from "./form-field";
import { FormAddField } from "./form-add-field";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CollectionSummary } from "@/actions/collections";

interface Props {
  collection: CollectionSummary;
  data: Record<string, unknown>;
  filePath: string;
}

function groupFields(data: Record<string, unknown>) {
  const general: [string, unknown][] = [];
  const sections: [string, Record<string, unknown>][] = [];

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sections.push([key, value as Record<string, unknown>]);
    } else {
      general.push([key, value]);
    }
  }

  return { general, sections };
}

export function JsonFormEditor({ collection, data, filePath }: Props) {
  const initForm = useEditorStore((s) => s.initForm);
  const formData = useEditorStore((s) => s.formData);

  useEffect(() => {
    initForm(collection.name, filePath, data);
  }, [collection.name, filePath, data, initForm]);

  const { general, sections } = groupFields(formData);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FormToolbar collectionName={collection.name} />
      <ScrollArea className="flex-1 p-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          {general.length > 0 && (
            <FormSection title="General" sectionKey="" defaultOpen>
              <div className="flex flex-col gap-4">
                {general.map(([key, value]) => (
                  <FormField key={key} fieldKey={key} path={key} value={value} />
                ))}
              </div>
            </FormSection>
          )}

          {sections.map(([key, sectionData]) => (
            <FormSection
              key={key}
              title={key.charAt(0).toUpperCase() + key.slice(1)}
              sectionKey={key}
              defaultOpen
            >
              <div className="flex flex-col gap-4">
                {Object.entries(sectionData).map(([fieldKey, value]) => (
                  <FormField
                    key={fieldKey}
                    fieldKey={fieldKey}
                    path={`${key}.${fieldKey}`}
                    value={value}
                  />
                ))}
              </div>
            </FormSection>
          ))}

          <FormAddField />
        </div>
      </ScrollArea>
    </div>
  );
}
