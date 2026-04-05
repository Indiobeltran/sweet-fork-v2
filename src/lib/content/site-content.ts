import type { GalleryItem, ProductPageContent, ProductType } from "@/types/domain";

export const siteConfig = {
  name: "The Sweet Fork",
  description:
    "Premium boutique custom cakes, wedding desserts, macarons, and elevated celebration sweets for modern gatherings in Colorado.",
  phone: "(555) 302-1849",
  email: "hello@thesweetfork.com",
  instagram: "thesweetforkbakery",
  location: "Denver, Colorado",
};

export const mainNavigation = [
  { href: "/", label: "Home" },
  { href: "/custom-cakes", label: "Custom Cakes" },
  { href: "/wedding-cakes", label: "Wedding Cakes" },
  { href: "/gallery", label: "Gallery" },
  { href: "/pricing", label: "Pricing" },
  { href: "/how-to-order", label: "How to Order" },
  { href: "/about", label: "About" },
  { href: "/start-order", label: "Start Order" },
];

export const footerNavigation = {
  services: [
    { href: "/custom-cakes", label: "Custom Cakes" },
    { href: "/wedding-cakes", label: "Wedding Cakes" },
    { href: "/cupcakes", label: "Cupcakes" },
    { href: "/sugar-cookies", label: "Sugar Cookies" },
    { href: "/macarons", label: "Macarons" },
    { href: "/diy-kits", label: "DIY Kits" },
  ],
  company: [
    { href: "/about", label: "About" },
    { href: "/faq", label: "FAQ" },
    { href: "/terms", label: "Terms" },
    { href: "/privacy", label: "Privacy" },
  ],
};

