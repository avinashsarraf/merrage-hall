export type AddonSelection = {
  id: string;
  name: string;
  price: number;
  qty: number;
  unit: string;
};

export type Totals = {
  hallRent: number;
  cateringTotal: number;
  addonsTotal: number;
  discount: number;
  totalAmount: number;
};

export function computeTotals(input: {
  hallRent: number;
  guestCount: number;
  platePrice: number;
  addons: { price: number; qty: number }[];
  discount?: number;
}): Totals {
  const hallRent = Math.max(0, Math.round(input.hallRent) || 0);
  const cateringTotal = Math.max(0, Math.round(input.guestCount) || 0) * (Math.max(0, Math.round(input.platePrice)) || 0);
  const addonsTotal = input.addons.reduce((s, a) => s + Math.max(0, a.price) * Math.max(1, a.qty), 0);
  const discount = Math.max(0, Math.round(input.discount ?? 0)) || 0;
  const totalAmount = Math.max(0, hallRent + cateringTotal + addonsTotal - discount);
  return { hallRent, cateringTotal, addonsTotal, discount, totalAmount };
}

export function parseAddonSelections(v: unknown): AddonSelection[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is AddonSelection => !!x && typeof x === "object" && "id" in x && "price" in x)
    .map((x) => ({
      id: String(x.id),
      name: String(x.name ?? ""),
      price: Number(x.price ?? 0),
      qty: Number(x.qty ?? 1),
      unit: String(x.unit ?? "per event"),
    }));
}
