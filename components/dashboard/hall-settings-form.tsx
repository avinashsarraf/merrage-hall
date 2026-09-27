"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Save, Trash2 } from "lucide-react";
import { updateHall } from "@/lib/actions/hall";
import { AMENITIES_OPTIONS } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Photo } from "@/components/ui/photo";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export type HallSettings = {
  slug: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactPhone: string;
  contactEmail: string;
  capacity: number;
  hallCount: number;
  rooms: number;
  parking: number;
  baseRent: number;
  vegPlate: number;
  nonvegPlate: number;
  checkIn: string;
  checkOut: string;
  amenities: string[];
  images: string[];
};

export function HallSettingsForm({ hall, rootDomain }: { hall: HallSettings; rootDomain: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState(hall);
  const [newImage, setNewImage] = useState("");

  const set = <K extends keyof HallSettings>(key: K, value: HallSettings[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function toggleAmenity(a: string) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }));
  }

  function addImage() {
    const url = newImage.trim();
    if (!url) return;
    if (!/^https?:\/\/.+/.test(url)) {
      toast({ title: "Enter a full image URL (https://…)", variant: "error" });
      return;
    }
    set("images", [...form.images, url]);
    setNewImage("");
  }

  function submit() {
    const fd = new FormData();
    fd.set("name", form.name);
    fd.set("description", form.description);
    fd.set("address", form.address);
    fd.set("city", form.city);
    fd.set("state", form.state);
    fd.set("pincode", form.pincode);
    fd.set("contactPhone", form.contactPhone);
    fd.set("contactEmail", form.contactEmail);
    fd.set("capacity", String(form.capacity));
    fd.set("hallCount", String(form.hallCount));
    fd.set("rooms", String(form.rooms));
    fd.set("parking", String(form.parking));
    fd.set("baseRent", String(form.baseRent));
    fd.set("vegPlate", String(form.vegPlate));
    fd.set("nonvegPlate", String(form.nonvegPlate));
    fd.set("checkIn", form.checkIn);
    fd.set("checkOut", form.checkOut);
    for (const a of form.amenities) fd.append("amenities", a);
    for (const i of form.images) fd.append("images", i);

    startTransition(async () => {
      const res = await updateHall(fd);
      if (res.ok) {
        toast({ title: "Venue profile saved", description: "Your public page is updated.", variant: "success" });
        router.refresh();
      } else {
        toast({ title: "Couldn't save", description: res.error, variant: "error" });
      }
    });
  }

  return (
    <div className="space-y-6 pb-4">
      <Card>
        <CardHeader title="Basics" sub="Shown at the top of your venue page" bordered />
        <CardBody className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Venue name *">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Public URL" hint={`${form.slug}.${rootDomain} (managed in Domains)`}>
              <Input value={`/halls/${form.slug}`} disabled />
            </Field>
          </div>
          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Tell couples what makes your venue special…"
              className="min-h-[100px]"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Contact phone">
              <Input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
            </Field>
            <Field label="Contact email" className="sm:col-span-2">
              <Input type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Location" bordered />
        <CardBody className="space-y-4">
          <Field label="Street address">
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="12, Jai Singh Highway, Bani Park" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="City *">
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="State">
              <Input value={form.state} onChange={(e) => set("state", e.target.value)} />
            </Field>
            <Field label="PIN code">
              <Input value={form.pincode} onChange={(e) => set("pincode", e.target.value)} />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Capacity & facilities" bordered />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Max guests">
              <Input type="number" min={1} value={form.capacity} onChange={(e) => set("capacity", Math.max(1, Number(e.target.value) || 0))} />
            </Field>
            <Field label="Halls / lawns">
              <Input type="number" min={1} value={form.hallCount} onChange={(e) => set("hallCount", Math.max(1, Number(e.target.value) || 0))} />
            </Field>
            <Field label="Guest rooms">
              <Input type="number" min={0} value={form.rooms} onChange={(e) => set("rooms", Math.max(0, Number(e.target.value) || 0))} />
            </Field>
            <Field label="Parking (cars)">
              <Input type="number" min={0} value={form.parking} onChange={(e) => set("parking", Math.max(0, Number(e.target.value) || 0))} />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Pricing & timing" sub="Your daily rent and starting per-plate rates" bordered />
        <CardBody className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Venue rent / day (₹)">
              <Input type="number" min={0} value={form.baseRent} onChange={(e) => set("baseRent", Math.max(0, Number(e.target.value) || 0))} />
            </Field>
            <Field label="Veg plate from (₹)">
              <Input type="number" min={0} value={form.vegPlate} onChange={(e) => set("vegPlate", Math.max(0, Number(e.target.value) || 0))} />
            </Field>
            <Field label="Non-veg plate from (₹)">
              <Input type="number" min={0} value={form.nonvegPlate} onChange={(e) => set("nonvegPlate", Math.max(0, Number(e.target.value) || 0))} />
            </Field>
          </div>
          <p className="rounded-xl bg-brand-50/70 px-3.5 py-2.5 text-xs text-brand-800 ring-1 ring-brand-100">
            A 300-guest wedding with veg catering starts around{" "}
            <span className="font-bold">{formatINR(form.baseRent + form.vegPlate * 300)}</span> at these rates.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Check-in time">
              <Input type="time" value={form.checkIn} onChange={(e) => set("checkIn", e.target.value)} />
            </Field>
            <Field label="Check-out time">
              <Input type="time" value={form.checkOut} onChange={(e) => set("checkOut", e.target.value)} />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Amenities" sub={`${form.amenities.length} selected — shown as badges on your page`} bordered />
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {AMENITIES_OPTIONS.map((a) => {
              const on = form.amenities.includes(a);
              return (
                <button
                  type="button"
                  key={a}
                  onClick={() => toggleAmenity(a)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                    on ? "bg-brand-800 text-white shadow-sm" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:ring-brand-300"
                  )}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Photo gallery" sub="First photo becomes your cover — paste image URLs" bordered />
        <CardBody className="space-y-4">
          {form.images.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {form.images.map((src, i) => (
                <div key={`${src}-${i}`} className="group relative overflow-hidden rounded-xl ring-1 ring-stone-200">
                  <Photo src={src} alt={`Photo ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
                  {i === 0 ? (
                    <span className="absolute left-2 top-2 rounded-full bg-brand-800/90 px-2 py-0.5 text-[10px] font-bold text-white">Cover</span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => set("images", form.images.filter((x) => x !== src))}
                    className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-rose-600 opacity-0 transition group-hover:opacity-100"
                    title="Remove photo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-400">No photos yet — add your first image URL below.</p>
          )}
          <div className="flex gap-2">
            <Input
              value={newImage}
              onChange={(e) => setNewImage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addImage();
                }
              }}
              placeholder="https://images.unsplash.com/photo-…"
            />
            <Button variant="secondary" onClick={addImage}>
              <ImagePlus className="h-4 w-4" /> Add
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <div className="rounded-2xl bg-white/90 p-3 shadow-lift ring-1 ring-stone-200 backdrop-blur">
          <Button onClick={submit} disabled={pending} size="lg">
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save venue profile
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
