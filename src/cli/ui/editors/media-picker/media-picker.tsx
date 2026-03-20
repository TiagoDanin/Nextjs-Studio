"use client";

/**
 * @context  UI editor — media library modal at src/cli/ui/editors/media-picker/media-picker.tsx
 * @does     Renders a full-screen picker for browsing, uploading, and inserting media assets
 * @depends  @/stores/mdx-editor-store, @/stores/media-store, @/services/media-api
 * @do       Add media management features (rename, delete, folders) here
 * @dont     Put media serving logic here — that belongs in the API routes
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMdxEditorStore } from "@/stores/mdx-editor-store";
import { useMediaStore } from "@/stores/media-store";
import { Upload, X, FileVideo, FileAudio, File as FileIcon, Crop } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchMediaAssets, uploadMediaFile } from "@/services/media-api";
import { CropDialog } from "./crop-dialog";
import type { MediaAsset } from "@shared/types";

export function MediaPicker() {
  const open = useMediaStore((s) => s.open);
  const insertType = useMediaStore((s) => s.insertType);
  const onInsert = useMediaStore((s) => s.onInsert);
  const closePicker = useMediaStore((s) => s.closePicker);
  const collection = useMdxEditorStore((s) => s.collectionName);

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cropAsset, setCropAsset] = useState<MediaAsset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = useCallback(async () => {
    if (!collection) return;
    setLoading(true);
    try {
      const data = await fetchMediaAssets(collection);
      const filtered =
        insertType === "any"
          ? data
          : data.filter((a) => a.kind === insertType);
      setAssets(filtered);
    } finally {
      setLoading(false);
    }
  }, [collection, insertType]);

  useEffect(() => {
    if (open) {
      setSelected(null);
      fetchAssets();
    }
  }, [open, fetchAssets]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePicker();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, closePicker]);

  async function handleUpload(files: FileList | null) {
    if (!files?.length || !collection) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const asset = await uploadMediaFile(file, collection);
        if (asset) {
          setAssets((prev) => {
            const filtered = prev.filter((a) => a.name !== asset.name);
            return [asset, ...filtered];
          });
          setSelected(asset);
        }
      }
    } finally {
      setUploading(false);
    }
  }

  function handleInsert() {
    if (!selected || !onInsert) return;
    onInsert(selected.url, selected.name, selected.mimeType);
    closePicker();
  }

  async function handleCropDone(blob: Blob, filename: string) {
    if (!collection) return;
    const file = new File([blob], filename, { type: blob.type });
    const asset = await uploadMediaFile(file, collection);
    if (asset) {
      setAssets((prev) => [asset, ...prev.filter((a) => a.name !== asset.name)]);
      setSelected(asset);
    }
    setCropAsset(null);
  }

  if (!open) return null;

  return <>{createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={closePicker}
    >
      <div
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
          <span className="text-sm font-semibold">
            {insertType === "image"
              ? "Insert Image"
              : insertType === "video"
                ? "Insert Video"
                : insertType === "audio"
                  ? "Insert Audio"
                  : "Insert Media"}
          </span>
          <button
            type="button"
            onClick={closePicker}
            className="rounded-sm p-1 hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className="mx-4 mt-4 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border py-5 transition-colors hover:border-foreground/30 hover:bg-accent/30"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleUpload(e.dataTransfer.files);
          }}
        >
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
            <Upload className="h-5 w-5" />
            <span className="text-xs">
              {uploading ? "Uploading…" : "Drop files here or click to upload"}
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={
              insertType === "image"
                ? "image/*"
                : insertType === "video"
                  ? "video/*"
                  : insertType === "audio"
                    ? "audio/*"
                    : "*/*"
            }
            multiple
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Loading…</p>
          ) : assets.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No media found. Upload a file to get started.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2 pt-1 sm:grid-cols-5">
              {assets.map((asset) => (
                <AssetThumb
                  key={asset.path}
                  asset={asset}
                  isSelected={selected?.path === asset.path}
                  onSelect={() => setSelected(asset)}
                  onDoubleClick={() => {
                    setSelected(asset);
                    if (onInsert) {
                      onInsert(asset.url, asset.name, asset.mimeType);
                      closePicker();
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex h-12 shrink-0 items-center justify-between border-t px-4">
          <span className="truncate text-xs text-muted-foreground">
            {selected ? selected.name : "No file selected"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={closePicker}
              className="h-7 rounded px-3 text-xs hover:bg-accent"
            >
              Cancel
            </button>
            {selected?.kind === "image" && (
              <button
                type="button"
                onClick={() => setCropAsset(selected)}
                className="flex h-7 items-center gap-1.5 rounded border px-3 text-xs hover:bg-accent"
              >
                <Crop className="h-3 w-3" />
                Crop
              </button>
            )}
            <button
              type="button"
              disabled={!selected}
              onClick={handleInsert}
              className={cn(
                "h-7 rounded bg-foreground px-3 text-xs text-background transition-opacity",
                !selected && "cursor-not-allowed opacity-40",
              )}
            >
              Insert
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )}
  {cropAsset && (
    <CropDialog
      key={cropAsset.path}
      imageUrl={cropAsset.url}
      imageName={cropAsset.name}
      onCrop={handleCropDone}
      onClose={() => setCropAsset(null)}
    />
  )}
  </>;
}

function AssetThumb({
  asset,
  isSelected,
  onSelect,
  onDoubleClick,
}: {
  asset: MediaAsset;
  isSelected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      className={cn(
        "group flex flex-col items-center gap-1 rounded-lg border p-1.5 text-left transition-colors",
        isSelected
          ? "border-foreground bg-accent"
          : "border-transparent hover:border-border hover:bg-accent/50",
      )}
    >
      <div className="flex h-16 w-full items-center justify-center overflow-hidden rounded bg-muted">
        {asset.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.url}
            alt={asset.name}
            className="h-full w-full object-cover"
          />
        ) : asset.kind === "video" ? (
          <FileVideo className="h-6 w-6 text-muted-foreground" />
        ) : asset.kind === "audio" ? (
          <FileAudio className="h-6 w-6 text-muted-foreground" />
        ) : (
          <FileIcon className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <span className="w-full truncate text-center text-[10px] text-muted-foreground">
        {asset.name}
      </span>
    </button>
  );
}
