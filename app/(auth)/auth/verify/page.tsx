import { redirect } from "next/navigation";

import { verifyMagicLink } from "@/src/lib/actions/auth";

interface VerifyPageProps {
  searchParams: Promise<{
    token_hash?: string;
    type?: string;
    redirect?: string;
  }>;
}

/**
 * Maps internal error codes to query param error codes.
 * This ensures consistency with the AuthForm error handling.
 */
function mapErrorCodeToQueryParam(
  errorCode: "expired" | "invalid" | "used" | undefined
): "expired" | "invalid_token" | "verification_failed" {
  switch (errorCode) {
    case "expired":
      return "expired";
    case "invalid":
    case "used":
      return "invalid_token";
    default:
      return "verification_failed";
  }
}

/**
 * Strona weryfikacji magic linka.
 * 
 * Spełnia wymagania US-001, US-002, US-004:
 * - Weryfikuje token magic linka
 * - Przekierowuje na docelową stronę po udanej weryfikacji
 * - Obsługuje wygasłe linki (US-004) z odpowiednim komunikatem
 * - Obsługuje nieprawidłowe tokeny
 */
export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  const { token_hash, type, redirect: redirectTo } = params;

  // Helper function to build error redirect URL
  const buildErrorUrl = (error: string) => {
    const errorUrl = new URL("/auth", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
    errorUrl.searchParams.set("error", error);
    if (redirectTo) {
      errorUrl.searchParams.set("redirect", redirectTo);
    }
    return errorUrl.pathname + errorUrl.search;
  };

  // Missing required parameters - redirect to /auth with error
  if (!token_hash || !type) {
    redirect(buildErrorUrl("invalid_token"));
  }

  // Verify the magic link using the Server Action
  const result = await verifyMagicLink(token_hash, type);

  if (!result.success) {
    // Map the error code and redirect to auth page with error
    const queryError = mapErrorCodeToQueryParam(result.errorCode);
    redirect(buildErrorUrl(queryError));
  }

  // Successful verification - redirect to target page
  // Priority: result.redirectTo > redirectTo from query > default "/galeria"
  redirect(result.redirectTo || redirectTo || "/galeria");
}
