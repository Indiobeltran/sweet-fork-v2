# Launch Placeholder Image Plan

This pass does not add new public image modules or redesign the site.

Current public image behavior after this pass:

- Brand assets now load from `public/brand`.
- The homepage gallery and `/gallery` page share the same fallback image manifest.
- If a mapped placeholder file is dropped into `public/placeholders/marketing`, the public gallery will pick it up automatically.
- If no mapped file exists yet, the existing neutral fallback cards continue to render without broken images.

## Audit Summary

- Live public image slots today are concentrated in the shared gallery grid on:
  - `/`
  - `/gallery`
- Product, FAQ, pricing, about, privacy, and terms pages are intentionally text-led in the current launch design.
- No new editorial hero image slots were introduced in this polish pass to avoid a redesign.
- Social share imagery now uses the brand asset at `public/brand/logo-social.jpg`.

## Image Slot Inventory

| Page / section | Slot | Subject | Aspect ratio | Recommended dimensions | Tone / style notes | Replace with real photography later? | Mapped file |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home + Gallery / gallery grid fallback | Feature cake card | Tall editorial wedding cake with refined piping and soft floral detail | 4:5 portrait | 1536 x 1920 | Warm ivory backdrop, soft natural light, premium boutique bakery styling, clean composition | Yes | `public/placeholders/marketing/wedding-tier.jpg` |
| Home + Gallery / gallery grid fallback | Celebration cake card | Floral buttercream celebration cake with soft garden tones | 4:5 portrait | 1536 x 1920 | Airy negative space, blush and cream palette, polished handmade finish | Yes | `public/placeholders/marketing/garden-cake.jpg` |
| Home + Gallery / gallery grid fallback | Macaron card | Elevated macaron arrangement in refined neutral tones | 4:5 portrait | 1536 x 1920 | Neutral ivory surface, pale blush and champagne tones, editorial dessert styling | Yes | `public/placeholders/marketing/macaron-tower.jpg` |
| Home + Gallery / gallery grid fallback | Cookie favor card | Decorated sugar cookies styled as upscale favors | 4:5 portrait | 1536 x 1920 | Refined flat-lay or shallow-angle arrangement, delicate palette, boutique gifting feel | Yes | `public/placeholders/marketing/cookie-favors.jpg` |
| Home + Gallery / gallery grid fallback | Cupcake assortment card | Curated cupcake assortment with tonal buttercream finishes | 4:5 portrait | 1536 x 1920 | Modern editorial dessert shot, tonal frosting palette, minimal styling clutter | Yes | `public/placeholders/marketing/cupcake-set.jpg` |
| Home + Gallery / gallery grid fallback | DIY kit card | Premium cookie decorating kit arranged for gifting or hosted activity | 4:5 portrait | 1536 x 1920 | Polished overhead arrangement, clean neutral packaging, warm natural light | Yes | `public/placeholders/marketing/diy-kit.jpg` |

## Prompt Pack

Shared direction for every prompt:

- Premium boutique bakery
- Warm ivory / cream palette
- Soft natural light
- Editorial composition
- Luxury Instagram feel
- Refined, high-end dessert photography
- Clean backgrounds
- No text in images
- No visible branding unless explicitly intended

Per-slot prompts:

1. `wedding-tier.jpg`
   `Premium boutique bakery editorial photo of a tall white wedding cake with refined piping, subtle floral accents, and elegant texture, warm ivory and cream palette, soft natural window light, luxury Instagram feel, clean seamless background, high-end dessert photography, centered composition, realistic buttercream detail, no text, no logo, no watermark.`

2. `garden-cake.jpg`
   `High-end dessert photography of a floral buttercream celebration cake with blush, cream, and soft sage tones, premium boutique bakery aesthetic, warm ivory background, soft natural light, editorial composition, luxury Instagram feel, realistic frosting texture, clean background, no people, no text, no branding.`

3. `macaron-tower.jpg`
   `Luxury editorial bakery photo of an elevated macaron arrangement with pale blush, cream, champagne, and soft gold tones, premium boutique dessert styling, warm ivory palette, natural window light, clean background, refined Instagram aesthetic, crisp detail, no text, no packaging branding, no watermark.`

4. `cookie-favors.jpg`
   `Premium boutique bakery flat-lay of decorated sugar cookies styled as elegant event favors, soft ivory and cream palette with delicate accent colors, editorial composition, soft natural light, clean minimal background, high-end dessert photography, no text, no visible branding, realistic icing detail.`

5. `cupcake-set.jpg`
   `High-end editorial photo of a curated cupcake assortment with tonal buttercream finishes in ivory, cream, blush, and soft gold, premium boutique bakery aesthetic, clean background, soft natural light, luxury Instagram feel, realistic cake texture, no toppers with text, no branding, no watermark.`

6. `diy-kit.jpg`
   `Editorial overhead photo of a premium cookie decorating kit arranged neatly with frosted cookies, piping bags, sprinkles, and neutral packaging, warm ivory and cream palette, soft natural light, boutique bakery gift styling, luxury Instagram feel, clean background, no text, no visible logo, no watermark.`

## Mapping Notes

- The code-side manifest lives in `src/lib/site/placeholder-images.ts`.
- The public gallery fallback checks for these exact filenames in `public/placeholders/marketing`.
- Drop-in replacement flow:
  1. Generate the image using the mapped prompt.
  2. Export it to the mapped filename.
  3. Place it in `public/placeholders/marketing`.
  4. Redeploy or restart the app so the file is served.

## Owner Review Items

- Confirm whether AI placeholders are acceptable for launch, or only for staging / pre-launch review.
- Confirm whether any gallery slot should remain intentionally empty until real photography is available.
- Replace any AI placeholder with real Sweet Fork photography as soon as approved images exist.
