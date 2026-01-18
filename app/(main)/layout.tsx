import { createClient } from "@/app/db/server";
import { MainLayout } from "@/components/layout";

export default async function MainGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <MainLayout user={user}>{children}</MainLayout>;
}

