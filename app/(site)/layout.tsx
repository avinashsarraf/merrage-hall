import { getSessionUser } from "@/lib/auth";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <div className="flex min-h-screen flex-col bg-cream-50">
      <SiteHeader signedIn={!!user} isAdmin={user?.role === "SUPER_ADMIN"} />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
