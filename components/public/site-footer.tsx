import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-brand-900/10 bg-brand-950 text-brand-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <Logo dark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-200/80">
            The all-in-one booking &amp; management platform for marriage halls — venues get a website,
            calendar and payments; couples get transparent choices.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gold-400">Explore</p>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/halls" className="text-brand-200/80 transition hover:text-white">Browse venues</Link></li>
            <li><Link href="/halls?city=Jaipur" className="text-brand-200/80 transition hover:text-white">Venues in Jaipur</Link></li>
            <li><Link href="/halls?city=Hyderabad" className="text-brand-200/80 transition hover:text-white">Venues in Hyderabad</Link></li>
            <li><Link href="/register" className="text-brand-200/80 transition hover:text-white">Create account</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gold-400">For venues</p>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/pricing" className="text-brand-200/80 transition hover:text-white">Plans &amp; pricing</Link></li>
            <li><Link href="/register?mode=owner" className="text-brand-200/80 transition hover:text-white">List your venue</Link></li>
            <li><Link href="/login" className="text-brand-200/80 transition hover:text-white">Venue login</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gold-400">Platform</p>
          <ul className="space-y-2.5 text-sm text-brand-200/80">
            <li>support@merragehall.com</li>
            <li>+91 98765 43210</li>
            <li>Mon–Sat · 10 AM – 7 PM IST</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-brand-200/60 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} MerrageHall. Made with ❤ for big fat Indian weddings.</p>
          <p>Next.js · Drizzle ORM · PostgreSQL (Supabase)</p>
        </div>
      </div>
    </footer>
  );
}
