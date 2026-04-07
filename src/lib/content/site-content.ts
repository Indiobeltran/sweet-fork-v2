import type { GalleryItem, ProductPageContent, ProductType } from "@/types/domain";

export const siteConfig = {
  name: "The Sweet Fork",
  description:
    "Custom cakes, wedding cakes, cupcakes, macarons, and decorated cookies made to order in Centerville, Utah. Artisan quality, limited availability.",
  phone: "(801) 739-4168",
  email: "thesweetfork@yahoo.com",
  instagram: "the_sweet_fork",
  location: "Centerville, Utah",
};

export const mainNavigation = [
  { href: "/", label: "Home" },
  { href: "/custom-cakes", label: "Custom Cakes" },
  { href: "/wedding-cakes", label: "Wedding Cakes" },
  { href: "/gallery", label: "Gallery" },
  { href: "/pricing", label: "Pricing" },
  { href: "/how-to-order", label: "How to Order" },
  { href: "/about", label: "About" },
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
    title: "Custom cakes made to order for birthdays, weddings, and celebrations",
    eyebrow: "Our signature",
    intro:
      "Every cake is a one-of-a-kind creation, designed and crafted specifically for your celebration.",
    heroStatement:
      "Starting at $80 for celebration cakes, with two weeks notice for most orders.",
    detailBullets: [
      "Birthday and celebration cakes start at $80 for single-tier cakes serving about 10 to 20 guests.",
      "Two-tier cakes start at $150 for 30 to 50 servings, and 3+ tier cakes start at $250 for 60+ servings.",
      "Wedding cakes start at $300 and usually need 4 to 6 weeks notice.",
    ],
    packages: [
      {
        title: "Birthday & Celebration Cakes",
        description:
          "Custom milestone and party cakes start at $80 for a single tier serving roughly 10 to 20 guests.",
      },
      {
        title: "Tiered Cakes",
        description:
          "Two-tier cakes start at $150 for 30 to 50 servings, while three-tier-and-up cakes start at $250 for 60+ servings.",
      },
      {
        title: "Wedding Cakes",
        description:
          "Elegant wedding centerpieces start at $300 and are quoted around servings, design complexity, and delivery needs.",
      },
    ],
    faq: [
      {
        question: "How far in advance should I order?",
        answer:
          "Custom cakes need a minimum of 2 weeks notice. Wedding cakes should be ordered 4 to 6 weeks ahead, and busy-season dates are best booked even earlier.",
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
    ],
  },
  "wedding-cakes": {
    slug: "wedding-cakes",
    shortTitle: "Wedding Cakes",
    title: "Wedding cakes for Northern Utah celebrations",
    eyebrow: "Wedding cakes",
    intro:
      "Wedding cakes are designed as elegant centerpieces for your special day, with room to add cupcakes, macarons, or cookies to the same order.",
    heroStatement:
      "Starting at $300, with 4 to 6 weeks notice recommended.",
    detailBullets: [
      "Wedding cake pricing starts at $300 and depends on servings, structure, design complexity, and delivery.",
      "Most wedding orders need 4 to 6 weeks notice, with earlier booking recommended for peak dates.",
      "Delivery is available across Davis County, Salt Lake County, and nearby Weber County communities, with fees based on location.",
    ],
    packages: [
      {
        title: "Wedding Cake Centerpiece",
        description:
          "Custom wedding cakes start at $300 and are quoted to the guest count, finish, and display plan.",
      },
      {
        title: "Companion Desserts",
        description:
          "Cupcakes, macarons, and decorated sugar cookies can be added to the same inquiry for a coordinated dessert spread.",
      },
    ],
    faq: [
      {
        question: "Do you offer tastings?",
        answer:
          "The Sweet Fork does not currently offer in-person tastings, but wedding sample boxes may be available for an additional fee.",
      },
      {
        question: "How do I secure the wedding date?",
        answer:
          "Start with the inquiry form. A detailed quote is usually sent within 24 to 48 hours, and a 50% non-refundable deposit secures the order date.",
      },
      {
        question: "Do you deliver wedding cakes?",
        answer:
          "Yes. Delivery is available across Davis County, Salt Lake County, and nearby Weber County communities, with fees based on location.",
      },
    ],
  },
  cupcakes: {
    slug: "cupcakes",
    shortTitle: "Cupcakes",
    title: "Custom cupcakes for parties, gifting, and event tables",
    eyebrow: "Custom cupcakes",
    intro:
      "Moist, flavorful cupcakes topped with signature buttercream and finished for birthdays, showers, parties, and events.",
    heroStatement: "Starting at $36 per dozen, with custom decorations and toppers available.",
    detailBullets: [
      "Minimum order is 1 dozen.",
      "Most cupcake orders need 1 to 2 weeks notice.",
      "Vanilla, chocolate, red velvet, lemon, strawberry, and funfetti are regular options, with custom flavors available.",
    ],
    packages: [
      {
        title: "Classic Custom Dozen",
        description:
          "Made-to-order cupcakes start at $36 per dozen for parties, gifting, and easy-serve celebrations.",
      },
      {
        title: "Decorations & Toppers",
        description:
          "Custom decorations, themed colors, and toppers are available for birthdays, showers, and special events.",
      },
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
    ],
  },
  "sugar-cookies": {
    slug: "sugar-cookies",
    shortTitle: "Sugar Cookies",
    title: "Decorated sugar cookies for favors, gifting, and dessert tables",
    eyebrow: "Decorated sugar cookies",
    intro:
      "Hand-decorated buttercream sugar cookies are designed to look beautiful and taste just as good.",
    heroStatement: "Starting at $48 per dozen for simple custom designs.",
    detailBullets: [
      "Cookie orders are priced by the dozen, with custom shapes and themes available.",
      "Simple custom designs start at $48 per dozen, while detailed work is quoted by complexity.",
      "Most cookie orders need about 2 weeks notice.",
    ],
    packages: [
      {
        title: "Simple Custom Dozen",
        description:
          "Decorated sugar cookies start at $48 per dozen for simpler custom sets.",
      },
      {
        title: "Detailed Themed Sets",
        description:
          "More intricate designs, custom shapes, and favor-ready assortments are quoted by complexity.",
      },
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
    ],
  },
  macarons: {
    slug: "macarons",
    shortTitle: "Macarons",
    title: "Custom macarons for dessert tables, gifts, and party orders",
    eyebrow: "Custom macarons",
    intro:
      "Delicate almond meringue cookies with smooth, flavorful fillings, handcrafted using classic techniques.",
    heroStatement: "Starting at $30 per dozen, with a 1 dozen minimum.",
    detailBullets: [
      "Minimum order is 1 dozen, available as assorted or single flavors.",
      "Most macaron orders need 1 to 2 weeks notice.",
      "Flavor options include vanilla, chocolate, raspberry, lemon, salted caramel, pistachio, lavender, and custom flavors.",
    ],
    packages: [
      {
        title: "Custom Macarons",
        description:
          "Macarons start at $30 per dozen for made-to-order assortments or single-flavor sets.",
      },
      {
        title: "Flavor & Color Customization",
        description:
          "Custom colors and flavor pairings can be discussed for parties, gifting, and dessert-table styling.",
      },
    ],
    faq: [
      {
        question: "Is there a minimum order?",
        answer: "Yes. Custom macaron orders begin at 1 dozen.",
      },
      {
        question: "What flavors are available?",
        answer:
          "Vanilla, chocolate, raspberry, lemon, salted caramel, pistachio, lavender, and custom flavors are available.",
      },
      {
        question: "Can macarons be customized?",
        answer:
          "Yes. Color palettes and flavor mixes can be tailored to the order when availability allows.",
      },
    ],
  },
  "diy-kits": {
    slug: "diy-kits",
    shortTitle: "DIY Kits",
    title: "DIY decoration kits for family nights, parties, and seasonal gifting",
    eyebrow: "DIY decoration kits",
    intro:
      "All-inclusive decorating kits make it easy to create edible masterpieces at home, in classrooms, or at parties.",
    heroStatement: "Starting at $25 per kit, with 1 to 2 weeks notice for most orders.",
    detailBullets: [
      "DIY decoration kits start at $25 per kit.",
      "Most kit orders need 1 to 2 weeks notice.",
      "Each kit is designed to include what you need to decorate at home.",
    ],
    packages: [
      {
        title: "Sweet Starter Kit",
        description: "A smaller all-in-one decorating kit for a family activity, gift, or casual celebration.",
      },
      {
        title: "Sweet Party Kit",
        description: "A larger kit built for parties, classrooms, and shared decorating.",
      },
      {
        title: "Sweet Celebration Kit",
        description: "A celebration-ready kit for birthdays, holidays, and special gatherings.",
      },
    ],
    faq: [
      {
        question: "What is included?",
        answer: "Each kit is designed to be all-inclusive, so you have what you need to decorate at home.",
      },
      {
        question: "Are kits good for groups or parties?",
        answer: "Yes. DIY kits are designed for family fun, parties, classrooms, and celebrations.",
      },
      {
        question: "How far ahead should I order?",
        answer: "Most kit orders need 1 to 2 weeks notice.",
      },
    ],
  },
};

