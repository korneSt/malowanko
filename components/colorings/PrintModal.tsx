"use client";

import { useState } from "react";
import { Printer, RotateCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type {
  ColoringDTO,
  GalleryColoringListItem,
  LibraryColoringListItem,
  PrintOrientation,
} from "@/app/types";
import { useColoringImage } from "@/hooks/useColoringImage";

// ============================================================================
// Types
// ============================================================================

interface PrintModalProps {
  coloring: ColoringDTO | GalleryColoringListItem | LibraryColoringListItem;
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MM_TO_PX = 3.779527559; // 1mm = 3.779527559px at 96 DPI
const MAX_PREVIEW_WIDTH = 400;

// ============================================================================
// Component
// ============================================================================

export function PrintModal({
  coloring,
  isOpen,
  onClose,
}: PrintModalProps) {
  const [orientation, setOrientation] =
    useState<PrintOrientation>("portrait");
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const needLazyImage = coloring.imageUrl == null && isOpen;
  const { imageUrl: lazyImageUrl } = useColoringImage(
    needLazyImage ? coloring.id : undefined,
    needLazyImage
  );
  const displayImageUrl = coloring.imageUrl ?? lazyImageUrl ?? null;
  const hasImage = displayImageUrl != null;

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setOrientation("portrait");
      setIsImageLoaded(false);
    } else {
      onClose();
    }
  };

  const previewWidth =
    orientation === "portrait"
      ? A4_WIDTH_MM * MM_TO_PX
      : A4_HEIGHT_MM * MM_TO_PX;
  const previewHeight =
    orientation === "portrait"
      ? A4_HEIGHT_MM * MM_TO_PX
      : A4_WIDTH_MM * MM_TO_PX;

  const scale = Math.min(1, MAX_PREVIEW_WIDTH / previewWidth);
  const scaledWidth = previewWidth * scale;
  const scaledHeight = previewHeight * scale;

  const handlePrint = () => {
    if (!hasImage || !displayImageUrl) return;
    const printStyles = `
      @media print {
        @page {
          size: ${orientation === "portrait" ? "A4 portrait" : "A4 landscape"};
          margin: 0;
        }
        body * {
          visibility: hidden;
        }
        .print-content, .print-content * {
          visibility: visible;
        }
        .print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: ${previewWidth}px;
          height: ${previewHeight}px;
        }
        .print-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      }
    `;

    const styleElement = document.createElement("style");
    styleElement.textContent = printStyles;
    document.head.appendChild(styleElement);

    const printContent = document.createElement("div");
    printContent.className = "print-content";
    printContent.innerHTML = `
      <img 
        src="${displayImageUrl}" 
        alt="${coloring.prompt.replace(/"/g, "&quot;")}" 
        class="print-image"
      />
    `;
    document.body.appendChild(printContent);

    // Base64/data URLs load synchronously; external URLs need time to load before print
    const printImg = printContent.querySelector("img");
    if (printImg) {
      const doPrint = () => {
        window.print();
        setTimeout(() => {
          document.head.removeChild(styleElement);
          document.body.removeChild(printContent);
        }, 100);
      };
      if (printImg.complete && printImg.naturalWidth > 0) {
        doPrint();
      } else {
        printImg.onload = doPrint;
        printImg.onerror = doPrint;
      }
    } else {
      window.print();
      setTimeout(() => {
        document.head.removeChild(styleElement);
        document.body.removeChild(printContent);
      }, 100);
    }

    setTimeout(() => onClose(), 500);
  };

  const handleOrientationToggle = () => {
    setOrientation((prev) => (prev === "portrait" ? "landscape" : "portrait"));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "max-w-lg max-h-[85vh] overflow-hidden p-0 flex flex-col"
        )}
      >
        <div className="flex h-full flex-col overflow-hidden">
          {/* Header */}
          <DialogHeader className="border-b p-4 sm:p-6 shrink-0">
            <DialogTitle className="text-left">
              Drukuj kolorowankę
            </DialogTitle>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0 flex flex-col items-center justify-center gap-6">
            {/* Preview */}
            <div
              className="relative flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-4"
              style={{
                width: `${scaledWidth}px`,
                height: `${scaledHeight}px`,
              }}
            >
              {(!hasImage || !isImageLoaded) && (
                <div className="absolute inset-0 animate-pulse bg-muted" />
              )}
              {hasImage ? (
                <img
                  src={displayImageUrl}
                  alt={coloring.prompt}
                  className={cn(
                    "max-w-full max-h-full object-contain transition-opacity duration-300",
                    isImageLoaded ? "opacity-100" : "opacity-0"
                  )}
                  onLoad={() => setIsImageLoaded(true)}
                />
              ) : (
                <span className="text-sm text-muted-foreground">
                  Ładowanie…
                </span>
              )}
            </div>

            {/* Orientation Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Orientacja:
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={handleOrientationToggle}
                className="gap-2"
              >
                <RotateCw className="size-4" />
                {orientation === "portrait" ? "Pionowa" : "Pozioma"}
              </Button>
            </div>

            {/* Info */}
            <p className="text-center text-sm text-muted-foreground">
              Format: A4 ({orientation === "portrait" ? "Pionowa" : "Pozioma"})
            </p>
          </div>

          {/* Footer */}
          <DialogFooter className="border-t p-4 sm:p-6 shrink-0">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Anuluj
              </Button>
              <Button
                type="button"
                onClick={handlePrint}
                className="gap-2"
                disabled={!hasImage || !isImageLoaded}
              >
                <Printer className="size-4" />
                Drukuj
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
