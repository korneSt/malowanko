import { Suspense } from "react";
import { createClient } from "@/app/db/server";
import { MainLayout } from "@/components/layout";

async function MainLayoutWithUser({
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

export default function MainGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<MainLayout user={null}>{children}</MainLayout>}>
      <MainLayoutWithUser>{children}</MainLayoutWithUser>
    </Suspense>
  );
}