export const homeExperiencePillars = [
  {
    title: "Made from scratch",
    description: "Every order is handcrafted with quality ingredients and no mass-production shortcuts.",
  },
  {
    title: "Limited weekly availability",
    description: "The Sweet Fork typically accepts 6 to 7 custom cake orders per week to keep quality personal and consistent.",
  },
  {
    title: "Serving Northern Utah",
    description:
      "Based in Centerville with pickup available and delivery offered across Davis County, Salt Lake County, and nearby Weber County communities.",
  },
];

export const processSteps = [
  {
    step: "01",
    title: "Submit the inquiry",
    description: "Share the event, date, servings, pickup or delivery needs, and the desserts you are considering.",
  },
  {
    step: "02",
    title: "Receive the quote",
    description: "The Sweet Fork reviews the request and usually replies within 24 to 48 hours with a detailed quote.",
  },
  {
    step: "03",
    title: "Reserve the date",
    description: "Once the quote is approved, a 50% deposit secures the order and production details move forward.",
  },
];

export const galleryItems: GalleryItem[] = [
  {
    id: "gal-01",
    title: "Vintage heart birthday cake",
    category: "custom-cake",
    alt: "Vintage heart-shaped birthday cake with piped buttercream",
    placeholderKey: "wedding-tier",
  },
  {
    id: "gal-02",
    title: "Floral celebration cake",
    category: "custom-cake",
    alt: "Custom celebration cake with floral buttercream details",
    placeholderKey: "garden-cake",
  },
  {
    id: "gal-03",
    title: "Holiday macaron assortment",
    category: "macarons",
    alt: "Custom macarons arranged in a seasonal assortment",
    placeholderKey: "macaron-tower",
  },
  {
    id: "gal-04",
    title: "Strawberry sugar cookie set",
    category: "sugar-cookies",
    alt: "Decorated strawberry-themed sugar cookies",
    placeholderKey: "cookie-favors",
  },
  {
    id: "gal-05",
    title: "Color-themed cupcakes",
    category: "cupcakes",
    alt: "Custom cupcakes arranged in a coordinated event palette",
    placeholderKey: "cupcake-set",
  },
  {
    id: "gal-06",
    title: "Valentine's DIY kit",
    category: "diy-kit",
    alt: "DIY cookie decorating kit packaged for a holiday activity",
    placeholderKey: "diy-kit",
  },
];

