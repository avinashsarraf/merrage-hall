"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Copy, ExternalLink, Globe, Loader2, Plus, ShieldQuestion, Trash2 } from "lucide-react";
import { addCustomDomain, removeCustomDomain, verifyCustomDomain } from "@/lib/actions/hall";
import { ROOT_DOMAIN } from "@/lib/constants";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

export function DomainsPanel({
  slug,
  customDomain,
  domainVerified,
  planAllowsDomain,
  planName,
}: {
  slug: string;
  customDomain: string | null;
  domainVerified: boolean;
  planAllowsDomain: boolean;
  planName: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [domain, setDomain] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const subdomain = `${slug}.${ROOT_DOMAIN}`;

  function copy(value: string) {
    navigator.clipboard?.writeText(value).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      },
      () => toast({ title: "Copy failed — select the text manually", variant: "error" })
    );
  }

  function add() {
    const fd = new FormData();
    fd.set("domain", domain);
    startTransition(async () => {
      const res = await addCustomDomain(fd);
      if (res.ok) {
        toast({ title: "Domain added", description: res.message, variant: "success" });
        setDomain("");
        router.refresh();
      } else {
        toast({ title: "Couldn't add domain", description: res.error, variant: "error" });
      }
    });
  }

  function verify() {
    setVerifying(true);
    startTransition(async () => {
      const res = await verifyCustomDomain();
      setVerifying(false);
      if (res.ok) {
        toast({ title: "Domain verified 🎉", description: res.message, variant: "success" });
        router.refresh();
      } else {
        toast({ title: "Verification failed", description: res.error, variant: "error" });
      }
    });
  }

  function remove() {
    setConfirmRemove(false);
    startTransition(async () => {
      const res = await removeCustomDomain();
      if (res.ok) {
        toast({ title: "Domain removed", variant: "success" });
        router.refresh();
      } else {
        toast({ title: "Couldn't remove", description: res.error, variant: "error" });
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* free subdomain */}
      <Card>
        <CardHeader
          title="Your free subdomain"
          sub="Every venue gets one — live instantly"
          action={
            <Link href={`/halls/${slug}`} target="_blank" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-50">
              <ExternalLink className="h-3.5 w-3.5" /> Open
            </Link>
          }
          bordered
        />
        <CardBody>
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-brand-800 to-brand-950 p-4 text-white">
            <Globe className="h-5 w-5 shrink-0 text-gold-400" />
            <p className="min-w-0 flex-1 truncate font-mono text-sm font-semibold">{subdomain}</p>
            <button
              onClick={() => copy(subdomain)}
              className="rounded-lg bg-white/10 p-2 transition hover:bg-white/20"
              title="Copy URL"
            >
              {copied ? <BadgeCheck className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-stone-500">
            Share this link with customers, print it on visiting cards, or use it as your booking page. Requests made here land
            straight in your dashboard.
          </p>
        </CardBody>
      </Card>

      {/* custom domain */}
      <Card>
        <CardHeader
          title="Custom domain"
          sub="Brand it fully with your own URL"
          action={
            customDomain ? (
              domainVerified ? (
                <Badge className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified
                </Badge>
              ) : (
                <Badge className="bg-amber-50 text-amber-700 ring-1 ring-amber-200">Pending verification</Badge>
              )
            ) : null
          }
          bordered
        />
        <CardBody>
          {!planAllowsDomain ? (
            <div className="rounded-2xl bg-gold-50 p-5 ring-1 ring-gold-200">
              <p className="font-display text-base font-semibold text-gold-900">Available on Growth &amp; Premium</p>
              <p className="mt-1 text-xs leading-relaxed text-gold-800/80">
                Your {planName} plan doesn't include custom domains. Upgrade to connect something like
                <span className="font-mono font-semibold"> bookings.yourvenue.com</span>.
              </p>
              <Link
                href="/dashboard/subscription"
                className="mt-3 inline-flex h-9 items-center rounded-xl bg-gold-500 px-4 text-xs font-bold text-gold-950 transition hover:bg-gold-400"
              >
                View plans
              </Link>
            </div>
          ) : customDomain ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200/70">
                <Globe className="h-5 w-5 shrink-0 text-brand-600" />
                <p className="min-w-0 flex-1 truncate font-mono text-sm font-semibold text-stone-800">{customDomain}</p>
                <button onClick={() => copy(customDomain)} className="rounded-lg bg-white p-2 ring-1 ring-stone-200 transition hover:bg-stone-50" title="Copy">
                  {copied ? <BadgeCheck className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              {!domainVerified ? (
                <>
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-500">
                      <ShieldQuestion className="h-4 w-4 text-amber-500" /> DNS records to add at your registrar
                    </p>
                    <div className="overflow-hidden rounded-xl ring-1 ring-stone-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-50 text-[10px] uppercase tracking-wider text-stone-400">
                          <tr>
                            <th className="px-3 py-2">Type</th>
                            <th className="px-3 py-2">Name</th>
                            <th className="px-3 py-2">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-mono text-[11px] text-stone-600">
                          <tr>
                            <td className="px-3 py-2">CNAME</td>
                            <td className="px-3 py-2">www</td>
                            <td className="px-3 py-2">cname.{ROOT_DOMAIN}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2">A</td>
                            <td className="px-3 py-2">@</td>
                            <td className="px-3 py-2">76.76.21.21</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={verify} disabled={verifying || pending}>
                      {verifying ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Checking DNS…
                        </>
                      ) : (
                        "Verify DNS records"
                      )}
                    </Button>
                    <Button variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => setConfirmRemove(true)}>
                      <Trash2 className="h-4 w-4" /> Remove
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Your venue site is live on {customDomain}</p>
                    <p className="mt-0.5 text-xs text-emerald-700/80">Requests from this domain flow into the same dashboard.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Field label="Your domain" hint="e.g. bookings.rajwadapalace.com">
                <Input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      add();
                    }
                  }}
                  placeholder="bookings.yourvenue.com"
                />
              </Field>
              <Button onClick={add} disabled={pending || !domain}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Connect domain
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={remove}
        title="Remove custom domain?"
        message={`${customDomain} will stop pointing to your venue page. Your subdomain keeps working.`}
        confirmLabel="Remove domain"
      />
    </div>
  );
}
