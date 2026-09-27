/**
 * MerrageHall demo seed — realistic Indian wedding-venue data.
 * Runs against whatever DATABASE_URL is set (local embedded PG in dev,
 * Supabase Postgres in production). Seeds only when the DB is empty;
 * set FORCE_SEED=1 to wipe & reseed.
 */
import bcrypt from "bcryptjs";
import { db } from "../lib/db.ts";
import {
  addons,
  bookings,
  halls,
  menuItems,
  menuPackages,
  payments,
  plans,
  platformSettings,
  sessions,
  subscriptions,
  users,
  type AddonCategory,
  type DietType,
  type MenuCategory,
} from "../lib/schema.ts";
import { newId } from "../lib/ids.ts";
import { computeTotals, type AddonSelection } from "../lib/pricing.ts";

const hash = (p: string) => bcrypt.hashSync(p, 10);

/* ------------------------------- date helpers ------------------------------ */

const today = new Date();
const key = (d: Date) => {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};
const inDays = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return key(d);
};
const stamp = (dayOffset: number, hour = 11) => {
  const d = new Date(today);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, 24, 0, 0);
  return d;
};

/* --------------------------------- images --------------------------------- */

const U = (id: string) => `https://images.unsplash.com/${id}?q=80&w=1600&auto=format&fit=crop`;
const IMG = {
  reception: U("photo-1519167758481-83f550bb49b3"),
  candles: U("photo-1464366400600-7168b8af9bc3"),
  aisle: U("photo-1478146896981-b80fe463b330"),
  table: U("photo-1519741497674-611481863552"),
  ceremony: U("photo-1469371670807-013ccf25f16a"),
  sparklers: U("photo-1492684223066-81342ee5ff30"),
  party: U("photo-1511795409834-ef04bbd61622"),
  stage: U("photo-1544124499-58912cbddaad"),
  birthday: U("photo-1519671482749-fd09be7ccebf"),
  dinner: U("photo-1522673607200-164d1b6ce486"),
  lights: U("photo-1530103862676-de8c9debad1d"),
  outdoor: U("photo-1519225421980-715cb0215aed"),
  food1: U("photo-1585937421612-70a008356fbe"),
  food2: U("photo-1555939594-58d7cb561ad1"),
  food3: U("photo-1567337710282-00832b415979"),
  food4: U("photo-1559339352-11d035aa65de"),
};

/* ---------------------------------- plans ---------------------------------- */

const PLAN_SPECS = [
  {
    slug: "starter",
    name: "Starter",
    tagline: "Get your venue discovered online",
    priceMonthly: 2499,
    maxStaff: 2,
    maxBookings: 40,
    customDomain: false,
    commissionPct: 7,
    sortOrder: 1,
    features: [
      "Beautiful venue page on MerrageHall",
      "Up to 40 bookings / month",
      "Menu, packages & add-ons catalog",
      "Free subdomain — yourvenue.merragehall.app",
      "2 staff accounts",
      "Email support",
    ],
  },
  {
    slug: "growth",
    name: "Growth",
    tagline: "For venues ready to scale bookings",
    priceMonthly: 5999,
    maxStaff: 6,
    maxBookings: -1,
    customDomain: true,
    commissionPct: 5,
    sortOrder: 2,
    features: [
      "Everything in Starter",
      "Unlimited bookings",
      "6 staff accounts",
      "Custom domain support",
      "Priority marketplace placement",
      "Revenue & occupancy analytics",
      "Shared booking calendar",
    ],
  },
  {
    slug: "premium",
    name: "Premium",
    tagline: "Full power, white-glove support",
    priceMonthly: 11999,
    maxStaff: -1,
    maxBookings: -1,
    customDomain: true,
    commissionPct: 2,
    sortOrder: 3,
    features: [
      "Everything in Growth",
      "Unlimited staff accounts",
      "Featured marketplace placement",
      "Dedicated account manager",
      "Commission reduced to 2%",
      "API access & webhooks",
      "Multi-venue management",
    ],
  },
];

/* ---------------------------------- halls ---------------------------------- */

type MenuSpec = [string, MenuCategory, DietType, number];

const BASE_MENU: MenuSpec[] = [
  ["Paneer Tikka Angara", "STARTER", "VEG", 95],
  ["Hara Bhara Kebab", "STARTER", "VEG", 75],
  ["Dahi ke Kebab", "STARTER", "VEG", 85],
  ["Chicken Tikka Achari", "STARTER", "NON_VEG", 115],
  ["Tandoori Chicken (Half)", "STARTER", "NON_VEG", 135],
  ["Tomato Dhaniya Shorba", "SOUP", "VEG", 45],
  ["Kachumber & Sprout Chaat", "SALAD", "VEG", 40],
  ["Dal Makhani", "MAIN_COURSE", "VEG", 85],
  ["Paneer Lababdar", "MAIN_COURSE", "VEG", 95],
  ["Veg Kolhapuri", "MAIN_COURSE", "VEG", 80],
  ["Butter Chicken", "MAIN_COURSE", "NON_VEG", 145],
  ["Mutton Rogan Josh", "MAIN_COURSE", "NON_VEG", 175],
  ["Butter Naan", "BREAD", "VEG", 25],
  ["Lachha Paratha", "BREAD", "VEG", 30],
  ["Veg Dum Biryani", "RICE", "VEG", 90],
  ["Chicken Dum Biryani", "RICE", "NON_VEG", 135],
  ["Gulab Jamun (2 pc)", "DESSERT", "VEG", 45],
  ["Rasmalai (2 pc)", "DESSERT", "VEG", 55],
  ["Rose Sherbet / Fresh Lime", "DRINKS", "VEG", 35],
  ["Chaat Live Counter", "LIVE_COUNTER", "VEG", 60],
];

