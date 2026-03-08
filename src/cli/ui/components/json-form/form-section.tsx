"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  sectionKey: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  /** Optional content rendered at the bottom of the section (e.g. Add field button). */
  footer?: React.ReactNode;
}

export function FormSection({
  title,
  sectionKey: _sectionKey,
  defaultOpen = false,
  children,
  footer,
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 py-2">
        <ChevronRight
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-90",
          )}
        />
        <span className="text-base font-bold tracking-tight">{title}</span>
      </CollapsibleTrigger>
      <Separator />
      <CollapsibleContent>
        <div className="py-4">
          {children}
          {footer && (
            <div className="mt-4 border-t border-dashed pt-4">
              {footer}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
