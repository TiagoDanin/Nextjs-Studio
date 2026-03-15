"use client";

/**
 * @context  UI editor — collapsible section at src/cli/ui/editors/json-form/form-section.tsx
 * @does     Wraps a group of form fields in a collapsible panel with reorder controls
 * @depends  @/components/ui/collapsible, @/components/ui/separator
 * @do       Add section-level actions (delete section, rename) here
 * @dont     Put field rendering logic here — that belongs in form-field.tsx
 */

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  sectionKey: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  /** Optional content rendered at the bottom of the section (e.g. Add field button). */
  footer?: React.ReactNode;
  /** When set, renders up/down reorder buttons. */
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function FormSection({
  title,
  sectionKey: _sectionKey,
  defaultOpen = false,
  children,
  footer,
  onMoveUp,
  onMoveDown,
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const canReorder = onMoveUp !== undefined || onMoveDown !== undefined;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-1">
        <CollapsibleTrigger className="flex flex-1 items-center gap-2 py-2">
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isOpen && "rotate-90",
            )}
          />
          <span className="text-base font-bold tracking-tight">{title}</span>
        </CollapsibleTrigger>

        {canReorder && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
              disabled={!onMoveUp}
              title="Move section up"
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
              disabled={!onMoveDown}
              title="Move section down"
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <Separator />
      <CollapsibleContent>
        <div className="py-4">
          {children}
          {footer && (
            <div className="mt-4 border-t border-dashed pt-4">{footer}</div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
