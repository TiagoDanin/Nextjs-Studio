"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { FormToolbar } from "./form-toolbar";
import { FormSection } from "./form-section";
import { FormField } from "./form-field";
import { FormAddField } from "./form-add-field";
import { FormAddSection } from "./form-add-section";
import { ScrollArea } from "@/components/ui/scroll-area";
import { keyLabel } from "@shared/fields";
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
    initForm(collection.name, filePath, data, collection.fields);
  }, [collection.name, filePath, data, collection.fields, initForm]);

  const { general, sections } = groupFields(formData);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FormToolbar collectionName={collection.name} />
      <ScrollArea className="studio-canvas">
        <div className="h-full w-full px-4 py-4 md:px-6">
          <div className="studio-surface flex min-h-full flex-col gap-6 p-6">

            {/* General fields — always rendered, even if empty, so there's always a place to add */}
            <FormSection
              title="General"
              sectionKey=""
              defaultOpen
              footer={<FormAddField path="" />}
            >
              <div className="flex flex-col gap-4">
                {general.map(([key, value]) => (
                  <FormField
                    key={key}
                    fieldKey={key}
                    path={key}
                    value={value}
                  />
                ))}
              </div>
            </FormSection>

            {/* Named sections */}
            {sections.map(([key, sectionData]) => (
              <FormSection
                key={key}
                title={keyLabel(key)}
                sectionKey={key}
                defaultOpen
                footer={<FormAddField path={key} />}
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

            {/* Only "Add section" at the bottom — intent is clear */}
            <FormAddSection />

          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