type PkgSpec = { name: string; diet: DietType; price: number; desc: string; count: number };
type AddonSpec = [string, AddonCategory, number, string];

const HALL_SPECS = [
  {
      slug: "rajwada-grand-palace",
      customDomain: "book.rajwada.in",
    name: "Rajwada Grand Palace",
    city: "Jaipur",
    state: "Rajasthan",
    status: "ACTIVE" as const,
    plan: "growth",
    owner: { name: "Vikram Singh Rathore", email: "vikram@rajwada.in", phone: "+91 98290 11223" },
    staff: [
      { name: "Arjun Mehta", email: "arjun@rajwada.in", phone: "+91 98290 44556" },
      { name: "Sana Khan", email: "sana@rajwada.in", phone: "+91 98290 77889" },
    ],
    description:
      "A heritage-style palace venue in the heart of Jaipur. The Grand Durbar Hall pairs carved jharokhas with modern comforts, while the Rajputana Lawn hosts open-air ceremonies under the stars. Two decades of shaadi expertise, one unforgettable venue.",
    address: "12, Jai Singh Highway, Bani Park",
    pincode: "302016",
    capacity: 1200,
    hallCount: 2,
    rooms: 14,
    parking: 250,
    baseRent: 150000,
    vegPlate: 649,
    nonvegPlate: 899,
    images: [IMG.reception, IMG.stage, IMG.candles, IMG.sparklers],
    amenities: [
      "Central AC", "Bridal Suite", "Groom Room", "Power Backup", "Valet Parking",
      "In-house Catering", "Mandap Décor", "DJ & Sound Allowed", "Lawn + Banquet Hall",
      "Guest Rooms", "Security Staff", "Bridal Entry Porch",
    ],
    contactPhone: "+91 141 402 8899",
    contactEmail: "bookings@rajwada.in",
    packages: [
      { name: "Silver Jubilee Veg", diet: "VEG" as DietType, price: 649, desc: "Classic vegetarian spread with 12 curated dishes", count: 8 },
      { name: "Golden Veg Celebration", diet: "VEG" as DietType, price: 849, desc: "Premium vegetarian feast with live counters", count: 11 },
      { name: "Shahi Non-Veg Royal", diet: "NON_VEG" as DietType, price: 1099, desc: "Royal Rajputana menu with signature kebabs", count: 12 },
      { name: "Maharaja Grand Buffet", diet: "NON_VEG" as DietType, price: 1299, desc: "The works — 18 dishes, 3 live counters, dessert bar", count: 16 },
    ] as PkgSpec[],
    addons: [
      ["Royal Floral Mandap", "STAGE", 55000, "Fresh marigold & rose mandap with draped pillars"],
      ["Fresh Flower Stage Décor", "STAGE", 28000, "Stage redesigned with seasonal flowers"],
      ["Fairy Lighting & Drapes", "LIGHTING", 18000, "Warm fairy lights with ceiling drapes"],
      ["DJ, Sound & Dance Floor", "SOUND", 22000, "4-hour DJ set, PA system, LED dance floor"],
      ["Cold Pyro Sparklers (Entry)", "ENTERTAINMENT", 7500, "Grand couple entry with indoor sparklers"],
      ["Vintage Car Baraat Entry", "VEHICLE", 15000, "Restored 1962 Ambassador for the groom"],
      ["LED Wall (20 ft)", "LIGHTING", 35000, "Giant LED backdrop for stage & selfies"],
      ["Premium Sofa & Lounge Set", "FURNITURE", 12000, "12 royal sofa sets with cushions"],
    ] as AddonSpec[],
  },
  {
    slug: "emerald-lawns",
    name: "The Emerald Lawns",
    city: "Hyderabad",
    state: "Telangana",
    status: "ACTIVE" as const,
    plan: "premium",
    owner: { name: "Meera Reddy", email: "meera@emeraldlawns.in", phone: "+91 99590 22113" },
    staff: [{ name: "Ravi Teja", email: "ravi@emeraldlawns.in", phone: "+91 99590 66778" }],
    description:
      "Three acres of manicured lawns beside a glasshouse banquet pavilion in Secunderabad. Garden ceremonies at sunset, Deccan-inspired catering, and a dedicated team that has staged 900+ celebrations.",
    address: "Plot 8, Emerald Enclave, Bowenpally",
    pincode: "500011",
    capacity: 800,
    hallCount: 2,
    rooms: 6,
    parking: 120,
    baseRent: 95000,
    vegPlate: 599,
    nonvegPlate: 849,
    images: [IMG.aisle, IMG.outdoor, IMG.party],
    amenities: [
      "Bridal Suite", "Groom Room", "Power Backup", "Valet Parking", "In-house Catering",
      "DJ & Sound Allowed", "Lawn + Banquet Hall", "Haldi & Mehndi Lawn", "Guest Rooms",
      "Wheelchair Friendly", "Kids Play Corner",
    ],
    contactPhone: "+91 40 665 2211",
    contactEmail: "hello@emeraldlawns.in",
    packages: [
      { name: "Garden Veg Delight", diet: "VEG" as DietType, price: 599, desc: "Garden-fresh vegetarian menu, 11 dishes", count: 8 },
      { name: "Emerald Veg Signature", diet: "VEG" as DietType, price: 799, desc: "Signature vegetarian spread with Hyderabadi twists", count: 11 },
      { name: "Nizam's Non-Veg Feast", diet: "NON_VEG" as DietType, price: 1049, desc: "Deccan royal menu with dum biryani & haleem", count: 12 },
    ] as PkgSpec[],
    addons: [
      ["Garden Mandap with Arch", "STAGE", 42000, "Floral arch mandap on the central lawn"],
      ["Festoon & Bollard Lighting", "LIGHTING", 16000, "Warm garden lighting across all lawns"],
      ["DJ & Sound System", "SOUND", 18000, "5-hour set with wireless mics"],
      ["Sparkler Tunnel Entry", "ENTERTAINMENT", 8500, "Couple walks a tunnel of cold sparklers"],
      ["Haldi & Mehndi Corner", "DECOR", 20000, "Themed corner with drapes, swings & props"],
      ["Couple Photoshoot Corner", "PHOTOGRAPHY", 8500, "Styled nook with props & ring light"],
      ["Horse Baraat Entry", "VEHICLE", 12000, "Decorated ghodi with dhol players"],
    ] as AddonSpec[],
  },
  {
    slug: "shagun-palace",
    name: "Shagun Palace",
    city: "Lucknow",
    state: "Uttar Pradesh",
    status: "ACTIVE" as const,
    plan: "growth",
    owner: { name: "Anil Srivastava", email: "anil@shagunpalace.in", phone: "+91 94150 33224" },
    staff: [],
    description:
      "Nawabi grandeur on Sitapur Road — chandeliered halls, a grand staircase for couple entries, and Awadhi cuisine from our in-house kiOM chefs. Lucknow's favourite venue for winter weddings.",
    address: "7, Sitapur Road, Near Butterfly Park",
    pincode: "226020",
    capacity: 1500,
    hallCount: 3,
    rooms: 18,
    parking: 300,
    baseRent: 180000,
    vegPlate: 699,
    nonvegPlate: 949,
    images: [IMG.ceremony, IMG.reception, IMG.table],
    amenities: [
      "Central AC", "Bridal Suite", "Groom Room", "Power Backup", "Valet Parking",
      "In-house Catering", "Mandap Décor", "DJ & Sound Allowed", "Lawn + Banquet Hall",
      "Guest Rooms", "Elevator Access", "Security Staff",
    ],
    contactPhone: "+91 522 711 3344",
    contactEmail: "events@shagunpalace.in",
    packages: [
      { name: "Shagun Veg Shringar", diet: "VEG" as DietType, price: 699, desc: "Awadhi vegetarian menu, 12 dishes", count: 9 },
      { name: "Nawab veg Darbar", diet: "VEG" as DietType, price: 899, desc: "Elaborate vegetarian darbar menu", count: 12 },
      { name: "Awadhi Shahi Non-Veg", diet: "NON_VEG" as DietType, price: 1149, desc: "Galouti, biryani & kormas from our master chefs", count: 13 },
    ] as PkgSpec[],
    addons: [
      ["Crystal Grand Mandap", "STAGE", 48000, "Crystal curtains, chandeliers & fresh flowers"],
      ["Chandelier Aisle Setup", "DECOR", 22000, "Aisle lined with chandeliers & petals"],
      ["Sufi Qawwali Evening (2 hrs)", "ENTERTAINMENT", 25000, "Live qawwali troupe for the sangeet"],
      ["DJ, Sound & Dance Floor", "SOUND", 20000, "6-hour DJ set with laser lights"],
      ["Doli & Palki Entry", "VEHICLE", 18000, "Traditional doli for the bride's farewell"],
      ["Maharaja Sofa Sets", "FURNITURE", 13000, "10 carved sofa sets for the stage"],
    ] as AddonSpec[],
  },
  {
    slug: "kalyani-mahal",
    name: "Kalyani Mahal",
    city: "Chennai",
    state: "Tamil Nadu",
    status: "PENDING" as const,
    plan: "starter",
    owner: { name: "Lakshmi Iyer", email: "lakshmi@kalyanimahal.in", phone: "+91 98410 55337" },
    staff: [],
    description:
      "A modern kalyana mandapam in Anna Nagar with a pillared marriage hall, stainless kitchen and air-conditioned dining for 600. Traditionally South Indian, happily contemporary.",
    address: "45, 3rd Avenue, Anna Nagar East",
    pincode: "600102",
    capacity: 600,
    hallCount: 1,
    rooms: 5,
    parking: 60,
    baseRent: 70000,
    vegPlate: 549,
    nonvegPlate: 799,
    images: [IMG.candles, IMG.dinner],
    amenities: [
      "Central AC", "Bridal Suite", "Power Backup", "In-house Catering",
      "Kitchen & Cold Storage", "Guest Rooms", "Elevator Access", "Wheelchair Friendly",
    ],
    contactPhone: "+91 44 262 11778",
    contactEmail: "kalyanimahal@gmail.com",
    packages: [
      { name: "Muhurtham Veg Menu", diet: "VEG" as DietType, price: 549, desc: "Traditional 10-dish vegetarian muhurtham lunch", count: 8 },
      { name: "Kalyani Veg Grand", diet: "VEG" as DietType, price: 749, desc: "Grand vegetarian banquet with payasam bar", count: 11 },
      { name: "Chettinad Non-Veg Special", diet: "NON_VEG" as DietType, price: 949, desc: "Chettinad classics — kara kozhambut to kuzhi paniyaram", count: 12 },
    ] as PkgSpec[],
    addons: [
      ["Nadaswaram Team (3 hrs)", "ENTERTAINMENT", 9000, "Classic nadaswaram & thavil for the muhurtham"],
      ["Floral Kolam & Mandap", "STAGE", 30000, "Traditional decor with jasmine & marigold"],
      ["Photo & Video Coverage", "PHOTOGRAPHY", 35000, "2 photographers + highlight reel"],
      ["Dining Leaf Service", "FURNITURE", 8000, "Traditional banana-leaf dining service"],
      ["AC Guest Rooms (2)", "FURNITURE", 6000, "Two AC rooms for the families"],
    ] as AddonSpec[],
  },
  {
    slug: "amara-gardens",
    name: "Amara Gardens",
    city: "Bengaluru",
    state: "Karnataka",
    status: "ACTIVE" as const,
    plan: "starter",
    owner: { name: "Farhan Qureshi", email: "farhan@amaragardens.in", phone: "+91 98450 77441" },
    staff: [],
    description:
      "A boutique garden venue off Sarjapur Road — jacaranda courtyards, a glasshouse dining pavilion and a young team that loves intimate weddings, mehndis and baby showers alike.",
    address: "22/3, Dommasandra Circle, Sarjapur Road",
    pincode: "562125",
    capacity: 900,
    hallCount: 2,
    rooms: 8,
    parking: 90,
    baseRent: 110000,
    vegPlate: 599,
    nonvegPlate: 849,
    images: [IMG.outdoor, IMG.lights, IMG.sparklers],
    amenities: [
      "Bridal Suite", "Groom Room", "Power Backup", "Valet Parking", "Outside Catering Allowed",
      "DJ & Sound Allowed", "Rooftop Terrace", "Guest Rooms", "Kids Play Corner",
    ],
    contactPhone: "+91 80 778 9922",
    contactEmail: "hi@amaragardens.in",
    packages: [
      { name: "Garden Veg Soirée", diet: "VEG" as DietType, price: 599, desc: "Farm-fresh vegetarian menu, 11 dishes", count: 8 },
      { name: "Amara Veg Reserve", diet: "VEG" as DietType, price: 799, desc: "Reserve vegetarian menu with artisanal desserts", count: 11 },
      { name: "Coastal Non-Veg Trawler", diet: "NON_VEG" as DietType, price: 999, desc: "Mangalorean coastal spread with seafood counters", count: 12 },
    ] as PkgSpec[],
    addons: [
      ["Jasmine Pergola Mandap", "STAGE", 38000, "Living jasmine pergola with cane seating"],
      ["Bistro String Lighting", "LIGHTING", 14000, "Café-style string lights across the courtyard"],
      ["Acoustic Live Band (2 hrs)", "SOUND", 16000, "Unplugged set during dinner"],
      ["Brunch & Bubbles Counter", "OTHER", 11000, "Morning-after brunch counter for close family"],
      ["Open Vintage Photo Booth", "PHOTOGRAPHY", 7500, "Instant-print booth with props"],
      ["E-rickshaw Venue Shuttle", "VEHICLE", 9000, "Guest shuttle from the main gate"],
    ] as AddonSpec[],
  },
  {
    slug: "noor-banquets",
    name: "Noor Banquets",
    city: "Pune",
    state: "Maharashtra",
    status: "SUSPENDED" as const,
    plan: "growth",
    owner: { name: "Zoya Khan", email: "zoya@noorbanquets.in", phone: "+91 97660 88552" },
    staff: [],
    description:
      "Two elegant banquet halls on Nagar Road — crystal chandeliers, Mughlai catering and a grand reception foyer. Kalyan Nagar's go-to for nikah ceremonies and receptions.",
    address: "Noor House, Nagar Road, Yerawada",
    pincode: "411014",
    capacity: 450,
    hallCount: 2,
    rooms: 4,
    parking: 70,
    baseRent: 60000,
    vegPlate: 499,
    nonvegPlate: 749,
    images: [IMG.party, IMG.stage],
    amenities: [
      "Central AC", "Bridal Suite", "Power Backup", "In-house Catering",
      "DJ & Sound Allowed", "Guest Rooms", "Elevator Access",
    ],
    contactPhone: "+91 20 664 7788",
    contactEmail: "noorbanquets@gmail.com",
    packages: [
      { name: "Noor Veg Dawat", diet: "VEG" as DietType, price: 499, desc: "Hearty vegetarian dawat, 10 dishes", count: 8 },
      { name: "Shahi Veg Bada Khana", diet: "VEG" as DietType, price: 699, desc: "Grand vegetarian bada khana", count: 11 },
      { name: "Mughlai Non-Veg Bada Khana", diet: "NON_VEG" as DietType, price: 949, desc: "Mughlai classics — kebabs, biryani & sheermal", count: 12 },
    ] as PkgSpec[],
    addons: [
      ["Nikah Stage &Backdrop", "STAGE", 26000, "Elegant stage with cream drapes & florals"],
      ["Golden Uplighting", "LIGHTING", 12000, "Warm uplighting across both halls"],
      ["DJ & Sound (4 hrs)", "SOUND", 15000, "DJ set with subwoofer arrays"],
      ["Dhol Party (1 hr)", "ENTERTAINMENT", 8000, "Dhol players for the baraat"],
      ["Luxury Sedan Transfer", "VEHICLE", 10000, "Chauffeured sedan for the couple"],
    ] as AddonSpec[],
  },
];

