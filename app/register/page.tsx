import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUser, dashboardHomeFor } from "@/lib/auth";
import { Logo } from "@/components/ui/logo";
import { RegisterForm } from "@/components/auth/register-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create your account" };

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect(dashboardHomeFor(user.role));

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-100 px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="overflow-hidden rounded-3xl bg-white shadow-lift ring-1 ring-stone-200/80">
          <div className="border-b border-stone-100 px-8 pt-8 sm:px-10">
            <h1 className="font-display text-2xl font-bold text-stone-900">Join MerrageHall</h1>
            <p className="mt-1 text-sm text-stone-500">Two minutes to set up — welcome aboard!</p>
          </div>
          <div className="px-8 py-8 sm:px-10">
            <Suspense>
              <RegisterForm />
            </Suspense>
            <p className="mt-6 text-center text-sm text-stone-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-brand-700 hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
