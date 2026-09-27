import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BedDouble,
  Building2,
  CalendarClock,
  Car,
  CheckCircle2,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  Star,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { getHallBySlug, getSimilarHalls } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";
import { formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { Gallery } from "./gallery";
import { BookingWidget } from "./booking-widget";
import { HallCard } from "./hall-card";
import { AddonCategoryIcon } from "@/components/dashboard/category-icon";
import { addonCategoryLabel, menuCategoryLabel } from "@/lib/constants";

export async function HallPageContent({ slug }: { slug: string }) {
  const data = await getHallBySlug(slug);
  if (!data) notFound();
  const { hall, addons, packages, items } = data;
  const [user, similar] = await Promise.all([getSessionUser(), getSimilarHalls(hall, 3)]);
  const nameById = new Map(items.map((i) => [i.id, i.name]));

  const facts = [
    { icon: Users, label: "Max guests", value: hall.capacity.toLocaleString("en-IN") },
    { icon: Building2, label: "Halls / lawns", value: String(hall.hallCount) },
    { icon: BedDouble, label: "Guest rooms", value: String(hall.rooms) },
    { icon: Car, label: "Parking", value: `${hall.parking} cars` },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-stone-400" aria-label="Breadcrumb">
        <Link href="/" className="transition hover:text-brand-700">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/halls" className="transition hover:text-brand-700">Venues</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-stone-600">{hall.name}</span>
      </nav>

      {/* header */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">{hall.name}</h1>
            <Badge className="bg-white text-brand-800 ring-1 ring-brand-200">
              <Star className="h-3 w-3 fill-gold-500 text-gold-500" /> 4.8
            </Badge>
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-brand-400" />
              {hall.address ? `${hall.address}, ` : ""}{hall.city}, {hall.state}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4 text-brand-400" />
              up to {hall.capacity.toLocaleString("en-IN")} guests
            </span>
          </p>
        </div>
        <div className="rounded-2xl bg-white px-5 py-3 text-right shadow-soft ring-1 ring-stone-200/80">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Starting from</p>
          <p className="font-display text-2xl font-bold text-brand-800">{formatINR(hall.baseRent)}</p>
          <p className="text-[11px] text-stone-400">rent/day · {formatINR(hall.vegPlate)}/plate veg</p>
        </div>
      </div>

      {hall.status !== "ACTIVE" ? (
        <div className="mt-5 rounded-2xl bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800 ring-1 ring-amber-200">
          {hall.status === "PENDING"
            ? "This venue is new and awaiting platform verification — booking requests may be delayed."
            : "This venue is currently not accepting online bookings."}
        </div>
      ) : null}

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-12">
          <Gallery images={hall.images} name={hall.name} />

          {/* about */}
          <section>
            <SectionTitle eyebrow="The venue" title="About this venue" />
            <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-stone-600">
              {hall.description || "A wonderful venue for weddings, receptions and every celebration in between."}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {facts.map((f) => (
                <div key={f.label} className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-stone-200/80">
                  <f.icon className="h-5 w-5 text-brand-500" />
                  <p className="mt-2.5 font-display text-lg font-bold text-stone-900">{f.value}</p>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400">{f.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-500">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-stone-200">
                <CalendarClock className="h-3.5 w-3.5 text-brand-400" /> Event window {hall.checkIn} – {hall.checkOut}
              </span>
            </div>
          </section>

          {/* amenities */}
          {hall.amenities.length ? (
            <section>
              <SectionTitle eyebrow="Comforts" title="Amenities & services" />
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {hall.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-3 text-sm text-stone-600 shadow-soft ring-1 ring-stone-200/70">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="truncate">{a}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* packages */}
          {packages.length ? (
            <section>
              <SectionTitle
                eyebrow="Catering"
                title="Menu packages"
                sub="Per-plate pricing, curated by the venue's in-house kitchen"
              />
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {packages.map((p) => (
                  <Card key={p.id} className="flex flex-col p-5 transition-shadow hover:shadow-lift">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-display text-lg font-semibold text-stone-900">{p.name}</h3>
                        <p className="mt-0.5 text-xs text-stone-500">{p.description}</p>
                      </div>
                      <Badge
                        className={
                          p.dietType === "NON_VEG"
                            ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                            : p.dietType === "VEGAN"
                              ? "bg-lime-50 text-lime-700 ring-1 ring-lime-200"
                              : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        }
                      >
                        {p.dietType.replace("_", "-")}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.items.slice(0, 7).map((id) => (
                        <span key={id} className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700">
                          {nameById.get(id) ?? "—"}
                        </span>
                      ))}
                      {p.items.length > 7 ? (
                        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-500">
                          +{p.items.length - 7} more
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-4 flex items-end justify-between border-t border-stone-100 pt-4">
                      <p className="font-display text-xl font-bold text-brand-800">
                        {formatINR(p.pricePerPlate)}
                        <span className="text-xs font-medium text-stone-400">/plate</span>
                      </p>
                      <p className="text-[11px] text-stone-400">
                        300 guests ≈ {formatINR(p.pricePerPlate * 300)}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
              {items.length ? (
                <p className="mt-3 text-xs text-stone-400">
                  <UtensilsCrossed className="mr-1 inline h-3.5 w-3.5" />
                  Full à-la-carte menu available on request — {items.length} dishes across{" "}
                  {new Set(items.map((i) => i.category)).size} courses including{" "}
                  {items.filter((i) => i.category === "STARTER").length} starters and{" "}
                  {items.filter((i) => i.category === "DESSERT").length} desserts.
                </p>
              ) : null}
            </section>
          ) : null}

          {/* addons */}
          {addons.length ? (
            <section>
              <SectionTitle eyebrow="Make it grander" title="Add-ons & extras" sub="Optional extras you can add to any booking" />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {addons.map((a) => (
                  <div key={a.id} className="flex items-start gap-4 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-stone-200/80">
                    <AddonCategoryIcon category={a.category} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate font-semibold text-stone-900">{a.name}</h3>
                        <p className="shrink-0 font-display font-bold text-brand-800">{formatINR(a.price)}</p>
                      </div>
                      <p className="mt-0.5 text-[11px] uppercase tracking-wide text-stone-400">
                        {addonCategoryLabel(a.category)} · {a.unit}
                      </p>
                      {a.description ? <p className="mt-1.5 text-xs leading-relaxed text-stone-500">{a.description}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* location */}
          <section>
            <SectionTitle eyebrow="Getting there" title="Location & contact" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Card className="p-5">
                <MapPin className="h-5 w-5 text-brand-500" />
                <p className="mt-3 text-sm font-semibold text-stone-900">{hall.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-stone-500">
                  {hall.address ? `${hall.address}, ` : ""}
                  {hall.city}, {hall.state} {hall.pincode}
                </p>
              </Card>
              <Card className="p-5">
                <Phone className="h-5 w-5 text-brand-500" />
                <p className="mt-3 text-sm font-semibold text-stone-900">Talk to the venue</p>
                <p className="mt-1 text-sm text-stone-500">{hall.contactPhone || "—"}</p>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-stone-500">
                  <Mail className="h-3.5 w-3.5" /> {hall.contactEmail || "—"}
                </p>
              </Card>
            </div>
          </section>
        </div>

        {/* booking widget */}
        <aside className="self-start lg:sticky lg:top-24">
          {hall.status === "ACTIVE" ? (
            <BookingWidget
              hall={{ id: hall.id, slug: hall.slug, name: hall.name, baseRent: hall.baseRent, capacity: hall.capacity }}
              packages={packages.map((p) => ({
                id: p.id,
                name: p.name,
                pricePerPlate: p.pricePerPlate,
                dietType: p.dietType,
                itemCount: p.items.length,
              }))}
              addons={addons.map((a) => ({
                id: a.id,
                name: a.name,
                price: a.price,
                unit: a.unit,
                category: a.category,
                description: a.description,
              }))}
              signedIn={!!user}
            />
          ) : (
            <Card className="p-6 text-center">
              <Building2 className="mx-auto h-8 w-8 text-stone-300" />
              <p className="mt-3 font-display text-lg font-semibold text-stone-900">Online booking paused</p>
              <p className="mt-1.5 text-sm text-stone-500">
                This venue isn&apos;t accepting online requests right now. Reach out directly to plan a visit.
              </p>
              <p className="mt-3 text-sm font-semibold text-brand-700">{hall.contactPhone}</p>
            </Card>
          )}
        </aside>
      </div>

      {/* similar */}
      {similar.length ? (
        <section className="mt-16">
          <div className="flex items-end justify-between gap-4">
            <SectionTitle eyebrow="Keep exploring" title="Similar venues" />
            <Link href="/halls" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
              View all
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((s) => (
              <HallCard key={s.id} hall={s} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-600">{eyebrow}</p>
      <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-stone-900">{title}</h2>
      {sub ? <p className="mt-1 text-sm text-stone-500">{sub}</p> : null}
    </div>
  );
}
