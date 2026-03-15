/**
 * @context  UI component — native select at src/cli/ui/components/ui/native-select.tsx
 * @does     Renders a native HTML <select> styled to match shadcn Input appearance
 * @depends  cn from @/lib/utils
 * @do       Extend with additional HTML select props (disabled, name, etc.) as needed
 * @dont     Turn this into a Radix Select — it intentionally uses the native element
 */

import { cn } from "@/lib/utils";

interface NativeSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  className?: string;
}

export function NativeSelect({
  value,
  onChange,
  options,
  className,
}: NativeSelectProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
