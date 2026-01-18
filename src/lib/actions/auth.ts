"use server";

import { createClient } from "@/app/db/server";
import { redirect } from "next/navigation";

/**
 * Wylogowuje użytkownika i przekierowuje na stronę główną.
 */
export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Sign out error:", error);
  }

  redirect("/");
}