export const productPageContent: Record<string, ProductPageContent> = {
  "custom-cakes": {
    slug: "custom-cakes",
    shortTitle: "Custom Cakes",
    title: "Custom Cakes for the moments everyone remembers",
    eyebrow: "Bespoke celebration cakes",
    intro:
      "For birthdays, baby showers, milestones, and every gathering that deserves a centerpiece, each cake is designed from scratch around your event, palette, and flavor direction.",
    heroStatement:
      "Buttercream-forward, detail-rich cakes with a polished, boutique finish.",
    detailBullets: [
      "Best for birthdays, showers, anniversaries, graduations, and branded events",
      "Built around your guest count, aesthetic references, and serving needs",
      "Starting point keeps premium finishing and labor-intensive design in mind",
    ],
    packages: [
      {
        title: "Signature Celebration",
        description: "Single or double-tier cakes with custom palette, florals, or textural piping.",
      },
      {
        title: "Statement Finish",
        description: "For sculptural details, painted finishes, fondant elements, or premium toppers.",
      },
    ],
    faq: [
      {
        question: "How far in advance should I inquire?",
        answer: "Two to four weeks is ideal for custom celebrations, with earlier outreach for peak weekends.",
      },
      {
        question: "Can you match invitations or party decor?",
        answer: "Yes. Color cues, patterns, florals, and signage references can all guide the final design.",
      },
    ],
  },
  "wedding-cakes": {
    slug: "wedding-cakes",
    shortTitle: "Wedding Cakes",
    title: "Wedding cakes with an editorial, quietly luxurious presence",
    eyebrow: "Wedding cake design",
    intro:
      "Designed for modern weddings that want beauty, presence, and service without anything feeling overstated. Wedding orders can include companion desserts in the same inquiry.",
    heroStatement:
      "A ceremony-worthy cake that photographs beautifully and serves gracefully.",
    detailBullets: [
      "Consultation-led process for venue, guest flow, floral direction, and service style",
      "Designed to pair with cupcakes, macarons, sugar cookies, or dessert tables",
      "Delivery and venue coordination available for approved service areas",
    ],
    packages: [
      {
        title: "Ceremony Centerpiece",
        description: "Tiered cakes for intimate and mid-size weddings with refined buttercream styling.",
      },
      {
        title: "Full Dessert Presence",
        description: "Wedding cake paired with supporting sweets for guest gifting or dessert display.",
      },
    ],
    faq: [
      {
        question: "Do you offer tastings?",
        answer: "Wedding tastings can be offered for qualified bookings and larger celebrations.",
      },
      {
        question: "Can one inquiry include the cake and extra desserts?",
        answer: "Yes. The order form is designed for multi-item wedding dessert planning in one submission.",
      },
    ],
  },
  cupcakes: {
    slug: "cupcakes",
    shortTitle: "Cupcakes",
    title: "Cupcakes that still feel tailored, not off-the-shelf",
    eyebrow: "Custom cupcake sets",
    intro:
      "Perfect for showers, school events, brand activations, and birthdays where easy serving matters but presentation still counts.",
    heroStatement: "Custom flavor assortments with boutique finishing and cohesive styling.",
    detailBullets: [
      "Available in coordinated sets that echo the main event palette",
      "Great as an add-on to cake orders or as a standalone order",
      "Designed for display, gifting, or grab-and-go celebration service",
    ],
    packages: [
      {
        title: "Event Dozen Sets",
        description: "Curated dozens with buttercream, sprinkles, toppers, or simple modern styling.",
      },
      {
        title: "Display Assortments",
        description: "Mixed flavor and style assortments designed to complement a dessert table.",
      },
    ],
    faq: [
      {
        question: "Do cupcake orders need a minimum?",
        answer: "Most custom cupcake orders begin at one dozen, depending on design complexity and calendar availability.",
      },
      {
        question: "Can they coordinate with a larger cake order?",
        answer: "Absolutely. Cupcakes are often used as serving support for larger cake moments.",
      },
    ],
  },
  "sugar-cookies": {
    slug: "sugar-cookies",
    shortTitle: "Sugar Cookies",
    title: "Sugar cookies with tailored detail and gifting appeal",
    eyebrow: "Decorated sugar cookies",
    intro:
      "Designed for showers, party favors, launch gifts, and event tables where every piece feels considered and cohesive.",
    heroStatement: "Custom decorated cookies for elevated favors, dessert bars, and branded moments.",
    detailBullets: [
      "Ideal for event favors, place settings, and launch mailers",
      "Designs can be adapted to monograms, icons, florals, and theme cues",
      "Packaging guidance available for cleaner display and transport",
    ],
    packages: [
      {
        title: "Favor Sets",
        description: "Individually styled cookies for guest gifting or branded packaging.",
      },
      {
        title: "Table Assortments",
        description: "Mixed shapes and palette-led collections for coordinated event presentation.",
      },
    ],
    faq: [
      {
        question: "Can you add monograms or event motifs?",
        answer: "Yes. We can work from invitation elements, logos, florals, or a simple concept direction.",
      },
      {
        question: "Do cookies travel well?",
        answer: "They are one of the easiest options for favors, transport, and advance setup.",
      },
    ],
  },
  macarons: {
    slug: "macarons",
    shortTitle: "Macarons",
    title: "Macarons for dessert tables, gifting, and polished add-ons",
    eyebrow: "Macaron assortments",
    intro:
      "These are a favorite for showers, weddings, and modern dessert tables where color, finish, and presentation all matter.",
    heroStatement: "French macarons in celebration-minded colors and event-ready packaging.",
    detailBullets: [
      "Available as a standalone order or as part of a wider dessert spread",
      "Palette-led assortments available for weddings and brand events",
      "Works beautifully for favors, dessert bars, and boxed gifting",
    ],
    packages: [
      {
        title: "Curated Towers",
        description: "Dessert-table assortments styled for visual rhythm and service ease.",
      },
      {
        title: "Gifted Boxes",
        description: "Small-batch boxes for clients, bridal parties, and event gifting.",
      },
    ],
    faq: [
      {
        question: "Can you match event colors?",
        answer: "Yes. We can get close to a palette and pair flavors that feel cohesive with the overall design.",
      },
      {
        question: "Are macarons available year-round?",
        answer: "Availability depends on seasonality, workload, and weather-sensitive delivery windows.",
      },
    ],
  },
  "diy-kits": {
    slug: "diy-kits",
    shortTitle: "DIY Kits",
    title: "DIY decorating kits that still feel charming and elevated",
    eyebrow: "DIY cookie and cupcake kits",
    intro:
      "For classroom celebrations, hosted activities, client gifting, and kid-friendly events that need something interactive without feeling generic.",
    heroStatement: "Curated decorating kits with polished packaging and clear, festive direction.",
    detailBullets: [
      "Great for birthdays, school breaks, holiday gifting, and community events",
      "Can be adapted for children, families, or branded hospitality moments",
      "Structured for easy pickup, gifting, and guided decorating",
    ],
    packages: [
      {
        title: "Party Kits",
        description: "Decorating-ready boxes built for group activities, parties, or classroom celebrations.",
      },
      {
        title: "Seasonal Gifting",
        description: "Limited-edition kits for holidays, mailers, and curated thank-you gifting.",
      },
    ],
    faq: [
      {
        question: "What is usually included?",
        answer: "Depending on the kit, you can expect baked items, icing, toppings, tools, and simple finishing guidance.",
      },
      {
        question: "Can kits be branded for events or teams?",
        answer: "Yes. Kits can be adapted for company gatherings, launches, and client appreciation.",
      },
    ],
  },
};

