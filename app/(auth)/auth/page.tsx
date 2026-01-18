import { redirect } from "next/navigation";
import { createClient } from "@/app/db/server";
import { AuthForm } from "@/components/auth";

interface AuthPageProps {
  searchParams: Promise<{
    redirect?: string;
    mode?: "signin" | "signup";
    error?: "expired" | "invalid_token" | "verification_failed";
    email?: string;
  }>;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;

  // Przekieruj zalogowanych użytkowników
  if (user) {
    const redirectTo = params.redirect || "/galeria";
    redirect(redirectTo);
  }

  return (
    <AuthForm
      initialMode={params.mode || "signup"}
      redirectTo={params.redirect}
      error={params.error}
      initialEmail={params.email}
    />
  );
}
