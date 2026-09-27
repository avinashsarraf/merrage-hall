import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUser, dashboardHomeFor } from "@/lib/auth";
import { Logo } from "@/components/ui/logo";
import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Log in" };

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect(dashboardHomeFor(user.role));

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-100 px-4 py-10">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-lift ring-1 ring-stone-200/80 lg:grid lg:grid-cols-[1fr_1.1fr]">
        {/* brand panel */}
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-900 to-brand-950 p-10 text-white lg:flex">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold-500/15 blur-3xl" />
          <Logo dark />
          <div>
            <p className="font-display text-3xl font-bold leading-snug">
              &ldquo;Every celebration deserves a perfect stage.&rdquo;
            </p>
            <p className="mt-4 text-sm leading-relaxed text-brand-100/75">
              Manage bookings, menus, add-ons and payments — or find the venue of your dreams. One login for
              everyone on MerrageHall.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-brand-100/60">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
            Secured with encrypted sessions
          </div>
        </div>

        {/* form */}
        <div className="p-8 sm:p-10">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-6 font-display text-2xl font-bold text-stone-900 lg:mt-0">Welcome back</h1>
          <p className="mt-1 text-sm text-stone-500">Log in to your MerrageHall account</p>
          <Suspense>
            <LoginForm />
          </Suspense>
          <p className="mt-6 text-center text-sm text-stone-500">
            New here?{" "}
            <Link href="/register" className="font-semibold text-brand-700 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
          </div>
    </main>
  );
}
