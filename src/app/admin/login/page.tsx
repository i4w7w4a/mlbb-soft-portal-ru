"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import {
  getPublicSiteUrl,
  hasSupabaseEnv,
  isLocalAdminDemoEnabled,
} from "@/lib/supabase/config";

function getCallbackMessage(errorCode: string | null) {
  switch (errorCode) {
    case "missing_code":
      return "The magic link returned without an auth code.";
    case "missing_env":
      return "Supabase env vars are missing on the server.";
    case "exchange_failed":
      return "The magic link could not be exchanged for a session.";
    default:
      return null;
  }
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [callbackMessage] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : getCallbackMessage(new URLSearchParams(window.location.search).get("error")),
  );

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

    const redirectUrl = new URL(
      "/api/auth/callback",
      typeof window !== "undefined" ? window.location.origin : getPublicSiteUrl(),
    );
    redirectUrl.searchParams.set("next", "/admin");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl.toString(),
        shouldCreateUser: false,
      },
    });

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
        {!message && callbackMessage ? (
          <p className="text-sm text-rose-200">{callbackMessage}</p>
        ) : null}
      </Card>
    </div>
  );
}
