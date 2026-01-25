"use client";

import { useState, useEffect } from "react";
import { Printer, RotateCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import type { LibraryColoringDTO, PrintOrientation } from "@/app/types";

// ============================================================================
// Types
// ============================================================================

interface PrintModalProps {
  /** Coloring data to print */
  coloring: LibraryColoringDTO;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
}

// ============================================================================
// Constants
// ============================================================================

// A4 dimensions in mm
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MM_TO_PX = 3.779527559; // 1mm = 3.779527559px at 96 DPI

// ============================================================================
// Component
// ============================================================================

/**
 * Modal for configuring and printing a coloring page.
 * Shows preview in A4 proportions with orientation toggle.
 */
export function PrintModal({
  coloring,
  isOpen,
  onClose,
}: PrintModalProps) {
  const [orientation, setOrientation] =
    useState<PrintOrientation>("portrait");
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setOrientation("portrait");
      setIsImageLoaded(false);
    }
  }, [isOpen]);

  // Calculate preview dimensions
  const previewWidth =
    orientation === "portrait"
      ? A4_WIDTH_MM * MM_TO_PX
      : A4_HEIGHT_MM * MM_TO_PX;
  const previewHeight =
    orientation === "portrait"
      ? A4_HEIGHT_MM * MM_TO_PX
      : A4_WIDTH_MM * MM_TO_PX;

  // Scale down for preview (max 400px width)
  const maxPreviewWidth = 400;
  const scale = Math.min(1, maxPreviewWidth / previewWidth);
  const scaledWidth = previewWidth * scale;
  const scaledHeight = previewHeight * scale;

  const handlePrint = () => {
    // Create print styles
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

    // Create style element
    const styleElement = document.createElement("style");
    styleElement.textContent = printStyles;
    document.head.appendChild(styleElement);

    // Create print content
    const printContent = document.createElement("div");
    printContent.className = "print-content";
    printContent.innerHTML = `
      <img 
        src="${coloring.imageUrl}" 
        alt="${coloring.prompt}" 
        class="print-image"
      />
    `;
    document.body.appendChild(printContent);

    // Print
    window.print();

    // Cleanup
    setTimeout(() => {
      document.head.removeChild(styleElement);
      document.body.removeChild(printContent);
    }, 100);

    // Close modal after print dialog closes
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const handleOrientationToggle = () => {
    setOrientation((prev) => (prev === "portrait" ? "landscape" : "portrait"));
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="bottom"
          className="h-[90vh] max-h-[90vh] overflow-y-auto p-0 sm:max-w-lg"
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <SheetHeader className="border-b p-4 sm:p-6">
              <SheetTitle>Drukuj kolorowankę</SheetTitle>
            </SheetHeader>

            {/* Content */}
            <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto p-4 sm:p-6">
              {/* Preview */}
              <div
                className="relative flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-4"
                style={{
                  width: `${scaledWidth}px`,
                  height: `${scaledHeight}px`,
                }}
              >
                {!isImageLoaded && (
                  <div className="absolute inset-0 animate-pulse bg-muted" />
                )}
                <img
                  src={coloring.imageUrl}
                  alt={coloring.prompt}
                  className={cn(
                    "max-w-full max-h-full object-contain transition-opacity duration-300",
                    isImageLoaded ? "opacity-100" : "opacity-0"
                  )}
                  onLoad={() => setIsImageLoaded(true)}
                />
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
            <SheetFooter className="border-t p-4 sm:p-6 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Anuluj
              </Button>
              <Button
                type="button"
                onClick={handlePrint}
                className="gap-2"
                disabled={!isImageLoaded}
              >
                <Printer className="size-4" />
                Drukuj
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
  );
}
