import type { Metadata } from "next";
import { getHallBySlug } from "@/lib/queries";
import { HallPageContent } from "@/components/public/hall-page";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getHallBySlug(slug);
  if (!data) return { title: "Venue not found" };
  return {
    title: `${data.hall.name} · ${data.hall.city}`,
    description: data.hall.description?.slice(0, 155),
  };
}

export default async function HallPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <HallPageContent slug={slug} />;
}