export const homeExperiencePillars = [
  {
    title: "Celebration-first design",
    description: "From showers to weddings, every order is led by the feeling of the event, not a preset template.",
  },
  {
    title: "One inquiry, multiple sweets",
    description: "Clients can request cakes, cupcakes, cookies, macarons, and kits together in one streamlined intake.",
  },
  {
    title: "Premium but approachable process",
    description: "Thoughtful guidance, clear pricing signals, and fewer emails before the real creative conversation begins.",
  },
];

export const processSteps = [
  {
    step: "01",
    title: "Share the event vision",
    description: "Tell us about the occasion, guest count, service method, and overall style direction.",
  },
  {
    step: "02",
    title: "Build the item mix",
    description: "Add one or several products inside the same inquiry so the quote starts from the full picture.",
  },
  {
    step: "03",
    title: "Review and reserve",
    description: "We review fit, send the next step or quote details, and move approved orders into production planning.",
  },
];

export const galleryItems: GalleryItem[] = [
  {
    id: "gal-01",
    title: "Textured wedding tiers",
    category: "wedding-cake",
    alt: "Ivory tiered wedding cake with sculpted buttercream texture",
    placeholderKey: "wedding-tier",
  },
  {
    id: "gal-02",
    title: "Garden birthday cake",
    category: "custom-cake",
    alt: "Boutique buttercream birthday cake with floral piping",
    placeholderKey: "garden-cake",
  },
  {
    id: "gal-03",
    title: "Palette-led macaron tower",
    category: "macarons",
    alt: "Neutral-toned macaron tower styled for a shower dessert table",
    placeholderKey: "macaron-tower",
  },
  {
    id: "gal-04",
    title: "Monogram favor cookies",
    category: "sugar-cookies",
    alt: "Decorated sugar cookies with muted gold monogram details",
    placeholderKey: "cookie-favors",
  },
  {
    id: "gal-05",
    title: "Modern shower cupcakes",
    category: "cupcakes",
    alt: "Elegant cupcakes with soft ivory and muted gold finishing",
    placeholderKey: "cupcake-set",
  },
  {
    id: "gal-06",
    title: "Interactive party kits",
    category: "diy-kit",
    alt: "DIY decorating kits arranged in premium bakery boxes",
    placeholderKey: "diy-kit",
  },
];

export const pricingHighlights = [
  {
    label: "Custom Cakes",
    value: "Starting at $160",
    note: "Final pricing depends on servings, design labor, finish style, and delivery needs.",
  },
  {
    label: "Wedding Cakes",
    value: "Starting at $450",
    note: "Wedding cake pricing reflects tier count, servings, display impact, and service logistics.",
  },
  {
    label: "Cupcakes and Cookies",
    value: "Starting at $72",
    note: "Custom sets vary with quantity, decoration, packaging, and whether they support a larger order.",
  },
];

export const faqItems = [
  {
    question: "How early should I reach out?",
    answer: "Weddings should reach out as early as possible. Celebration orders are best submitted at least two weeks ahead when calendar space allows.",
  },
  {
    question: "Can one inquiry include multiple products?",
    answer: "Yes. The new order form is designed so one inquiry can include several product types for the same event.",
  },
  {
    question: "Do you deliver?",
    answer: "Delivery is available for eligible orders and service areas. Pickup is also available for many celebration orders.",
  },
  {
    question: "What if I do not have inspiration photos?",
    answer: "You can still describe the look in words or add links. Image upload is available when enabled, but it is not required.",
  },
];

