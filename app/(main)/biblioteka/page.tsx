import type { Metadata } from "next";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Moja biblioteka - Malowanko",
  description: "Twoja kolekcja kolorowanek - wygenerowane i ulubione",
};

export default function BibliotekaPage() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-accent/40">
        <BookOpen className="size-8 text-accent-foreground" />
      </div>
      <h1 className="mb-2 text-2xl font-bold">Moja biblioteka</h1>
      <p className="max-w-md text-muted-foreground">
        Tutaj znajdziesz wszystkie swoje kolorowanki - zarówno te wygenerowane,
        jak i dodane do ulubionych z galerii.
      </p>
      <div className="mt-8 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-4">
        <p className="text-sm text-muted-foreground">🚧 W budowie</p>
      </div>
    </div>
  );
}

