import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

interface MainLayoutProps {
  children: React.ReactNode;
  user: User | null;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

const maxWidthClasses = {
  sm: "max-w-xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-7xl",
  full: "max-w-full",
};

export function MainLayout({
  children,
  user,
  maxWidth = "lg",
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Skip Link dla dostępności */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Przejdź do treści
      </a>

      <Header user={user} />

      <main
        id="main-content"
        className={cn(
          "mx-auto px-4 py-6 pb-20 md:pb-6",
          maxWidthClasses[maxWidth]
        )}
      >
        <div className="rounded-2xl bg-card p-6 shadow-sm">{children}</div>
      </main>

      {user && <BottomNav />}
    </div>
  );
}