/* -------------------------------- bookings --------------------------------- */

type BookingSpec = {
  hall: string;
  name: string;
  phone: string;
  email: string;
  type: string;
  day: number;
  slot: "LUNCH" | "DINNER" | "FULL_DAY";
  guests: number;
  pkg?: string;
  addonNames?: string[];
  discount?: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  source?: "WEBSITE" | "DASHBOARD";
  bookedBy?: string;
  notes?: string;
  venueOnly?: boolean;
};

const BOOKING_SPECS: BookingSpec[] = [
  // ---- Rajwada Grand Palace (10) ----
  { hall: "rajwada-grand-palace", name: "Kavita & Rohit Sharma", phone: "+91 98111 20001", email: "kavita.sharma@gmail.com", type: "Wedding", day: -145, slot: "DINNER", guests: 700, pkg: "Shahi Non-Veg Royal", addonNames: ["Royal Floral Mandap", "DJ, Sound & Dance Floor"], status: "COMPLETED" },
  { hall: "rajwada-grand-palace", name: "The Bhandari Family", phone: "+91 98111 20002", email: "bhandari.ujwal@gmail.com", type: "Reception", day: -118, slot: "DINNER", guests: 450, pkg: "Golden Veg Celebration", addonNames: ["Fairy Lighting & Drapes"], status: "COMPLETED", discount: 5000 },
  { hall: "rajwada-grand-palace", name: "Aditi & Siddharth Jain", phone: "+91 98111 20003", email: "aditi.jain@gmail.com", type: "Wedding", day: -88, slot: "FULL_DAY", guests: 850, pkg: "Maharaja Grand Buffet", addonNames: ["Royal Floral Mandap", "Cold Pyro Sparklers (Entry)", "LED Wall (20 ft)"], status: "COMPLETED", notes: "Jain counters x2, separate cooking area requested." },
  { hall: "rajwada-grand-palace", name: "Mehta Family (Sangeet)", phone: "+91 98111 20004", email: "nikhil.mehta@gmail.com", type: "Sangeet", day: -47, slot: "DINNER", guests: 300, pkg: "Silver Jubilee Veg", addonNames: ["DJ, Sound & Dance Floor", "Premium Sofa & Lounge Set"], status: "COMPLETED", discount: 10000 },
  { hall: "rajwada-grand-palace", name: "Ritika & Aakash Tomar", phone: "+91 98111 20005", email: "ritika.tomar@gmail.com", type: "Engagement", day: -12, slot: "LUNCH", guests: 220, pkg: "Golden Veg Celebration", status: "COMPLETED" },
  { hall: "rajwada-grand-palace", name: "Devansh & Family", phone: "+91 98111 20006", email: "devansh.agarwal@gmail.com", type: "Haldi / Mehndi", day: -60, slot: "LUNCH", guests: 150, status: "CANCELLED", venueOnly: true, notes: "Cancelled — family opted for a farmhouse instead." },
  { hall: "rajwada-grand-palace", name: "Priya Kapoor & Aarav Nair", phone: "+91 98111 20007", email: "priya.k@gmail.com", type: "Wedding", day: 4, slot: "DINNER", guests: 650, pkg: "Maharaja Grand Buffet", addonNames: ["Royal Floral Mandap", "Cold Pyro Sparklers (Entry)", "Vintage Car Baraat Entry"], status: "CONFIRMED", source: "WEBSITE", bookedBy: "priya.k@gmail.com", discount: 15000, notes: "Baraat arrives 6 PM. Two Jain food counters required." },
  { hall: "rajwada-grand-palace", name: "The Khetan Family", phone: "+91 98111 20008", email: "sumit.khetan@gmail.com", type: "Reception", day: 18, slot: "DINNER", guests: 500, pkg: "Shahi Non-Veg Royal", addonNames: ["LED Wall (20 ft)", "DJ, Sound & Dance Floor"], status: "CONFIRMED" },
  { hall: "rajwada-grand-palace", name: "Rohan Gupta", phone: "+91 98111 20009", email: "rohan.g@gmail.com", type: "Sangeet", day: 31, slot: "DINNER", guests: 280, pkg: "Golden Veg Celebration", addonNames: ["DJ, Sound & Dance Floor"], status: "PENDING", source: "WEBSITE", bookedBy: "rohan.g@gmail.com", notes: "Wants a mocktail-only bar and karaoke setup." },
  { hall: "rajwada-grand-palace", name: "Anaya Bhandari", phone: "+91 98111 20010", email: "anaya.b@gmail.com", type: "Baby Shower", day: 52, slot: "LUNCH", guests: 120, pkg: "Silver Jubilee Veg", status: "PENDING" },

  // ---- The Emerald Lawns (6) ----
  { hall: "emerald-lawns", name: "Sirisha & Vikas Reddy", phone: "+91 99590 30001", email: "sirisha.r@gmail.com", type: "Wedding", day: -132, slot: "FULL_DAY", guests: 600, pkg: "Nizam's Non-Veg Feast", addonNames: ["Garden Mandap with Arch", "Sparkler Tunnel Entry"], status: "COMPLETED" },
  { hall: "emerald-lawns", name: "The Muppalla Family", phone: "+91 99590 30002", email: "kiran.muppalla@gmail.com", type: "Reception", day: -75, slot: "DINNER", guests: 380, pkg: "Emerald Veg Signature", addonNames: ["Festoon & Bollard Lighting"], status: "COMPLETED" },
  { hall: "emerald-lawns", name: "Divya & Arjun Pellikuthuru", phone: "+91 99590 30003", email: "divya.p@gmail.com", type: "Haldi / Mehndi", day: -20, slot: "LUNCH", guests: 180, pkg: "Garden Veg Delight", addonNames: ["Haldi & Mehndi Corner"], status: "COMPLETED", discount: 3000 },
  { hall: "emerald-lawns", name: "Ishaan & Tara Verma", phone: "+91 99590 30004", email: "tara.verma@gmail.com", type: "Wedding", day: -33, slot: "FULL_DAY", guests: 520, pkg: "Nizam's Non-Veg Feast", addonNames: ["Garden Mandap with Arch", "Horse Baraat Entry"], status: "CANCELLED", notes: "Cancelled due to a family emergency — advance refunded." },
  { hall: "emerald-lawns", name: "Ananya Iyer & Nikhil Rao", phone: "+91 99590 30005", email: "ananya.iyer@gmail.com", type: "Wedding", day: 11, slot: "FULL_DAY", guests: 550, pkg: "Emerald Veg Signature", addonNames: ["Garden Mandap with Arch", "Festoon & Bollard Lighting", "Couple Photoshoot Corner"], status: "CONFIRMED", source: "WEBSITE", bookedBy: "ananya.iyer@gmail.com", notes: "Muhurtham at 7:10 AM — early access requested from 5 AM." },
  { hall: "emerald-lawns", name: "The Grandhi Family", phone: "+91 99590 30006", email: "grandhi.s@gmail.com", type: "Anniversary", day: 26, slot: "LUNCH", guests: 140, pkg: "Garden Veg Delight", status: "PENDING" },

  // ---- Shagun Palace (6) ----
  { hall: "shagun-palace", name: "Sneha & Vaibhav Dixit", phone: "+91 94150 40001", email: "sneha.dixit@gmail.com", type: "Wedding", day: -160, slot: "DINNER", guests: 1000, pkg: "Awadhi Shahi Non-Veg", addonNames: ["Crystal Grand Mandap", "Sufi Qawwali Evening (2 hrs)"], status: "COMPLETED" },
  { hall: "shagun-palace", name: "The Kapoor Family", phone: "+91 94150 40002", email: "raj.kapoor@gmail.com", type: "Reception", day: -95, slot: "DINNER", guests: 750, pkg: "Nawab veg Darbar", addonNames: ["Chandelier Aisle Setup", "Maharaja Sofa Sets"], status: "COMPLETED", discount: 20000 },
  { hall: "shagun-palace", name: "Fatima Sheikh & Imran Ali", phone: "+91 94150 40003", email: "fatima.s@gmail.com", type: "Wedding", day: -55, slot: "FULL_DAY", guests: 900, pkg: "Awadhi Shahi Non-Veg", addonNames: ["Crystal Grand Mandap", "DJ, Sound & Dance Floor", "Doli & Palki Entry"], status: "COMPLETED", source: "WEBSITE", bookedBy: "fatima.s@gmail.com" },
  { hall: "shagun-palace", name: "Yash & Nidhi Srivastava", phone: "+91 94150 40004", email: "yash.sriv@gmail.com", type: "Engagement", day: 9, slot: "DINNER", guests: 320, pkg: "Shagun Veg Shringar", addonNames: ["Chandelier Aisle Setup"], status: "CONFIRMED" },
  { hall: "shagun-palace", name: "The Tandon Family", phone: "+91 94150 40005", email: "tandon.house@gmail.com", type: "Wedding", day: 40, slot: "FULL_DAY", guests: 1100, pkg: "Awadhi Shahi Non-Veg", addonNames: ["Crystal Grand Mandap", "Sufi Qawwali Evening (2 hrs)", "Doli & Palki Entry"], status: "CONFIRMED", discount: 25000 },
  { hall: "shagun-palace", name: "Karan Malhotra", phone: "+91 94150 40006", email: "karan.m@gmail.com", type: "Sangeet", day: 24, slot: "DINNER", guests: 260, pkg: "Nawab veg Darbar", addonNames: ["DJ, Sound & Dance Floor"], status: "PENDING", source: "WEBSITE", bookedBy: "karan.m@gmail.com", notes: "Wants to confirm a choreographer green room." },

  // ---- Amara Gardens (5) ----
  { hall: "amara-gardens", name: "Meghana & Prithvi Shetty", phone: "+91 98450 50001", email: "meghana.s@gmail.com", type: "Wedding", day: -110, slot: "FULL_DAY", guests: 420, pkg: "Coastal Non-Veg Trawler", addonNames: ["Jasmine Pergola Mandap", "Acoustic Live Band (2 hrs)"], status: "COMPLETED" },
  { hall: "amara-gardens", name: "The Fernandes Family", phone: "+91 98450 50002", email: "maria.fernandes@gmail.com", type: "Birthday", day: -42, slot: "LUNCH", guests: 130, pkg: "Garden Veg Soirée", addonNames: ["Bistro String Lighting", "Open Vintage Photo Booth"], status: "COMPLETED" },
  { hall: "amara-gardens", name: "Ayesha & Rehan Qadri", phone: "+91 98450 50003", email: "ayesha.q@gmail.com", type: "Reception", day: 16, slot: "DINNER", guests: 300, pkg: "Amara Veg Reserve", addonNames: ["Bistro String Lighting", "Acoustic Live Band (2 hrs)"], status: "CONFIRMED" },
  { hall: "amara-gardens", name: "Nisha & Karthik Iyengar", phone: "+91 98450 50004", email: "nisha.iyengar@gmail.com", type: "Baby Shower", day: 7, slot: "LUNCH", guests: 90, pkg: "Garden Veg Soirée", addonNames: ["Brunch & Bubbles Counter"], status: "PENDING", source: "WEBSITE", bookedBy: "ananya.iyer@gmail.com" },
  { hall: "amara-gardens", name: "The Dixits (Mehndi)", phone: "+91 98450 50005", email: "aditi.dixit@gmail.com", type: "Haldi / Mehndi", day: 60, slot: "LUNCH", guests: 110, status: "PENDING", venueOnly: true },

  // ---- Noor Banquets (2) ----
  { hall: "noor-banquets", name: "Zainab & Faiz Ahmed", phone: "+91 97660 60001", email: "zainab.a@gmail.com", type: "Wedding", day: -70, slot: "DINNER", guests: 380, pkg: "Mughlai Non-Veg Bada Khana", addonNames: ["Nikah Stage &Backdrop", "Dhol Party (1 hr)"], status: "COMPLETED" },
  { hall: "noor-banquets", name: "Rahul Verma", phone: "+91 97660 60002", email: "rahul.verma@gmail.com", type: "Reception", day: 20, slot: "DINNER", guests: 240, pkg: "Noor Veg Dawat", addonNames: ["Golden Uplighting"], status: "PENDING", source: "WEBSITE", bookedBy: "rahul.verma@gmail.com", notes: "Wants to visit the venue before confirming." },

  // ---- Kalyani Mahal (1) ----
  { hall: "kalyani-mahal", name: "Deepika & Surya Prakash", phone: "+91 98410 70001", email: "deepika.p@gmail.com", type: "Wedding", day: 35, slot: "LUNCH", guests: 500, pkg: "Kalyani Veg Grand", addonNames: ["Nadaswaram Team (3 hrs)", "Floral Kolam & Mandap"], status: "PENDING" },
];

