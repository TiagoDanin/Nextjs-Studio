/**
 * @context  UI component — empty state at src/cli/ui/components/ui/empty-state.tsx
 * @does     Renders a reusable empty state placeholder with icon, title, and description
 * @depends  none (standalone)
 * @do       Add new variants or action slots here
 * @dont     Put data fetching here — this is a purely presentational component
 */

import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, children }: Props) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
