import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { hasSupabaseEnv, isLocalAdminDemoEnabled } from "@/lib/supabase/config";
import { getAdminSession } from "@/lib/supabase/server";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  const demoMode = isLocalAdminDemoEnabled() || !hasSupabaseEnv();

  if (!demoMode && !session) {
    redirect("/admin/login");
  }

  return <AdminShell demoMode={demoMode}>{children}</AdminShell>;
}
