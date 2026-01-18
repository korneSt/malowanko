import { Logo } from "@/components/layout/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Skip Link dla dostępności */}
      <a
        href="#auth-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Przejdź do treści
      </a>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-12">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        {/* Content */}
        <main id="auth-content" className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Malowanko. Wszystkie prawa zastrzeżone.</p>
        </footer>
      </div>
    </div>
  );
}
