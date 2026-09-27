import type { Metadata } from "next";
import { db } from "@/lib/db";
import { halls } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { HallPageContent } from "@/components/public/hall-page";
import { getHallBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ host?: string }> }): Promise<Metadata> {
  const { host } = await searchParams;
  if (!host) return { title: "Venue" };
  const rows = await db.select({ slug: halls.slug }).from(halls).where(eq(halls.customDomain, host.toLowerCase())).limit(1);
  const slug = rows[0]?.slug;
  if (!slug) return { title: "Venue not found" };
  const data = await getHallBySlug(slug);
  return data
    ? { title: `${data.hall.name} · ${data.hall.city}`, description: data.hall.description?.slice(0, 155) }
    : { title: "Venue not found" };
}

export default async function HostPage({ searchParams }: { searchParams: Promise<{ host?: string }> }) {
  const { host } = await searchParams;
  if (!host) return <HallPageContent slug="__none__" />;
  const rows = await db.select({ slug: halls.slug }).from(halls).where(eq(halls.customDomain, host.toLowerCase())).limit(1);
  const slug = rows[0]?.slug;
  return <HallPageContent slug={slug ?? "__none__"} />;
}