/* ------------------------------- customers --------------------------------- */

const CUSTOMERS = [
  { name: "Priya Kapoor", email: "priya.k@gmail.com", phone: "+91 98111 20007" },
  { name: "Rahul Verma", email: "rahul.verma@gmail.com", phone: "+91 97660 60002" },
  { name: "Ananya Iyer", email: "ananya.iyer@gmail.com", phone: "+91 99590 30005" },
  { name: "Karan Malhotra", email: "karan.m@gmail.com", phone: "+91 94150 40006" },
  { name: "Fatima Sheikh", email: "fatima.s@gmail.com", phone: "+91 94150 40003" },
  { name: "Rohan Gupta", email: "rohan.g@gmail.com", phone: "+91 98111 20009" },
];

/* ---------------------------------- run ------------------------------------ */

async function main() {
  const existing = await db.select({ id: halls.id }).from(halls).limit(1);
  if (existing.length > 0 && !process.env.FORCE_SEED) {
    console.log("• Database already seeded — skipping. (Set FORCE_SEED=1 to wipe & reseed.)");
    return;
  }

  console.log("• Seeding MerrageHall demo data…");

  // wipe (children first)
  await db.delete(payments);
  await db.delete(bookings);
  await db.delete(subscriptions);
  await db.delete(menuPackages);
  await db.delete(menuItems);
  await db.delete(addons);
  await db.delete(sessions);
  await db.delete(halls);
  await db.delete(users);
  await db.delete(plans);
  await db.delete(platformSettings);

  // plans
  const planRows = PLAN_SPECS.map((p) => ({ id: newId("plan"), ...p }));
  await db.insert(plans).values(planRows);
  const planBySlug = Object.fromEntries(planRows.map((p) => [p.slug, p]));

  // saas owner
  const adminId = newId("usr");
  await db.insert(users).values({
    id: adminId,
    name: "Avinash Sarraf",
    email: "admin@merragehall.com",
    phone: "+91 98765 43210",
    passwordHash: hash("Admin@123"),
    role: "SUPER_ADMIN",
  });

  const userIdByEmail = new Map<string, string>();

  for (const c of CUSTOMERS) {
    const id = newId("usr");
    userIdByEmail.set(c.email, id);
    await db.insert(users).values({
      id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      passwordHash: hash("Client@123"),
      role: "CUSTOMER",
    });
  }

  type HallCtx = {
    hall: typeof halls.$inferInsert;
    addons: (typeof addons.$inferInsert)[];
    packages: (typeof menuPackages.$inferInsert)[];
    items: (typeof menuItems.$inferInsert)[];
  };
  const ctxBySlug = new Map<string, HallCtx>();

  for (const spec of HALL_SPECS) {
    // owner
    const ownerId = newId("usr");
    await db.insert(users).values({
      id: ownerId,
      name: spec.owner.name,
      email: spec.owner.email,
      phone: spec.owner.phone,
      passwordHash: hash("Owner@123"),
      role: "HALL_OWNER",
    });

    const hallId = newId("hall");
    const createdAt = stamp(-240 - Math.floor(Math.random() * 60));
    const hall = {
      id: hallId,
      ownerId,
      name: spec.name,
      slug: spec.slug,
      status: spec.status,
      customDomain: spec.customDomain ?? null,
      domainVerified: spec.customDomain ? true : false,
      description: spec.description,
      address: spec.address,
      city: spec.city,
      state: spec.state,
      pincode: spec.pincode,
      capacity: spec.capacity,
      hallCount: spec.hallCount,
      rooms: spec.rooms,
      parking: spec.parking,
      baseRent: spec.baseRent,
      vegPlate: spec.vegPlate,
      nonvegPlate: spec.nonvegPlate,
      amenities: spec.amenities,
      images: spec.images,
      contactPhone: spec.contactPhone,
      contactEmail: spec.contactEmail,
      createdAt,
      updatedAt: createdAt,
    };
    await db.insert(halls).values(hall);

    // staff
    for (const s of spec.staff) {
      const id = newId("usr");
      userIdByEmail.set(s.email, id);
      await db.insert(users).values({
        id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        passwordHash: hash("Staff@123"),
        role: "HALL_STAFF",
        hallId,
      });
    }

    // subscription
    const plan = planBySlug[spec.plan];
    const subStatus =
      spec.status === "SUSPENDED" ? "PAST_DUE" : spec.status === "PENDING" ? "TRIALING" : "ACTIVE";
    await db.insert(subscriptions).values({
      id: newId("sub"),
      hallId,
      planId: plan.id,
      status: subStatus,
      priceMonthly: plan.priceMonthly,
      startedAt: subStatus === "TRIALING" ? stamp(-5) : stamp(-240),
    });

    // menu items
    const itemRows = BASE_MENU.map(([name, category, dietType, price]) => ({
      id: newId("mi"),
      hallId,
      name,
      category,
      dietType,
      pricePerPlate: price,
      description: "",
    }));
    await db.insert(menuItems).values(itemRows);

    // packages (pick first N items as the package contents)
    const packageRows = spec.packages.map((p) => ({
      id: newId("pkg"),
      hallId,
      name: p.name,
      description: p.desc,
      pricePerPlate: p.price,
      dietType: p.diet,
      items: itemRows.slice(0, p.count).map((i) => i.id),
      image: "",
    }));
    await db.insert(menuPackages).values(packageRows);

    // addons
    const addonRows = spec.addons.map(([name, category, price, description]) => ({
      id: newId("add"),
      hallId,
      name,
      category,
      price,
      description,
    }));
    await db.insert(addons).values(addonRows);

    ctxBySlug.set(spec.slug, { hall, addons: addonRows, packages: packageRows, items: itemRows });
  }

  // bookings + payments
  for (const b of BOOKING_SPECS) {
    const ctx = ctxBySlug.get(b.hall)!;
    const pkg = b.pkg ? ctx.packages.find((p) => p.name === b.pkg) : undefined;
    const selectedAddons: AddonSelection[] = (b.addonNames ?? [])
      .map((n) => ctx.addons.find((a) => a.name === n))
      .filter((a): a is NonNullable<typeof a> => !!a)
      .map((a) => ({ id: a.id!, name: a.name, price: a.price ?? 0, qty: 1, unit: a.unit ?? "per event" }));

    const totals = computeTotals({
      hallRent: (ctx.hall.baseRent as number) ?? 0,
      guestCount: b.guests,
      platePrice: (pkg?.pricePerPlate as number) ?? 0,
      addons: selectedAddons,
      discount: b.discount ?? 0,
    });

    const advance = b.status === "CANCELLED" ? 0 : Math.round((totals.totalAmount * 0.25) / 1000) * 1000;
    const paid =
      b.status === "COMPLETED" ? totals.totalAmount : b.status === "CONFIRMED" ? advance : 0;

    const bookingId = newId("bkg");
    await db.insert(bookings).values({
      id: bookingId,
      hallId: ctx.hall.id!,
      bookedByUserId: b.bookedBy ? (userIdByEmail.get(b.bookedBy) ?? null) : null,
      customerName: b.name,
      customerPhone: b.phone,
      customerEmail: b.email,
      eventType: b.type,
      eventDate: inDays(b.day),
      slot: b.slot,
      guestCount: b.guests,
      menuPackageId: pkg?.id ?? null,
      menuPackageName: pkg?.name ?? "",
      platePrice: (pkg?.pricePerPlate as number) ?? 0,
      hallRent: totals.hallRent,
      addons: selectedAddons,
      cateringTotal: totals.cateringTotal,
      addonsTotal: totals.addonsTotal,
      discount: totals.discount,
      totalAmount: totals.totalAmount,
      advanceAmount: advance,
      paidAmount: paid,
      status: b.status,
      notes: b.notes ?? "",
      source: b.source ?? "DASHBOARD",
      createdAt: stamp(b.day - 21),
      updatedAt: stamp(Math.min(0, b.day) || -1),
    });

    if (b.status === "COMPLETED") {
      await db.insert(payments).values([
        {
          id: newId("pay"),
          hallId: ctx.hall.id!,
          bookingId,
          type: "BOOKING",
          amount: advance,
          method: "UPI",
          status: "PAID",
          reference: `ADV-${bookingId.slice(-6).toUpperCase()}`,
          description: `Advance — ${b.name}`,
          createdAt: stamp(b.day - 20),
        },
        {
          id: newId("pay"),
          hallId: ctx.hall.id!,
          bookingId,
          type: "BOOKING",
          amount: totals.totalAmount - advance,
          method: b.day % 3 === 0 ? "BANK" : "CASH",
          status: "PAID",
          reference: `FIN-${bookingId.slice(-6).toUpperCase()}`,
          description: `Final settlement — ${b.name}`,
          createdAt: stamp(b.day + 1),
        },
      ]);
      // platform commission on completed events
      const planSlug = HALL_SPECS.find((s) => s.slug === b.hall)!.plan;
      const pct = planBySlug[planSlug].commissionPct;
      await db.insert(payments).values({
        id: newId("pay"),
        hallId: ctx.hall.id!,
        bookingId,
        type: "COMMISSION",
        amount: Math.round((totals.totalAmount * pct) / 100),
        method: "BANK",
        status: "PAID",
        description: `Platform commission (${pct}%) — ${b.name}`,
        createdAt: stamp(b.day + 2),
      });
    } else if (b.status === "CONFIRMED") {
      await db.insert(payments).values({
        id: newId("pay"),
        hallId: ctx.hall.id!,
        bookingId,
        type: "BOOKING",
        amount: advance,
        method: "UPI",
        status: "PAID",
        reference: `ADV-${bookingId.slice(-6).toUpperCase()}`,
        description: `Advance — ${b.name}`,
        createdAt: stamp(b.day - 14),
      });
    }
  }

  // subscription invoices (last 3 months for active subscriptions)
  for (const spec of HALL_SPECS) {
    if (spec.status !== "ACTIVE" && spec.status !== "SUSPENDED") continue;
    const plan = planBySlug[spec.plan];
    const ctx = ctxBySlug.get(spec.slug)!;
    for (let m = 2; m >= 0; m--) {
      const missed = spec.status === "SUSPENDED" && m === 0; // noor missed latest invoice
      await db.insert(payments).values({
        id: newId("pay"),
        hallId: ctx.hall.id!,
        type: "SUBSCRIPTION",
        amount: plan.priceMonthly,
        method: m % 2 === 0 ? "UPI" : "CARD",
        status: missed ? "PENDING" : "PAID",
        description: `${plan.name} plan subscription`,
        createdAt: stamp(-m * 30 - 2),
      });
    }
  }

  // platform settings
  await db.insert(platformSettings).values([
    { key: "siteName", value: "MerrageHall" },
    { key: "commissionPct", value: "5" },
    { key: "supportEmail", value: "support@merragehall.com" },
    { key: "rootDomain", value: "merragehall.app" },
  ]);

  console.log(
    `✓ Seeded ${HALL_SPECS.length} venues, ${BOOKING_SPECS.length} bookings, ${CUSTOMERS.length + 1 + HALL_SPECS.length * 2} users.`
  );
  console.log("  Demo logins → admin@merragehall.com / Admin@123 · vikram@rajwada.in / Owner@123 · arjun@rajwada.in / Staff@123 · priya.k@gmail.com / Client@123");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
