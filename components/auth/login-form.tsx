"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { login } from "@/lib/actions/auth";
import { DEMO_ACCOUNTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const fd = new FormData();
    fd.set("email", email);
    fd.set("password", password);
    startTransition(async () => {
      const res = await login(fd);
      if (res.ok) {
        toast({ title: "Welcome back!", variant: "success" });
        const next = searchParams.get("next");
        router.push(next && next.startsWith("/") ? next : res.role === "SUPER_ADMIN" ? "/dashboard/admin" : "/dashboard");
        router.refresh();
      } else {
        setError(res.error);
        toast({ title: "Login failed", description: res.error, variant: "error" });
      }
    });
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <Field label="Email" error={error || undefined}>
        <Input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </Field>
      <Field label="Password">
        <div className="relative">
          <Input
            type={show ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 transition hover:text-stone-600"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Signing you in…
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" /> Log in
          </>
        )}
      </Button>

      <div className="rounded-2xl bg-cream-50 p-4 ring-1 ring-stone-200/70">
        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Demo accounts — one click to fill</p>
        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              disabled={pending}
              onClick={() => {
                setEmail(a.email);
                setPassword(a.password);
                setError("");
              }}
              className={cn(
                "rounded-xl bg-white px-3 py-2.5 text-left ring-1 ring-stone-200 transition hover:ring-brand-300 hover:bg-brand-50/40 disabled:opacity-50"
              )}
            >
              <span className="block text-xs font-bold text-brand-800">{a.role}</span>
              <span className="mt-0.5 block truncate text-[10px] text-stone-400">{a.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
