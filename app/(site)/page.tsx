import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  ChevronRight,
  CreditCard,
  Globe,
  LayoutDashboard,
  MapPin,
  Quote,
  Search,
  Sparkles,
  Star,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { getFeaturedHalls, getPlans } from "@/lib/queries";
import { formatINR } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button";
import { Photo } from "@/components/ui/photo";
import { HallCard } from "@/components/public/hall-card";

export const dynamic = "force-dynamic";

const HERO_A = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1400&auto=format&fit=crop";
const HERO_B = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop";
const HERO_C = "https://images.unsplash.com/photo-1544124499-58912cbddaad?q=80&w=800&auto=format&fit=crop";

const FEATURES = [
  {
    icon: Globe,
    title: "Venue website + subdomain",
    text: "Every venue gets a beautiful page and a free subdomain — connect your own custom domain on Growth & Premium.",
  },
  {
    icon: CalendarCheck,
    title: "Booking & calendar",
    text: "Slot-wise availability, advance payments, status tracking and a shared calendar your whole staff can use.",
  },
  {
    icon: UtensilsCrossed,
    title: "Menu & per-plate packages",
    text: "Publish dishes, bundle them into veg / non-veg packages, and let couples see live per-plate catering costs.",
  },
  {
    icon: Sparkles,
    title: "Add-on marketplace",
    text: "Décor, DJs, sparklers, vintage car entries — upsell extras with quantities on every booking.",
  },
  {
    icon: LayoutDashboard,
    title: "Owner & staff dashboards",
    text: "Role-based access for owners, managers and coordinators — everyone sees exactly what they need.",
  },
  {
    icon: Wallet,
    title: "Payments & invoices",
    text: "Record advances and settlements, track paid vs balance, and generate printable invoices instantly.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "We went from a phone diary and Excel sheets to a proper booking system. The subdomain page alone brings 10–12 enquiries a month.",
    name: "Vikram Singh Rathore",
    role: "Rajwada Grand Palace, Jaipur",
  },
  {
    quote:
      "Comparing venues with real per-plate prices and add-on costs made budgeting our wedding so much saner. Booked in two visits.",
    name: "Ananya Iyer",
    role: "Booked at The Emerald Lawns",
  },
  {
    quote:
      "My coordinators live on the calendar view. Advance payments, balance tracking, invoices — it's all just… there.",
    name: "Meera Reddy",
    role: "The Emerald Lawns, Hyderabad",
  },
];