export const testimonials = [
  {
    quote:
      "The Sweet Fork made our wedding dessert moment feel elevated, calm, and beautifully coordinated with the room.",
    name: "Jordan + Elise",
    context: "Wedding couple",
  },
  {
    quote:
      "The intake felt thoughtful from the start. I could submit the cake, cupcakes, and cookies together instead of explaining the whole party three times.",
    name: "Maya R.",
    context: "Birthday client",
  },
  {
    quote:
      "Every detail felt polished, from the packaging to the flavors to the way it all photographed on the table.",
    name: "Harper Events",
    context: "Event planner",
  },
];

export const adminNavigation = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/gallery", label: "Gallery & Images" },
  { href: "/admin/content", label: "Website Content" },
  { href: "/admin/pricing", label: "Pricing" },
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/faqs", label: "FAQs" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/users", label: "Users" },
];

export const adminDashboardPreview = {
  summary: [
    { label: "New inquiries", value: "12", detail: "4 waiting on same-day reply" },
    { label: "Confirmed orders", value: "7", detail: "3 due this week" },
    { label: "Upcoming deliveries", value: "5", detail: "Friday and Saturday busiest" },
  ],
  inquiries: [
    {
      id: "TSF-24031",
      customer: "Alexandra Bloom",
      eventDate: "2026-05-18",
      status: "New",
      products: "Wedding cake, macarons",
    },
    {
      id: "TSF-24032",
      customer: "Riley Stone",
      eventDate: "2026-04-24",
      status: "Reviewing",
      products: "Custom cake, cupcakes",
    },
    {
      id: "TSF-24033",
      customer: "Mina Carter",
      eventDate: "2026-04-30",
      status: "Quoted",
      products: "Sugar cookies",
    },
  ],
  calendar: [
    { date: "Apr 11", note: "Wedding tasting" },
    { date: "Apr 12", note: "Deposit deadline for June 7 wedding" },
    { date: "Apr 13", note: "Brand gift box pickup" },
  ],
};

export const websiteContentSections = [
  {
    key: "home.hero",
    title: "Homepage Hero",
    description: "Primary landing-page statement, supporting copy, and call-to-action text.",
  },
  {
    key: "home.process",
    title: "How It Works",
    description: "Three-step process content shown before the final order CTA.",
  },
  {
    key: "weddings.highlight",
    title: "Wedding Highlight",
    description: "Editorial section that positions weddings clearly without overpowering celebrations.",
  },
  {
    key: "about.story",
    title: "About Story",
    description: "Founder-facing brand story and hospitality positioning.",
  },
];

export const pricingMatrix = [
  {
    product: "Custom Cakes",
    startingAt: "$160",
    rule: "Base price plus servings and finish complexity",
    leadTime: "2+ weeks",
  },
  {
    product: "Wedding Cakes",
    startingAt: "$450",
    rule: "Tier count, servings, service method, and delivery coordination",
    leadTime: "4+ weeks",
  },
  {
    product: "Cupcakes",
    startingAt: "$72",
    rule: "By dozen with design and packaging adjustments",
    leadTime: "1-2 weeks",
  },
  {
    product: "Sugar Cookies",
    startingAt: "$85",
    rule: "By dozen with detail level and packaging adjustments",
    leadTime: "2+ weeks",
  },
  {
    product: "Macarons",
    startingAt: "$70",
    rule: "By assortment with color and favor packaging variables",
    leadTime: "1-2 weeks",
  },
  {
    product: "DIY Kits",
    startingAt: "$48",
    rule: "By kit count and included components",
    leadTime: "1-2 weeks",
  },
];

export const productTypesForForms: Array<{
  value: ProductType;
  label: string;
  summary: string;
}> = [
  {
    value: "custom-cake",
    label: "Custom Cake",
    summary: "Boutique cakes for birthdays, showers, and celebration tables.",
  },
  {
    value: "wedding-cake",
    label: "Wedding Cake",
    summary: "Tiered cakes and wedding dessert centerpieces.",
  },
  {
    value: "cupcakes",
    label: "Cupcakes",
    summary: "Custom cupcake assortments and event sets.",
  },
  {
    value: "sugar-cookies",
    label: "Sugar Cookies",
    summary: "Decorated cookies for favors and display.",
  },
  {
    value: "macarons",
    label: "Macarons",
    summary: "Macaron assortments for dessert bars and gifting.",
  },
  {
    value: "diy-kit",
    label: "DIY Kit",
    summary: "Interactive decorating kits for parties and gifting.",
  },
];
