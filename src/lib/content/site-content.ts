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
    title: "Custom cakes designed with a polished, boutique finish for milestone celebrations.",
    eyebrow: "Custom Cakes",
    intro:
      "Every cake is designed around your gathering, guest count, and overall mood, then finished with the refined details that make a celebration feel considered.",
    heroStatement: "Handcrafted in Centerville with limited weekly availability for custom work.",
    startingPriceLabel: "$80+",
    pricingNote: "Celebration cakes begin at $80.",
    pricingContext:
      "Final quotes reflect servings, tier count, finish complexity, and any delivery coordination.",
    availabilityNote: "Most custom cakes need at least 2 weeks notice, and peak weekends can book earlier.",
    detailBullets: [
      "Single-tier celebration cakes are a strong fit for birthdays, showers, and smaller gatherings.",
      "Tiered cakes can be designed for larger celebrations when you need more servings or a stronger visual centerpiece.",
      "Inspiration is welcome, but each design is interpreted through The Sweet Fork style rather than copied exactly.",
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
    title: "Wedding cakes with an elegant, tailored presence for Northern Utah celebrations.",
    eyebrow: "Wedding cakes",
    intro:
      "Each wedding cake is quoted around your guest count, floral or styling direction, and the role the cake plays within the overall dessert presentation.",
    heroStatement: "Designed as a focal point, with companion desserts available through the same inquiry.",
    startingPriceLabel: "$300+",
    pricingNote: "Wedding cakes begin at $300.",
    pricingContext:
      "Your quote is shaped by servings, structure, finish complexity, venue logistics, and delivery needs.",
    availabilityNote: "Wedding inquiries are best submitted 4 to 6 weeks ahead, with earlier booking recommended for peak dates.",
    detailBullets: [
      "Wedding cakes are available as statement centerpieces or as part of a larger dessert table with coordinated companion sweets.",
      "Delivery is available across Davis, Salt Lake, and nearby Weber County communities when timing and setup require it.",
      "The earlier the inquiry comes in, the more room there is to align date, design direction, and display planning.",
    ],
    faq: [
      {
        question: "Do you offer tastings?",
        answer:
          "The Sweet Fork does not currently offer in-person tastings, but curated wedding tasting boxes may be available for an additional fee.",
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
    title: "Custom cupcakes for polished dessert tables, gifting, and easy-to-serve celebrations.",
    eyebrow: "Custom cupcakes",
    intro:
      "Cupcakes bring the same custom color story and handmade finish to showers, birthdays, launch parties, and dessert displays.",
    heroStatement: "A versatile option when you want a refined presentation without the formality of a tiered cake.",
    startingPriceLabel: "$36+",
    pricingNote: "Cupcake orders begin at $36 per dozen.",
    pricingContext:
      "Quotes reflect quantity, decorative finish, toppers, and whether the order is part of a larger dessert spread.",
    availabilityNote: "Most cupcake orders need 1 to 2 weeks notice and begin with a one-dozen minimum.",
    detailBullets: [
      "Minimum order is 1 dozen.",
      "Most cupcake orders need 1 to 2 weeks notice.",
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
    ],
  },
  "sugar-cookies": {
    slug: "sugar-cookies",
    shortTitle: "Sugar Cookies",
    title: "Decorated sugar cookies styled for favors, gifting, and elevated dessert tables.",
    eyebrow: "Decorated sugar cookies",
    intro:
      "Buttercream sugar cookies are designed to feel polished and personal, whether they are headed to a shower, a birthday table, or an event welcome box.",
    heroStatement: "Ideal for custom themes, favor sets, and coordinated dessert-table details.",
    startingPriceLabel: "$48+",
    pricingNote: "Decorated sugar cookies begin at $48 per dozen.",
    pricingContext:
      "Quotes depend on detail level, number of shapes, packaging direction, and whether the set is part of a broader order.",
    availabilityNote: "Most cookie orders need about 2 weeks notice, especially for themed sets and favor packaging.",
    detailBullets: [
      "Cookie orders are designed by the dozen, with custom themes, shapes, and event palettes available.",
      "More intricate work, favor-ready assortments, and layered design sets are quoted by complexity.",
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
    ],
  },
  macarons: {
    slug: "macarons",
    shortTitle: "Macarons",
    title: "Custom macarons for gifting, dessert tables, and refined party orders.",
    eyebrow: "Custom macarons",
    intro:
      "Macarons bring a polished, giftable finish to showers, weddings, dessert tables, and modern celebration spreads.",
    heroStatement: "Handcrafted with classic technique and tailored around your chosen palette and flavor mix.",
    startingPriceLabel: "$30+",
    pricingNote: "Macaron orders begin at $30 per dozen.",
    pricingContext:
      "Quotes reflect quantity, color customization, flavor mix, and whether the order is paired with other desserts.",
    availabilityNote: "Most macaron orders need 1 to 2 weeks notice and begin with a one-dozen minimum.",
    detailBullets: [
      "Minimum order is 1 dozen, available as assorted or single flavors.",
      "Most macaron orders need 1 to 2 weeks notice.",
      "Custom colors and flavor pairings can be discussed for weddings, gifting, and curated dessert styling.",
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
    title: "DIY decorating kits for hosted activities, gifting, and sweet-at-home celebrations.",
    eyebrow: "DIY decoration kits",
    intro:
      "These all-inclusive kits are designed for family nights, classroom treats, party activities, and giftable sweet moments that still feel beautifully put together.",
    heroStatement: "An easy way to bring the Sweet Fork aesthetic into birthdays, holidays, and group activities.",
    startingPriceLabel: "$25+",
    pricingNote: "DIY kits begin at $25 each.",
    pricingContext:
      "Quotes depend on kit size, seasonal themes, add-ons, and how many kits you need prepared together.",
    availabilityNote: "Most kit orders need 1 to 2 weeks notice, especially around holidays and school-event weekends.",
    detailBullets: [
      "Each kit is assembled to feel complete and ready to use right away.",
      "DIY kits work especially well for parties, classroom treats, and holiday gifting.",
      "Seasonal themes and color stories can be discussed when timing allows.",
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
    title: "Handcrafted in small batches",
    description: "Each order is made from scratch with the kind of restraint and finish that feels personal, not mass produced.",
  },
  {
    title: "Limited weekly availability",
    description: "Weekly order volume stays intentionally limited so every cake, dessert table, and pickup window receives close attention.",
  },
  {
    title: "Serving Northern Utah",
    description:
      "Based in Centerville, with pickup available locally and delivery offered across Davis, Salt Lake, and nearby Weber County communities.",
  },
];

export const processSteps = [
  {
    step: "01",
    title: "Share the celebration",
    description: "Tell us about the event, timing, dessert mix, and overall design direction in one guided inquiry.",
  },
  {
    step: "02",
    title: "Receive your quote",
    description: "The Sweet Fork reviews availability and usually replies within 24 to 48 hours with a tailored quote and next steps.",
  },
  {
    step: "03",
    title: "Reserve the date",
    description: "Once the quote is approved, a deposit secures the date and the order moves into production planning.",
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
    title: "Premium DIY cookie kit",
    category: "diy-kit",
    alt: "Cookie decorating kit arranged with frosted cookies, piping bags, and sprinkles",
  },
];

export const pricingHighlights = [
  {
    label: "Celebration Cakes",
    value: "Starting at $80",
    note: "A polished starting point for birthdays, showers, and milestone gatherings.",
  },
  {
    label: "Wedding Cakes",
    value: "Starting at $300",
    note: "Quoted around servings, structure, finish complexity, and venue logistics.",
  },
  {
    label: "Treats & Confections",
    value: "Starting at $25",
    note: "Cupcakes, macarons, cookies, and kits are all available by inquiry for a more custom fit.",
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
      "There are no in-person tastings right now, but curated wedding tasting boxes may be available for an additional fee.",
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