export default async function LandingPage() {
  const [halls, plans] = await Promise.all([getFeaturedHalls(3), getPlans()]);

  return (
    <main>
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-brand-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 top-64 h-80 w-80 rounded-full bg-gold-100/80 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:pb-24 lg:pt-20 lg:px-8">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-800 ring-1 ring-brand-200 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-gold-500" />
              India&apos;s marriage-hall booking platform
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.12] tracking-tight text-stone-900 sm:text-5xl lg:text-[3.4rem]">
              Where every celebration finds its{" "}
              <span className="relative whitespace-nowrap text-brand-700">
                perfect venue
                <svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 200 9" fill="none" preserveAspectRatio="none">
                  <path d="M2 7C50 2 150 2 198 6" stroke="#dfc25c" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-stone-600 sm:text-lg">
              MerrageHall gives marriage halls a complete booking website — menus, per-plate packages, add-ons,
              payments and calendars — while couples discover and book venues with transparent pricing.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/halls" className={buttonClasses("primary", "lg")}>
                <Search className="h-4 w-4" />
                Explore venues
              </Link>
              <Link href="/register?mode=owner" className={buttonClasses("secondary", "lg")}>
                List your venue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[
                { k: "Venues onboard", v: "120+" },
                { k: "Events booked", v: "3,400+" },
                { k: "Cities covered", v: "18" },
              ].map((s) => (
                <div key={s.k} className="rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-stone-200/70 backdrop-blur">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{s.k}</dt>
                  <dd className="mt-0.5 font-display text-2xl font-bold text-brand-800">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative animate-fade-up [animation-delay:120ms]">
            <div className="grid grid-cols-12 grid-rows-6 gap-3 sm:gap-4">
              <Photo src={HERO_A} alt="Grand wedding reception hall" className="col-span-8 row-span-6 h-full w-full rounded-3xl object-cover shadow-lift ring-1 ring-white/60" />
              <Photo src={HERO_B} alt="Sparkler celebration" className="col-span-4 row-span-3 h-full w-full rounded-3xl object-cover shadow-soft ring-1 ring-white/60" />
              <Photo src={HERO_C} alt="Stage décor" className="col-span-4 row-span-3 h-full w-full rounded-3xl object-cover shadow-soft ring-1 ring-white/60" />
            </div>
            <div className="absolute -bottom-5 -left-3 flex items-center gap-3 rounded-2xl bg-white p-3.5 pr-5 shadow-lift ring-1 ring-stone-200/80 sm:-left-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <BadgeCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-stone-900">Booking confirmed</p>
                <p className="text-xs text-stone-500">Rajwada Grand Palace · 650 guests</p>
              </div>
            </div>
          </div>
        </div>

        {/* city strip */}
        <div className="border-y border-stone-200/70 bg-white/60">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-4 sm:px-6 lg:px-8">
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Trusted in</span>
            {["Jaipur", "Hyderabad", "Lucknow", "Chennai", "Bengaluru", "Pune", "Delhi NCR", "Indore"].map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600">
                <MapPin className="h-3.5 w-3.5 text-brand-300" />
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ featured */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600">Featured venues</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-stone-900">
              Magnificent halls, verified &amp; bookable
            </h2>
          </div>
          <Link href="/halls" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
            View all venues
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {halls.map((hall) => (
            <HallCard key={hall.id} hall={hall} />
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- how it works */}
      <section id="how-it-works" className="border-y border-stone-200/70 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600">How it works</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-stone-900">
              Built for both sides of the shaadi
            </h2>
          </div>
          <div className="mt-12 grid gap-10 lg:grid-cols-2">
            <div className="rounded-3xl bg-cream-50 p-8 ring-1 ring-stone-200/70">
              <h3 className="font-display text-xl font-bold text-brand-800">For couples &amp; families</h3>
              <ol className="mt-6 space-y-5">
                {[
                  ["Discover", "Filter venues by city, capacity and budget — real photos, real per-plate prices, no cold calls."],
                  ["Estimate live", "Pick a date, menu package and add-ons; the price calculator shows your total before you talk to anyone."],
                  ["Book & track", "Request the venue, pay the advance, and follow your booking to the big day from your dashboard."],
                ].map(([t, d], i) => (
                  <li key={t} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-800 font-display text-sm font-bold text-gold-300">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-stone-900">{t}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-stone-500">{d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link href="/halls" className={`mt-8 ${buttonClasses("primary", "md")}`}>
                Start browsing
              </Link>
            </div>
            <div className="rounded-3xl bg-brand-950 p-8 text-white ring-1 ring-brand-900">
              <h3 className="font-display text-xl font-bold text-gold-300">For venue owners</h3>
              <ol className="mt-6 space-y-5">
                {[
                  ["List in minutes", "Register your venue, add photos, menus and add-ons. Your page and subdomain go live after a quick review."],
                  ["Manage everything", "Bookings, slot calendar, staff accounts, advances and invoices — one polished dashboard."],
                  ["Grow revenue", "Per-plate packages and add-ons lift every event's value; analytics show your busiest months."],
                ].map(([t, d], i) => (
                  <li key={t} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 font-display text-sm font-bold text-gold-300">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-semibold">{t}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-brand-100/75">{d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link href="/register?mode=owner" className={`mt-8 ${buttonClasses("gold", "md")}`}>
                List your venue
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600">Platform</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-stone-900">
            Everything a marriage hall needs, in one place
          </h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="group rounded-3xl bg-white p-6 shadow-soft ring-1 ring-stone-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-800 group-hover:text-gold-300">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-stone-900">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-500">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------- pricing */}
      <section className="border-y border-stone-200/70 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600">Simple pricing</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-stone-900">
              Plans that grow with your venue
            </h2>
            <p className="mt-3 text-sm text-stone-500">Start with a free 14-day trial. No setup fees, cancel anytime.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {plans.map((p, idx) => (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-3xl p-7 ${
                  idx === 1
                    ? "bg-brand-950 text-white shadow-lift ring-1 ring-brand-800"
                    : "bg-cream-50 text-stone-900 ring-1 ring-stone-200/80"
                }`}
              >
                {idx === 1 ? (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gold-500 px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-gold-950">
                    Most popular
                  </span>
                ) : null}
                <h3 className={`font-display text-xl font-bold ${idx === 1 ? "text-gold-300" : "text-stone-900"}`}>{p.name}</h3>
                <p className={`mt-1 text-xs ${idx === 1 ? "text-brand-100/70" : "text-stone-500"}`}>{p.tagline}</p>
                <p className="mt-5">
                  <span className={`font-display text-4xl font-bold ${idx === 1 ? "text-white" : "text-brand-800"}`}>
                    {formatINR(p.priceMonthly)}
                  </span>
                  <span className={`text-sm ${idx === 1 ? "text-brand-100/60" : "text-stone-400"}`}>/month</span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {p.features.slice(0, 6).map((f) => (
                    <li key={f} className={`flex items-start gap-2.5 text-sm ${idx === 1 ? "text-brand-50/90" : "text-stone-600"}`}>
                      <BadgeCheck className={`mt-0.5 h-4 w-4 shrink-0 ${idx === 1 ? "text-gold-400" : "text-brand-500"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register?mode=owner"
                  className={`mt-7 ${buttonClasses(idx === 1 ? "gold" : "secondary", "md", "w-full")}`}
                >
                  Start free trial
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-stone-400">
            Full plan comparison on the <Link href="/pricing" className="font-semibold text-brand-700 hover:underline">pricing page</Link> · manage plans from your dashboard
          </p>
        </div>
      </section>

      {/* --------------------------------------------------------- testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600">Love notes</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-stone-900">What our venues &amp; couples say</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="flex flex-col rounded-3xl bg-white p-7 shadow-soft ring-1 ring-stone-200/80">
              <Quote className="h-6 w-6 text-gold-400" />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-stone-600">{t.quote}</blockquote>
              <figcaption className="mt-5 border-t border-stone-100 pt-4">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-gold-400 text-gold-400" />
                  ))}
                </div>
                <p className="mt-1.5 text-sm font-semibold text-stone-900">{t.name}</p>
                <p className="text-xs text-stone-400">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ cta */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 px-8 py-14 text-center shadow-lift sm:px-14">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gold-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl" />
          <h2 className="relative font-display text-3xl font-bold text-white sm:text-4xl">
            Your venue deserves a bigger stage
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-sm leading-relaxed text-brand-100/80 sm:text-base">
            Join 120+ marriage halls using MerrageHall to fill their calendars. Setup takes less than a day.
          </p>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register?mode=owner" className={buttonClasses("gold", "lg")}>
              <CreditCard className="h-4 w-4" />
              List your venue free
            </Link>
            <Link href="/halls" className={buttonClasses("secondary", "lg", "bg-white/10 text-white ring-white/20 hover:bg-white/20")}>
              I&apos;m looking for a venue
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
