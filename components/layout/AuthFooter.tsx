"use client";

export function AuthFooter() {
  return (
    <footer className="mt-8 text-center text-sm text-muted-foreground">
      <p>&copy; {new Date().getFullYear()} Malowanko. Wszystkie prawa zastrzeżone.</p>
    </footer>
  );
}
