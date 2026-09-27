"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Heart, Loader2 } from "lucide-react";
import { registerClient, registerOwner } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [mode, setMode] = useState<"client" | "owner">(searchParams.get("mode") === "owner" ? "owner" : "client");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [venueName, setVenueName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [capacity, setCapacity] = useState(500);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const fd = new FormData();
    fd.set("name", name);
    fd.set("email", email);
    fd.set("phone", phone);
    fd.set("password", password);
    if (mode === "owner") {
      fd.set("venueName", venueName);
      fd.set("city", city);
      fd.set("state", state);
      fd.set("capacity", String(capacity));
    }
    startTransition(async () => {
      const res = mode === "owner" ? await registerOwner(fd) : await registerClient(fd);
      if (res.ok) {
        toast({ title: res.message ?? "Account created!", variant: "success" });
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(res.error);
        toast({ title: "Couldn't create account", description: res.error, variant: "error" });
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* mode switch */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-stone-100/80 p-1.5">
        {(
          [
            { id: "client", label: "For couples & clients", icon: Heart },
            { id: "owner", label: "For venue owners", icon: Building2 },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setMode(t.id)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
              mode === t.id ? "bg-white text-brand-800 shadow-sm ring-1 ring-stone-200/70" : "text-stone-500 hover:text-stone-800"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {mode === "owner" ? (
        <div className="rounded-2xl bg-gold-50 px-4 py-3 text-xs leading-relaxed text-gold-900 ring-1 ring-gold-200">
          Your venue page goes live after a quick review (usually &lt; 24h). You&apos;ll start on a{" "}
          <span className="font-bold">free 14-day Starter trial</span> — no card needed.
        </div>
      ) : null}

      {mode === "owner" ? (
        <>
          <Field label="Venue / marriage hall name *">
            <Input required value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="e.g. Rajwada Grand Palace" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="City *">
              <Input required value={city} onChange={(e) => setCity(e.target.value)} placeholder="Jaipur" />
            </Field>
            <Field label="State">
              <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="Rajasthan" />
            </Field>
            <Field label="Max guests">
              <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Math.max(1, Number(e.target.value) || 0))} />
            </Field>
          </div>
        </>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Your full name *">
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Kapoor" />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" />
        </Field>
      </div>
      <Field label="Email *">
        <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </Field>
      <Field label="Password *" hint="At least 8 characters" error={error || undefined}>
        <Input
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Creating your account…
          </>
        ) : mode === "owner" ? (
          "Create venue account"
        ) : (
          "Create my account"
        )}
      </Button>
    </form>
  );
}
