export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "merragehall.app";

export const APP_NAME = "MerrageHall";

export const EVENT_TYPES = [
  "Wedding",
  "Reception",
  "Engagement",
  "Sangeet",
  "Haldi / Mehndi",
  "Anniversary",
  "Birthday",
  "Baby Shower",
  "Corporate Event",
  "Other",
] as const;

export const SLOTS = [
  { value: "LUNCH", label: "Lunch", time: "11:00 AM – 4:00 PM" },
  { value: "DINNER", label: "Dinner", time: "6:00 PM – 11:30 PM" },
  { value: "FULL_DAY", label: "Full Day", time: "10:00 AM – 11:30 PM" },
] as const;

export const slotMeta = (v: string) => SLOTS.find((s) => s.value === v) ?? SLOTS[1];

export const MENU_CATEGORIES = [
  { value: "STARTER", label: "Starters" },
  { value: "SOUP", label: "Soups" },
  { value: "SALAD", label: "Salads" },
  { value: "MAIN_COURSE", label: "Main Course" },
  { value: "BREAD", label: "Breads" },
  { value: "RICE", label: "Rice & Biryani" },
  { value: "DESSERT", label: "Desserts" },
  { value: "DRINKS", label: "Beverages" },
  { value: "LIVE_COUNTER", label: "Live Counters" },
] as const;

export const menuCategoryLabel = (v: string) =>
  MENU_CATEGORIES.find((c) => c.value === v)?.label ?? v;

export const DIET_TYPES = [
  { value: "VEG", label: "Veg" },
  { value: "NON_VEG", label: "Non-Veg" },
  { value: "VEGAN", label: "Vegan" },
  { value: "JAIN", label: "Jain" },
] as const;

export const ADDON_CATEGORIES = [
  { value: "DECOR", label: "Décor" },
  { value: "LIGHTING", label: "Lighting" },
  { value: "SOUND", label: "Sound & Music" },
  { value: "STAGE", label: "Stage & Mandap" },
  { value: "FURNITURE", label: "Furniture" },
  { value: "PHOTOGRAPHY", label: "Photography" },
  { value: "VEHICLE", label: "Vehicle" },
  { value: "ENTERTAINMENT", label: "Entertainment" },
  { value: "OTHER", label: "Other" },
] as const;

export const addonCategoryLabel = (v: string) =>
  ADDON_CATEGORIES.find((c) => c.value === v)?.label ?? v;

export const PAYMENT_METHODS = [
  { value: "UPI", label: "UPI" },
  { value: "CASH", label: "Cash" },
  { value: "BANK", label: "Bank Transfer" },
  { value: "CARD", label: "Card" },
] as const;

export const AMENITIES_OPTIONS = [
  "Central AC",
  "Bridal Suite",
  "Groom Room",
  "Power Backup",
  "Valet Parking",
  "In-house Catering",
  "Outside Catering Allowed",
  "Mandap Décor",
  "DJ & Sound Allowed",
  "Alcohol Permitted",
  "Lawn + Banquet Hall",
  "Rooftop Terrace",
  "Guest Rooms",
  "Elevator Access",
  "Wheelchair Friendly",
  "Haldi & Mehndi Lawn",
  "Kitchen & Cold Storage",
  "Security Staff",
  "Bridal Entry Porch",
  "Kids Play Corner",
];

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "SaaS Owner",
  HALL_OWNER: "Venue Owner",
  HALL_STAFF: "Venue Staff",
  CUSTOMER: "Booking Client",
};

export const BOOKING_STATUS_META: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  PENDING: {
    label: "Pending",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    dot: "bg-amber-500",
  },
  CONFIRMED: {
    label: "Confirmed",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  COMPLETED: {
    label: "Completed",
    badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    dot: "bg-sky-500",
  },
  CANCELLED: {
    label: "Cancelled",
    badge: "bg-stone-100 text-stone-500 ring-1 ring-stone-200",
    dot: "bg-stone-400",
  },
};

export const HALL_STATUS_META: Record<string, { label: string; badge: string; dot: string }> = {
  PENDING: {
    label: "Pending review",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    dot: "bg-amber-500",
  },
  ACTIVE: {
    label: "Active",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  SUSPENDED: {
    label: "Suspended",
    badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    dot: "bg-rose-500",
  },
};

export const SUB_STATUS_META: Record<string, { label: string; badge: string }> = {
  TRIALING: { label: "Trialing", badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-200" },
  ACTIVE: { label: "Active", badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  PAST_DUE: { label: "Past due", badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" },
  CANCELLED: { label: "Cancelled", badge: "bg-stone-100 text-stone-500 ring-1 ring-stone-200" },
};

export const PAYMENT_TYPE_META: Record<string, { label: string; badge: string }> = {
  BOOKING: { label: "Booking payment", badge: "bg-brand-50 text-brand-700 ring-1 ring-brand-200" },
  SUBSCRIPTION: { label: "Subscription", badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-200" },
  COMMISSION: { label: "Commission", badge: "bg-gold-50 text-gold-800 ring-1 ring-gold-300" },
};

export const DEMO_ACCOUNTS = [
  { role: "SaaS Owner", email: "admin@merragehall.com", password: "Admin@123", hint: "Platform control tower" },
  { role: "Hall Owner", email: "vikram@rajwada.in", password: "Owner@123", hint: "Rajwada Grand Palace, Jaipur" },
  { role: "Hall Staff", email: "arjun@rajwada.in", password: "Staff@123", hint: "Venue operations" },
  { role: "Booking Client", email: "priya.k@gmail.com", password: "Client@123", hint: "Book & track events" },
];