export const pricingHighlights = [
  {
    label: "Custom Cakes",
    value: "Starting at $80",
    note: "Birthday and celebration cakes start at $80 for smaller single-tier orders serving about 10 to 20 guests.",
  },
  {
    label: "Wedding Cakes",
    value: "Starting at $300",
    note: "Wedding cakes start at $300 and are quoted around servings, structure, design complexity, and delivery.",
  },
  {
    label: "Treats & Confections",
    value: "Starting at $25",
    note: "Cupcakes start at $36 per dozen, macarons at $30 per dozen, sugar cookies at $48 per dozen, and DIY kits at $25.",
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
      "Start with the online inquiry form. The Sweet Fork usually replies within 24 to 48 hours with a detailed quote, and a 50% deposit secures the date.",
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
      "Yes. Delivery is available across Davis County, Salt Lake County, and nearby Weber County communities, with fees based on location.",
  },
  {
    question: "Can you recreate a cake I saw online?",
    answer:
      "Inspiration photos are welcome, but they are used as a starting point rather than copied exactly. Each design is interpreted in The Sweet Fork's style.",
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
      "The Sweet Fork operates under Utah's Home Consumption and Homemade Food Act in a dedicated home kitchen that is not subject to state food service licensing or inspection.",
  },
  {
    question: "How many orders do you take per week?",
    answer:
      "The Sweet Fork typically limits custom cake orders to about 6 to 7 per week so each client and event receives full attention.",
  },
  {
    question: "Do you offer tastings?",
    answer:
      "There are no in-person tastings right now, but wedding sample boxes may be available for an additional fee.",
  },
];

export const testimonials = [
  {
    quote:
      "The cake was absolutely stunning and tasted even better than it looked. Every detail was perfect.",
    name: "Sarah M.",
    context: "Bountiful",
  },
  {
    quote:
      "Worth every penny. The level of artistry and attention to detail is unmatched.",
    name: "Jennifer L.",
    context: "Farmington",
  },
  {
    quote:
      "Our wedding cake was a showstopper. Guests are still talking about it months later.",
    name: "Amanda & Ryan",
    context: "Salt Lake City",
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
    leadTime: "1-2 weeks",
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
    leadTime: "1-2 weeks",
  },
  {
    product: "DIY Kits",
    startingAt: "$25",
    rule: "Per kit",
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
      "Delivery is available across Davis County, Salt Lake County, and nearby Weber County communities, with fees based on location.",
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
    title: "Information collected with an inquiry",
    points: [
      "The website collects the contact details, event information, product selections, design notes, budget details, and other information entered into the inquiry form.",
      "If inspiration links or images are submitted, those references are stored with the inquiry so the order can be reviewed accurately.",
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
