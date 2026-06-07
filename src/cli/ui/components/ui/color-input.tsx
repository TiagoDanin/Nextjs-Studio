"use client";

/**
 * @context  Reusable color picker control (cli/ui/components/ui).
 * @does     Renders a native color swatch plus a free-text hex input, kept in sync.
 * @depends  components/ui/input, lib/utils.
 * @do       Use for any `color` field across the editors (form, sheet, frontmatter).
 * @dont     Hardcode field-specific layout here — pass className/inputClassName instead.
 */

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Extra classes for the text input (e.g. height/text size in compact contexts). */
  inputClassName?: string;
  /** Swatch size in px. Defaults to 28 (h-7/w-7). */
  swatchSize?: number;
}

export function ColorInput({
  value,
  onChange,
  placeholder = "#000000",
  className,
  inputClassName,
  swatchSize = 28,
}: Props) {
  const isHex = HEX_RE.test(value);
  // The native <input type="color"> only accepts #rrggbb — fall back to black.
  const swatchValue = isHex ? value : "#000000";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label
        className="relative inline-flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded border border-input shadow-sm"
        style={{
          width: swatchSize,
          height: swatchSize,
          backgroundColor: isHex ? value : undefined,
          // Checkerboard hint when the value isn't a valid hex color.
          backgroundImage: isHex
            ? undefined
            : "linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)",
          backgroundSize: "8px 8px",
          backgroundPosition: "0 0,0 4px,4px -4px,-4px 0",
        }}
        title="Pick a color"
      >
        <input
          type="color"
          value={swatchValue}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Pick a color"
        />
      </label>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn("flex-1", inputClassName)}
      />
    </div>
  );
}
