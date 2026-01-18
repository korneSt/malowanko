import type { Metadata } from "next";
import { ImageIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Galeria - Malowanko",
  description: "Przeglądaj kolorowanki stworzone przez społeczność Malowanko",
};

export default function GaleriaPage() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-secondary/20">
        <ImageIcon className="size-8 text-secondary" />
      </div>
      <h1 className="mb-2 text-2xl font-bold">Galeria</h1>
      <p className="max-w-md text-muted-foreground">
        Tutaj wkrótce pojawią się kolorowanki stworzone przez społeczność.
        Przeglądaj, dodawaj do ulubionych i inspiruj się!
      </p>
      <div className="mt-8 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-4">
        <p className="text-sm text-muted-foreground">🚧 W budowie</p>
      </div>
    </div>
  );
}

