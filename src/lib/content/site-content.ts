import type { GalleryItem, ProductPageContent, ProductType } from "@/types/domain";

export const siteConfig = {
  name: "The Sweet Fork",
  description:
    "Owner-operated by Melissa in Centerville, The Sweet Fork creates from-scratch custom cakes and desserts for local pickup and select Northern Utah delivery.",
  phone: "(801) 739-4168",
  email: "thesweetfork@yahoo.com",
  instagram: "the_sweet_fork",
  location: "Centerville, Utah",
};

export const primaryNavigation = [
  { href: "/", label: "Home" },
  { href: "/custom-cakes", label: "Custom Cakes" },
  { href: "/wedding-cakes", label: "Wedding Cakes" },
  { href: "/cupcakes", label: "Cupcakes" },
  { href: "/sugar-cookies", label: "Sugar Cookies" },
  { href: "/macarons", label: "Macarons" },
  { href: "/diy-kits", label: "DIY Kits" },
];

export const secondaryNavigation = [
  { href: "/pricing", label: "Pricing" },
  { href: "/how-to-order", label: "How to Order" },
  { href: "/gallery", label: "Gallery" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
];

export const footerNavigation = [{ href: "/terms", label: "Terms" }, { href: "/privacy", label: "Privacy" }];

export const productPageContent: Record<string, ProductPageContent> = {
  "custom-cakes": {
    slug: "custom-cakes",
    shortTitle: "Custom Cakes",
    title: "Custom cakes designed for birthdays, milestones, and meaningful celebrations.",
    eyebrow: "Custom Cakes",
    intro:
      "Each cake is planned around your gathering, guest count, color palette, and inspiration, then finished with close attention to flavor and presentation.",
    trustStatement:
      "Melissa designs each cake around your celebration, using your colors, theme, serving needs, and inspiration as a starting point.",
    heroStatement: "From-scratch cakes shaped through color, texture, piping, and finishing details chosen for your event.",
    heroImage: {
      src: "/placeholders/marketing/garden-cake.jpg",
      alt: "Floral buttercream celebration cake with soft garden tones and an ivory finish",
    },
    startingPriceLabel: "$80+",
    pricingNote: "Celebration cakes begin at $80.",
    pricingContext:
      "Final quotes reflect servings, tier count, finish complexity, and pickup or delivery coordination.",
    availabilityNote: "Most custom cakes need at least 2 weeks notice, and peak weekends can book earlier.",
    detailBullets: [
      "Single-tier celebration cakes are a strong fit for birthdays, showers, and smaller gatherings.",
      "Tiered cakes can be designed for larger celebrations when you need more servings or a stronger visual centerpiece.",
      "Inspiration is welcome, but each design is interpreted through The Sweet Fork style rather than copied exactly.",
      "Sharing your guest count, event date, color or theme direction, flavor preferences, and any inspiration photos up front helps your custom quote come back quickly and accurately.",
    ],
    faq: [
      {
        question: "How far in advance should I order?",
        answer:
          "Custom cakes need a minimum of 2 weeks notice. Wedding cakes should be ordered 4 to 6 weeks ahead, and busy-season dates are best booked even earlier.",
      },
      {
        question: "How does ordering work?",
        answer:
          "Every cake is custom-quoted, so you start with the inquiry form rather than instant checkout. Melissa reviews the request and follows up with availability, a custom quote, and next steps. Once the quote is approved, a 50% non-refundable deposit secures the date.",
      },
      {
        question: "Can you recreate a cake I saw online?",
        answer:
          "Inspiration photos are welcome, but designs are interpreted in The Sweet Fork's style rather than copied exactly.",
      },
      {
        question: "What flavors do you offer?",
        answer:
          "Vanilla, chocolate, red velvet, lemon, strawberry, funfetti, carrot, almond, and coconut are available, with custom flavors possible on request.",
      },
      {
        question: "Do you offer pickup and delivery?",
        answer:
          "Custom cakes are available for local pickup in Centerville. Delivery may be available across Davis, Weber, and Salt Lake Counties depending on the date, distance, and order details. The Sweet Fork does not currently ship cakes.",
      },
    ],
  },
  "wedding-cakes": {
    slug: "wedding-cakes",
    shortTitle: "Wedding Cakes",
    title: "Wedding cakes designed around your celebration, guest count, and setting.",
    eyebrow: "Wedding cakes",
    intro:
      "Each wedding cake is planned around your guest count, flavor preferences, floral or styling direction, and the role it will play within the dessert display.",
    trustStatement:
      "Plan directly with Melissa, from flavors and servings through design, delivery, and display details.",
    heroStatement: "Designed as a focal point, with companion desserts coordinated through the same inquiry when needed.",
    heroImage: {
      src: "/placeholders/marketing/wedding-tier.jpg",
      alt: "Elegant tiered wedding cake with refined ivory buttercream and floral detail",
    },
    startingPriceLabel: "$300+",
    pricingNote: "Wedding cakes begin at $300.",
    pricingContext:
      "Your quote is shaped by servings, structure, finish complexity, venue logistics, and delivery needs.",
    availabilityNote: "Wedding inquiries are best submitted 4 to 6 weeks ahead, with earlier booking recommended for peak dates.",
    detailBullets: [
      "Wedding cakes are available as statement centerpieces or as part of a larger dessert table with coordinated companion sweets.",
      "Delivery may be available across Davis, Weber, and Salt Lake Counties when the date, location, and order details align.",
      "Sharing your wedding date, venue or delivery location, estimated guest count, and style inspiration early gives the most room to plan tasting, design direction, and display.",
      "The earlier the inquiry comes in, the more room there is to align date, design direction, and display planning.",
    ],
    faq: [
      {
        question: "Do you offer tastings?",
        answer:
          "There are no in-person tastings right now, but curated wedding tasting boxes may be available for an additional fee. Melissa will confirm current options when reviewing the inquiry.",
      },
      {
        question: "How do I secure the wedding date?",
        answer:
          "Start with the inquiry form. Melissa usually follows up within 24 to 48 hours with availability, a custom quote, and next steps. A 50% non-refundable deposit secures the order date after the quote is approved.",
      },
      {
        question: "Do you deliver wedding cakes?",
        answer:
          "Delivery may be available across Davis, Weber, and Salt Lake Counties depending on the date, location, and order details. Fees are included in the custom quote.",
      },
    ],
  },
  cupcakes: {
    slug: "cupcakes",
    shortTitle: "Cupcakes",
    title: "Custom cupcakes for dessert tables, gifting, and easy-to-serve celebrations.",
    eyebrow: "Custom cupcakes",
    intro:
      "Cupcakes bring custom flavors, colors, piping, and finishing details to showers, birthdays, launch parties, and dessert displays.",
    trustStatement:
      "Made from scratch by Melissa and customized through flavor, color, piping, and finishing details.",
    heroStatement: "A versatile option when you want a coordinated presentation without the formality of a tiered cake.",
    heroImage: {
      src: "/placeholders/marketing/cupcake-set.jpg",
      alt: "Coordinated cupcake set with piped buttercream and polished event styling",
    },
    startingPriceLabel: "$36+",
    pricingNote: "Cupcake orders begin at $36 per dozen.",
    pricingContext:
      "Quotes reflect quantity, decorative finish, toppers, and whether the order is part of a larger dessert spread.",
    availabilityNote: "Most cupcake orders need about 2 weeks notice and begin with a one-dozen minimum.",
    detailBullets: [
      "Minimum order is 1 dozen.",
      "Most cupcake orders need about 2 weeks notice.",
      "Flavor pairings, tonal buttercream palettes, and topper notes can be customized to the event.",
      "Cupcakes can be added to cake and wedding inquiries when you want a coordinated dessert table.",
    ],
    faq: [
      {
        question: "What is the minimum order?",
        answer: "Custom cupcake orders begin at 1 dozen.",
      },
      {
        question: "What flavors are available?",
        answer:
          "Vanilla, chocolate, red velvet, lemon, strawberry, and funfetti are regular favorites, and custom flavors may be available on request.",
      },
      {
        question: "Can cupcakes be customized?",
        answer:
          "Yes. Custom decorations and toppers are available so the dozen matches the event theme or color palette.",
      },
      {
        question: "Are cupcakes available for pickup and delivery?",
        answer:
          "Cupcakes are available for local pickup in Centerville. Delivery may be available across Davis, Weber, and Salt Lake Counties depending on the date, distance, and order details. The Sweet Fork does not currently ship cupcakes.",
      },
    ],
  },
  "sugar-cookies": {
    slug: "sugar-cookies",
    shortTitle: "Sugar Cookies",
    title: "Decorated sugar cookies designed for favors, gifting, and dessert tables.",
    eyebrow: "Decorated sugar cookies",
    intro:
      "Buttercream sugar cookies are planned around your colors, theme, shapes, and packaging needs for showers, birthdays, favors, and welcome boxes.",
    trustStatement:
      "Melissa designs each buttercream cookie set around your colors, theme, quantity, and event.",
    heroStatement: "Ideal for custom themes, favor sets, and coordinated dessert-table details.",
    heroImage: {
      src: "/placeholders/marketing/cookie-favors.jpg",
      alt: "Decorated sugar cookie favors arranged for gifting and dessert-table styling",
    },
    startingPriceLabel: "$48+",
    pricingNote: "Decorated sugar cookies begin at $48 per dozen.",
    pricingContext:
      "Quotes depend on detail level, number of shapes, packaging direction, and whether the set is part of a broader order.",
    availabilityNote: "Most cookie orders need about 2 weeks notice, especially for themed sets and favor packaging.",
    detailBullets: [
      "Cookie orders are designed by the dozen, with custom themes, shapes, and event palettes available.",
      "More intricate work, favor-ready assortments, and layered design sets are quoted by complexity.",
      "Sharing your date, quantity by the dozen, theme or color palette, and any packaging or favor needs helps shape an accurate quote.",
      "Most cookie orders need about 2 weeks notice.",
    ],
    faq: [
      {
        question: "What flavors are available?",
        answer: "Classic sugar and almond sugar are available.",
      },
      {
        question: "Can you do custom shapes and themes?",
        answer: "Yes. Custom shapes and designs are available for each order.",
      },
      {
        question: "How is cookie pricing set?",
        answer:
          "Simple custom designs start at $48 per dozen, while more detailed work is priced by complexity.",
      },
      {
        question: "Can you ship cookies, or is it pickup and delivery?",
        answer:
          "Decorated cookies are made for local pickup in Centerville. Delivery may be available across Davis, Weber, and Salt Lake Counties depending on the date, distance, and order details. The Sweet Fork does not currently ship cookies.",
      },
    ],
  },
  macarons: {
    slug: "macarons",
    shortTitle: "Macarons",
    title: "Custom macarons for gifting, dessert tables, and celebration assortments.",
    eyebrow: "Custom macarons",
    intro:
      "Macarons bring color, flavor, and a giftable finish to showers, weddings, dessert tables, and celebration spreads.",
    trustStatement:
      "Melissa prepares macarons in small batches, with custom colors, flavors, and presentation planned for your celebration.",
    heroStatement: "Prepared in small batches and planned around your chosen palette, flavor mix, and presentation.",
    heroImage: {
      src: "/placeholders/marketing/macaron-tower.jpg",
      alt: "Pastel macaron tower styled for a refined celebration dessert display",
    },
    startingPriceLabel: "$30+",
    pricingNote: "Macaron orders begin at $30 per dozen.",
    pricingContext:
      "Quotes reflect quantity, color customization, flavor mix, and whether the order is paired with other desserts.",
    availabilityNote: "Most macaron orders need about 2 weeks notice and begin with a one-dozen minimum.",
    detailBullets: [
      "Minimum order is 1 dozen, available as assorted or single flavors.",
      "Assortments suit gift boxes, dessert tables, and party favors for showers, weddings, and local events.",
      "Most macaron orders need about 2 weeks notice.",
      "Custom colors and flavor pairings can be discussed for weddings, gifting, and coordinated dessert displays.",
    ],
    faq: [
      {
        question: "Is there a minimum order?",
        answer: "Yes. Custom macaron orders begin at 1 dozen.",
      },
      {
        question: "What flavors are available?",
        answer:
          "Core flavors include vanilla, chocolate, raspberry, lemon, salted caramel, pistachio, and lavender, with seasonal and custom flavors offered when availability allows. Share your preferences in your inquiry and The Sweet Fork will confirm what's available for your date.",
      },
      {
        question: "Can macarons be customized?",
        answer:
          "Yes. Color palettes and flavor mixes can be customized for the order when availability allows.",
      },
      {
        question: "Are macarons available for pickup and delivery?",
        answer:
          "Macarons are available for local pickup in Centerville. Delivery may be available across Davis, Weber, and Salt Lake Counties depending on the date, distance, and order details. The Sweet Fork does not currently ship macarons.",
      },
    ],
  },
  "diy-kits": {
    slug: "diy-kits",
    shortTitle: "DIY Kits",
    title: "DIY cookie decorating kits for parties, gifting, and at-home celebrations.",
    eyebrow: "DIY decoration kits",
    intro:
      "Available year-round, these cookie decorating kits are prepared for family nights, classrooms, party activities, vendor events, and giftable celebrations.",
    trustStatement:
      "Prepared by Melissa for local pickup or delivery, with cookies, frosting bags, sprinkles, and decorating instructions included.",
    heroStatement: "A ready-to-decorate activity for birthdays, holidays, vendor booths, classrooms, and group gatherings.",
    heroImage: {
      src: "/placeholders/marketing/diy-kit.jpg",
      alt: "DIY cookie decorating kit with cookies, frosting bags, sprinkles, and decorating instructions.",
    },
    startingPriceLabel: "$25+",
    pricingNote: "DIY kits begin at $25 each.",
    pricingContext:
      "Quotes depend on kit size, seasonal themes, add-ons, and how many kits you need prepared together.",
    availabilityNote: "DIY kits are available year-round. Most kit orders need about 2 weeks notice, with extra lead time helpful around holidays and busy event weekends.",
    detailBullets: [
      "Each kit includes cookies, frosting bags, sprinkles, and decorating instructions.",
      "DIY kits work especially well for parties, family activities, farmers markets, vendor events, and holiday gifting.",
      "Offered year-round, kits travel well to markets and pop-ups — ask about larger batches and local pickup for your booth or party.",
      "Custom themes and color stories can be discussed when timing allows.",
    ],
    faq: [
      {
        question: "What is included?",
        answer: "Each kit includes cookies, frosting bags, sprinkles, and decorating instructions.",
      },
      {
        question: "Are kits good for groups or parties?",
        answer: "Yes. DIY kits are designed for family fun, parties, classrooms, and celebrations.",
      },
      {
        question: "Are DIY kits seasonal or available year-round?",
        answer:
          "DIY kits are available year-round, not only around holidays. They are a favorite for farmers markets, vendor events, classrooms, and family activities, and larger batches can be arranged with enough notice.",
      },
      {
        question: "How far ahead should I order?",
        answer: "Most kit orders need about 2 weeks notice, with a little more around holidays and busy event weekends.",
      },
    ],
  },
};

export const homeExperiencePillars = [
  {
    title: "Made from scratch by Melissa",
    description: "Melissa prepares each order from scratch and stays involved from the first design notes through the final finish.",
  },
  {
    title: "Designed for your event",
    description: "Colors, flavors, servings, piping, and presentation are planned around the specific celebration.",
  },
  {
    title: "Centerville pickup + local delivery",
    description:
      "Pickup is in Centerville, with select delivery across Davis, Weber, and Salt Lake Counties when the date and order details allow. The Sweet Fork does not ship desserts.",
  },
];

export const processSteps = [
  {
    step: "01",
    title: "Share the celebration",
    description: "Share your event, date, dessert needs, guest count, pickup or delivery preference, and inspiration in one guided inquiry.",
  },
  {
    step: "02",
    title: "Melissa reviews the details",
    description: "Melissa checks the date against her production calendar and usually follows up within 24 to 48 hours with availability, a custom quote, and next steps.",
  },
  {
    step: "03",
    title: "Reserve the date",
    description: "Once the quote is approved, a 50% non-refundable deposit secures the date. Final design and pickup or delivery details are coordinated before the celebration.",
  },
];

export const galleryItems: GalleryItem[] = [
  {
    id: "gal-01",
    title: "Tiered wedding cake",
    category: "wedding-cake",
    alt: "Tall ivory wedding cake with refined piping and soft floral detail",
  },
  {
    id: "gal-02",
    title: "Floral celebration cake",
    category: "custom-cake",
    alt: "Floral buttercream celebration cake with soft garden tones and an ivory finish",
  },
  {
    id: "gal-03",
    title: "Macaron arrangement",
    category: "macarons",
    alt: "Elevated macaron arrangement in blush, cream, and champagne tones",
  },
  {
    id: "gal-04",
    title: "Decorated cookie favors",
    category: "sugar-cookies",
    alt: "Decorated sugar cookies styled as boutique event favors on a soft ivory surface",
  },
  {
    id: "gal-05",
    title: "Cupcake assortment",
    category: "cupcakes",
    alt: "Curated cupcake assortment with tonal buttercream finishes in ivory, blush, and soft gold",
  },
  {
    id: "gal-06",
    title: "DIY cookie decorating kit",
    category: "diy-kit",
    alt: "Cookie decorating kit arranged with frosted cookies, piping bags, and sprinkles",
  },
];

export const pricingHighlights = [
  {
    label: "Celebration Cakes",
    value: "Starting at $80",
    note: "A starting point for birthdays, showers, and milestone gatherings.",
  },
  {
    label: "Wedding Cakes",
    value: "Starting at $300",
    note: "Quoted around servings, structure, finish complexity, and venue logistics.",
  },
  {
    label: "Treats & Confections",
    value: "Starting at $25",
    note: "Cupcakes, macarons, cookies, and kits are available by inquiry and quoted around quantity and design details.",
  },
];

export const faqItems = [
  {
    question: "How far in advance should I order?",
    answer:
      "Custom cakes and treats need a minimum of 2 weeks notice. Wedding cakes usually need 4 to 6 weeks, and busy seasons are best booked even earlier.",
  },
  {
    question: "Do you accept rush orders?",
    answer:
      "Rush orders may be accommodated with less than 2 weeks notice, subject to availability, and can include a rush fee of up to 25%.",
  },
  {
    question: "How do I place an order?",
    answer:
      "Start with the online inquiry form. Melissa usually follows up within 24 to 48 hours with availability, a custom quote, and next steps. Submitting an inquiry does not reserve the date; a 50% non-refundable deposit secures it after the quote is approved.",
  },
  {
    question: "How much do custom cakes cost?",
    answer:
      "Custom cakes start at $80 for celebration cakes and $300 for wedding cakes. Final pricing depends on size, design complexity, and customizations.",
  },
  {
    question: "What forms of payment do you accept?",
    answer:
      "Venmo, Square, and cash are accepted. A 50% deposit is required to secure the order, and the remaining balance is due before pickup or delivery.",
  },
  {
    question: "Is the deposit refundable?",
    answer:
      "Deposits are non-refundable. If an order is cancelled more than 14 days before pickup or delivery, payments beyond the deposit may be applied as a future-order credit. Cancellations within 14 days do not receive refunds or credits.",
  },
  {
    question: "Where are you located?",
    answer:
      "The Sweet Fork is based in Centerville, Utah. Pickup is available from the bakery location, and the pickup address is shared after booking.",
  },
  {
    question: "Do you deliver?",
    answer:
      "Delivery may be available across Davis, Weber, and Salt Lake Counties depending on the date, distance, and order details. Baked goods are available for local pickup or delivery only; The Sweet Fork does not currently ship desserts.",
  },
  {
    question: "Can you recreate a cake I saw online?",
    answer:
      "Inspiration photos and links are welcome, but Melissa uses them as a starting point rather than copying another baker's design exactly.",
  },
  {
    question: "What flavors do you offer?",
    answer:
      "Available flavors include vanilla, chocolate, red velvet, lemon, strawberry, funfetti, carrot, almond, and coconut, with some custom flavors available on request.",
  },
  {
    question: "Can you accommodate dietary restrictions?",
    answer:
      "Some dietary needs can be discussed, but everything is made in a home kitchen that processes common allergens, so allergen-free products cannot be guaranteed.",
  },
  {
    question: "Are you a licensed bakery?",
    answer:
      "The Sweet Fork is an owner-operated home bakery in Centerville, where Melissa prepares each custom order in her home kitchen. Orders are managed through custom quotes, deposits, scheduled pickup, and local delivery when available. The Sweet Fork operates under Utah's Home Consumption and Homemade Food Act in a home kitchen that is not subject to state food service licensing or inspection.",
  },
  {
    question: "How many orders do you take per week?",
    answer:
      "Melissa carefully manages the production calendar so each confirmed order receives focused design and production time. Weekly capacity varies with the size and detail of the orders already booked.",
  },
  {
    question: "Do you offer tastings?",
    answer:
      "There are no in-person tastings right now, but curated wedding tasting boxes may be available for an additional fee.",
  },
];

export const testimonials = [
  {
    quote: "This cake was genuinely one of the best cakes I’ve ever ordered. First off, it was fluffy... The buttercream icing was the perfect balance... Now, let’s talk about the design: absolutely stunning.",
    name: "Tanya",
    context: "Google Review",
  },
  {
    quote: "Sweet Fork has the best cake ever. The cake was so delicious and the decor was amazing. I will use Sweet Fork from now on.",
    name: "Crystal",
    context: "Google Review",
  },
  {
    quote: "Melissa absolutely knocked our socks off! She had the fastest turnaround and created such delicious cookies and mini cupcakes that were almost too beautiful to eat.",
    name: "Sarah",
    context: "Google Review",
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
    startingAt: "$80",
    rule: "Single tier, about 10 to 20 servings",
    leadTime: "2 weeks",
  },
  {
    product: "Wedding Cakes",
    startingAt: "$300",
    rule: "Consultation required",
    leadTime: "4-6 weeks",
  },
  {
    product: "Cupcakes",
    startingAt: "$36",
    rule: "Per dozen",
    leadTime: "About 2 weeks",
  },
  {
    product: "Sugar Cookies",
    startingAt: "$48",
    rule: "Per dozen, simple designs",
    leadTime: "2 weeks",
  },
  {
    product: "Macarons",
    startingAt: "$30",
    rule: "Per dozen",
    leadTime: "About 2 weeks",
  },
  {
    product: "DIY Kits",
    startingAt: "$25",
    rule: "Per kit",
    leadTime: "About 2 weeks",
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
    summary: "Custom cakes starting at $80 for birthdays, milestones, and celebrations.",
  },
  {
    value: "wedding-cake",
    label: "Wedding Cake",
    summary: "Wedding cakes starting at $300, usually with 4 to 6 weeks notice.",
  },
  {
    value: "cupcakes",
    label: "Cupcakes",
    summary: "Cupcakes starting at $36 per dozen.",
  },
  {
    value: "sugar-cookies",
    label: "Sugar Cookies",
    summary: "Decorated sugar cookies starting at $48 per dozen.",
  },
  {
    value: "macarons",
    label: "Macarons",
    summary: "Macarons starting at $30 per dozen.",
  },
  {
    value: "diy-kit",
    label: "DIY Kit",
    summary: "DIY decorating kits starting at $25.",
  },
];

export const termsSections = [
  {
    title: "Allergen notice",
    points: [
      "All products are prepared in a home kitchen that processes common allergens including wheat, eggs, milk, soy, tree nuts, and peanuts. Cross-contamination is possible.",
      "Customers with severe allergies should contact The Sweet Fork before ordering.",
    ],
  },
  {
    title: "Ordering and lead time",
    points: [
      "Submitting an inquiry does not reserve a date or create a confirmed order.",
      "Custom orders require a minimum of 2 weeks notice.",
      "Wedding cakes usually require 4 to 6 weeks notice.",
      "Rush orders may be accepted with less notice, subject to availability, and can include a rush fee of up to 25%.",
      "Holiday and peak-season orders should be placed well in advance.",
    ],
  },
  {
    title: "Payment terms",
    points: [
      "A 50% non-refundable deposit is required to secure the order date.",
      "The remaining balance is due no later than the day before pickup or delivery.",
      "Venmo, Square, and cash are accepted.",
      "Quoted pricing is honored after the deposit is received, but future menu pricing can change without notice.",
    ],
  },
  {
    title: "Cancellations and refunds",
    points: [
      "Deposits are non-refundable because they reserve the date and cover preparation costs.",
      "If an order is cancelled more than 14 days before pickup or delivery, payments beyond the deposit may be offered as a future-order credit.",
      "Cancellations within 14 days of pickup or delivery do not receive refunds or credits.",
      "Quality concerns must be reported within 24 hours, and the product or a significant portion must be returned for evaluation.",
    ],
  },
  {
    title: "Pickup, delivery, and storage",
    points: [
      "Pickup is available from Centerville at no charge, and customers are responsible for safe transport after pickup.",
      "Delivery may be available across Davis, Weber, and Salt Lake Counties depending on the date, distance, and order details, with fees included in the quote.",
      "Once a pickup order leaves the bakery, or a delivered order is accepted, The Sweet Fork is no longer responsible for damage.",
      "Most custom cakes should stay refrigerated until 1 to 2 hours before serving for the best flavor and texture.",
    ],
  },
  {
    title: "Design expectations",
    points: [
      "Inspiration photos are welcome, but exact replicas are not offered.",
      "Color matching is approximate because screens, printed references, and food coloring can vary.",
      "The Sweet Fork reserves the right to decline an order that does not align with bakery capabilities or values.",
    ],
  },
  {
    title: "Non-edible items and photography",
    points: [
      "Some custom orders can include dowels, wires, toppers, ribbons, or other non-edible support pieces that must be removed before serving.",
      "The Sweet Fork may photograph finished work and use the images for website, social, or portfolio marketing.",
    ],
  },
  {
    title: "Utah home bakery status",
    points: [
      "The Sweet Fork operates under Utah's Home Consumption and Homemade Food Act.",
      "Products are made in a home kitchen that is not subject to state food service licensing or inspection and are not for resale.",
    ],
  },
];

export const privacySections = [
  {
    title: "Effective date",
    points: [
      "This privacy overview is effective July 2, 2026.",
    ],
  },
  {
    title: "Information collected with an inquiry",
    points: [
      "The website collects the contact details, event information, product selections, design notes, budget details, and other information entered into the inquiry form.",
      "If inspiration links or written notes are submitted, those references are stored with the inquiry so the request can be reviewed accurately.",
    ],
  },
  {
    title: "How inquiry details are used",
    points: [
      "Submitted information is used to review availability, prepare quotes, coordinate pickup or delivery, and manage the order from inquiry through fulfillment.",
      "Preferred contact details are used so The Sweet Fork can follow up about the request and any confirmed order.",
    ],
  },
  {
    title: "Website analytics",
    points: [
      "The Sweet Fork uses Google Analytics 4 to understand site performance, popular pages, and the inquiry journey so the website can be improved for local customers.",
      "Google Analytics may use cookies or similar technologies to collect general technical and usage information such as page views, broad interaction events, browser or device information, and approximate traffic patterns.",
      "Customer inquiry details such as names, email addresses, phone numbers, delivery ZIP codes, exact event dates, free-form inquiry notes, inspiration links, and internal order or inquiry identifiers are not intentionally sent to Google Analytics.",
      "Analytics is used for first-party site measurement and inquiry-funnel improvement. The Sweet Fork does not currently use Google Analytics for personalized advertising, remarketing, Google Ads audiences, Meta Pixel tracking, or cross-site behavioral advertising.",
    ],
  },
  {
    title: "Cookie and analytics controls",
    points: [
      "Customers can control cookies through their browser settings and can use Google's Analytics opt-out browser add-on if they prefer not to be measured by Google Analytics.",
    ],
  },
  {
    title: "Order records and follow-up",
    points: [
      "Inquiry details can be retained with the customer and order record for scheduling, repeat-order history, accounting, and customer service follow-up.",
      "If an order moves forward, payment and fulfillment details may also be recorded alongside the inquiry.",
    ],
  },
  {
    title: "Questions about your information",
    points: [
      "Customers who need to update an inquiry or ask about stored order details can contact The Sweet Fork directly by phone or email.",
    ],
  },
];
