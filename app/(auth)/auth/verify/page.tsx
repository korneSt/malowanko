import { redirect } from "next/navigation";
import { LoadingSpinner } from "@/components/shared";

interface VerifyPageProps {
  searchParams: Promise<{
    token_hash?: string;
    type?: string;
    redirect?: string;
  }>;
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  const { token_hash, type, redirect: redirectTo } = params;

  // Brak wymaganych parametrów - przekieruj do /auth z błędem
  if (!token_hash || !type) {
    const errorUrl = new URL("/auth", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
    errorUrl.searchParams.set("error", "invalid_token");
    if (redirectTo) {
      errorUrl.searchParams.set("redirect", redirectTo);
    }
    redirect(errorUrl.pathname + errorUrl.search);
  }

  // TODO: Implementacja weryfikacji magic linka przez Server Action
  // const result = await verifyMagicLink(token_hash, type);
  //
  // if (!result.success) {
  //   const errorUrl = new URL("/auth", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  //   errorUrl.searchParams.set("error", result.errorCode || "verification_failed");
  //   if (redirectTo) {
  //     errorUrl.searchParams.set("redirect", redirectTo);
  //   }
  //   redirect(errorUrl.pathname + errorUrl.search);
  // }
  //
  // redirect(result.redirectTo || redirectTo || "/galeria");

  // Tymczasowy UI podczas ładowania (do czasu implementacji backendu)
  return (
    <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl bg-card p-8 text-center shadow-sm">
      <LoadingSpinner size="lg" />
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Weryfikowanie linku...</h1>
        <p className="text-sm text-muted-foreground">
          Proszę czekać, trwa weryfikacja Twojego linku logowania.
        </p>
      </div>
    </div>
  );
}
