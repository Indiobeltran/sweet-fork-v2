// These mappings are for staging-only AI placeholder assets until real photography
// or explicitly approved production replacements are available.
export type PublicImageSlot = {
  key: string;
  page: string;
  section: string;
  slot: string;
  placeholderKey: string;
  relativePath: string;
  subject: string;
  aspectRatio: string;
  width: number;
  height: number;
  tone: string;
  replaceWithRealPhotography: boolean;
  prompt: string;
};

export const publicImageSlotInventory: PublicImageSlot[] = [
  {
    key: "home-gallery-feature-wedding-tier",
    page: "Home + Gallery",
    section: "Gallery grid fallback",
    slot: "Feature cake card",
    placeholderKey: "wedding-tier",
    relativePath: "placeholders/marketing/wedding-tier.jpg",
    subject: "Tall editorial wedding cake with refined piping and soft floral detail",
    aspectRatio: "4:5 portrait",
    width: 1536,
    height: 1920,
    tone:
      "Warm ivory backdrop, soft natural window light, premium boutique bakery styling, clean composition, no props with visible branding.",
    replaceWithRealPhotography: true,
    prompt:
      "Premium boutique bakery editorial photo of a tall white wedding cake with refined piping, subtle floral accents, and elegant texture, warm ivory and cream palette, soft natural window light, luxury Instagram feel, clean seamless background, high-end dessert photography, centered composition, realistic buttercream detail, no text, no logo, no watermark.",
  },
  {
    key: "home-gallery-floral-celebration-cake",
    page: "Home + Gallery",
    section: "Gallery grid fallback",
    slot: "Celebration cake card",
    placeholderKey: "garden-cake",
    relativePath: "placeholders/marketing/garden-cake.jpg",
    subject: "Floral buttercream celebration cake with soft garden tones",
    aspectRatio: "4:5 portrait",
    width: 1536,
    height: 1920,
    tone:
      "Editorial cake portrait with blush, cream, and soft sage accents, natural light, airy negative space, polished but handmade finish.",
    replaceWithRealPhotography: true,
    prompt:
      "High-end dessert photography of a floral buttercream celebration cake with blush, cream, and soft sage tones, premium boutique bakery aesthetic, warm ivory background, soft natural light, editorial composition, luxury Instagram feel, realistic frosting texture, clean background, no people, no text, no branding.",
  },
  {
    key: "home-gallery-macaron-tower",
    page: "Home + Gallery",
    section: "Gallery grid fallback",
    slot: "Macaron card",
    placeholderKey: "macaron-tower",
    relativePath: "placeholders/marketing/macaron-tower.jpg",
    subject: "Elevated macaron arrangement in a refined neutral palette",
    aspectRatio: "4:5 portrait",
    width: 1536,
    height: 1920,
    tone:
      "Clean editorial dessert styling, neutral ivory surface, pale blush and champagne tones, soft shadows, restrained prop use.",
    replaceWithRealPhotography: true,
    prompt:
      "Luxury editorial bakery photo of an elevated macaron arrangement with pale blush, cream, champagne, and soft gold tones, premium boutique dessert styling, warm ivory palette, natural window light, clean background, refined Instagram aesthetic, crisp detail, no text, no packaging branding, no watermark.",
  },
  {
    key: "home-gallery-cookie-favors",
    page: "Home + Gallery",
    section: "Gallery grid fallback",
    slot: "Cookie favor card",
    placeholderKey: "cookie-favors",
    relativePath: "placeholders/marketing/cookie-favors.jpg",
    subject: "Decorated sugar cookies styled as upscale favors",
    aspectRatio: "4:5 portrait",
    width: 1536,
    height: 1920,
    tone:
      "Refined flat-lay or shallow-angle arrangement, clean ivory surface, delicate color palette, boutique gifting feel without branded packaging.",
    replaceWithRealPhotography: true,
    prompt:
      "Premium boutique bakery flat-lay of decorated sugar cookies styled as elegant event favors, soft ivory and cream palette with delicate accent colors, editorial composition, soft natural light, clean minimal background, high-end dessert photography, no text, no visible branding, realistic icing detail.",
  },
  {
    key: "home-gallery-cupcake-set",
    page: "Home + Gallery",
    section: "Gallery grid fallback",
    slot: "Cupcake assortment card",
    placeholderKey: "cupcake-set",
    relativePath: "placeholders/marketing/cupcake-set.jpg",
    subject: "Curated cupcake assortment with tonal buttercream finishes",
    aspectRatio: "4:5 portrait",
    width: 1536,
    height: 1920,
    tone:
      "Modern editorial dessert shot, tonal frosting palette, soft highlights, boutique event-table presentation, minimal styling clutter.",
    replaceWithRealPhotography: true,
    prompt:
      "High-end editorial photo of a curated cupcake assortment with tonal buttercream finishes in ivory, cream, blush, and soft gold, premium boutique bakery aesthetic, clean background, soft natural light, luxury Instagram feel, realistic cake texture, no toppers with text, no branding, no watermark.",
  },
  {
    key: "home-gallery-diy-kit",
    page: "Home + Gallery",
    section: "Gallery grid fallback",
    slot: "DIY kit card",
    placeholderKey: "diy-kit",
    relativePath: "placeholders/marketing/diy-kit.jpg",
    subject: "Premium cookie decorating kit arranged for gifting or hosted activity",
    aspectRatio: "4:5 portrait",
    width: 1536,
    height: 1920,
    tone:
      "Polished overhead arrangement, clean neutral packaging, elevated family-activity feel, warm natural light, no toy-like clutter.",
    replaceWithRealPhotography: true,
    prompt:
      "Editorial overhead photo of a premium cookie decorating kit arranged neatly with frosted cookies, piping bags, sprinkles, and neutral packaging, warm ivory and cream palette, soft natural light, boutique bakery gift styling, luxury Instagram feel, clean background, no text, no visible logo, no watermark.",
  },
];

export const galleryPlaceholderImageAssets = Object.fromEntries(
  publicImageSlotInventory.map((slot) => [
    slot.placeholderKey,
    {
      alt: slot.subject,
      height: slot.height,
      relativePath: slot.relativePath,
      width: slot.width,
    },
  ]),
) as Record<
  string,
  {
    alt: string;
    height: number;
    relativePath: string;
    width: number;
  }
>;
