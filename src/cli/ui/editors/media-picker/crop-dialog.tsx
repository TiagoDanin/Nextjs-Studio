"use client";

/**
 * @context  UI editor — image crop dialog at src/cli/ui/editors/media-picker/crop-dialog.tsx
 * @does     Renders a canvas-based image cropper dialog for media assets
 * @depends  @/components/ui/button
 * @do       Add aspect ratio presets, zoom controls here
 * @dont     Put media upload/browse logic here — that belongs in media-picker.tsx
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  imageUrl: string;
  imageName: string;
  onCrop: (blob: Blob, filename: string) => void;
  onClose: () => void;
}

export function CropDialog({ imageUrl, imageName, onCrop, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [crop, setCrop] = useState<CropRegion>({ x: 0, y: 0, width: 0, height: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      // Default crop: centered 80% area
      const margin = 0.1;
      setCrop({
        x: Math.round(img.naturalWidth * margin),
        y: Math.round(img.naturalHeight * margin),
        width: Math.round(img.naturalWidth * (1 - 2 * margin)),
        height: Math.round(img.naturalHeight * (1 - 2 * margin)),
      });
      setImgLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const displayW = canvas.clientWidth;
    const displayH = canvas.clientHeight;
    canvas.width = displayW;
    canvas.height = displayH;

    const scale = Math.min(displayW / img.naturalWidth, displayH / img.naturalHeight);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const offsetX = (displayW - drawW) / 2;
    const offsetY = (displayH - drawH) / 2;

    // Draw image
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

    // Draw dim overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, displayW, displayH);

    // Clear crop region
    const cx = offsetX + crop.x * scale;
    const cy = offsetY + crop.y * scale;
    const cw = crop.width * scale;
    const ch = crop.height * scale;

    ctx.clearRect(cx, cy, cw, ch);
    ctx.drawImage(
      img,
      crop.x, crop.y, crop.width, crop.height,
      cx, cy, cw, ch,
    );

    // Draw crop border
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy, cw, ch);
  }, [crop, imgLoaded]);

  useEffect(() => {
    draw();
  }, [draw]);

  function getImageCoords(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const displayW = canvas.clientWidth;
    const displayH = canvas.clientHeight;
    const scale = Math.min(displayW / img.naturalWidth, displayH / img.naturalHeight);
    const offsetX = (displayW - img.naturalWidth * scale) / 2;
    const offsetY = (displayH - img.naturalHeight * scale) / 2;

    return {
      x: Math.round((e.clientX - rect.left - offsetX) / scale),
      y: Math.round((e.clientY - rect.top - offsetY) / scale),
    };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const coords = getImageCoords(e);
    setDragging(true);
    setDragStart(coords);
    setCrop({ x: coords.x, y: coords.y, width: 0, height: 0 });
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!dragging || !imgRef.current) return;
    const coords = getImageCoords(e);
    const img = imgRef.current;
    const x = Math.max(0, Math.min(dragStart.x, coords.x));
    const y = Math.max(0, Math.min(dragStart.y, coords.y));
    const w = Math.min(Math.abs(coords.x - dragStart.x), img.naturalWidth - x);
    const h = Math.min(Math.abs(coords.y - dragStart.y), img.naturalHeight - y);
    setCrop({ x, y, width: w, height: h });
  }

  function handleMouseUp() {
    setDragging(false);
  }

  function handleCrop() {
    const img = imgRef.current;
    if (!img || crop.width < 1 || crop.height < 1) return;

    const offscreen = document.createElement("canvas");
    offscreen.width = crop.width;
    offscreen.height = crop.height;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

    offscreen.toBlob((blob) => {
      if (blob) {
        const ext = imageName.split(".").pop() ?? "png";
        const baseName = imageName.replace(/\.[^.]+$/, "");
        onCrop(blob, `${baseName}-cropped.${ext}`);
      }
    }, "image/png");
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
          <span className="text-sm font-semibold">Crop Image</span>
          <button type="button" onClick={onClose} className="rounded-sm p-1 hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden p-4">
          <canvas
            ref={canvasRef}
            className="h-[60vh] w-full cursor-crosshair rounded border bg-muted"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        <div className="flex h-12 shrink-0 items-center justify-between border-t px-4">
          <span className="text-xs text-muted-foreground">
            {crop.width > 0 && crop.height > 0
              ? `${crop.width} × ${crop.height}px`
              : "Draw a selection on the image"}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              disabled={crop.width < 1 || crop.height < 1}
              onClick={handleCrop}
            >
              Crop & Upload
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
