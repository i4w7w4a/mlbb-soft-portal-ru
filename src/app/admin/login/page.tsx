"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { hasSupabaseEnv, isLocalAdminDemoEnabled } from "@/lib/supabase/config";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function handleLogin() {
    if (!hasSupabaseEnv()) {
      setMessage(
        isLocalAdminDemoEnabled()
          ? "Local admin demo mode is enabled. Open /admin directly."
          : "Supabase env vars are missing.",
      );
      return;
    }

    const supabase = createSupabaseBrowser();
    if (!supabase) return;

    const { error } = await supabase.auth.signInWithOtp({ email });
    setMessage(error ? error.message : "Magic link sent.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#060914] px-4">
      <Card className="w-full max-w-xl space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Admin login</p>
          <h1 className="font-display text-4xl text-white">Access the editorial operator layer.</h1>
          <p className="text-sm leading-6 text-slate-300">
            Use Supabase Auth for sign-in. If local demo mode is enabled, the protected admin routes remain available without a session.
          </p>
        </div>
        <div className="space-y-3">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <Button onClick={() => void handleLogin()}>Send magic link</Button>
        {message ? <p className="text-sm text-cyan-100">{message}</p> : null}
      </Card>
    </div>
  );
}
