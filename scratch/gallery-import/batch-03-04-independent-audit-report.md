# Sweet Fork Gallery Batch 03/04 Independent Audit

Date: 2026-06-02

Scope: read-only audit of Batch 03 and Batch 04 gallery media state before repair. No images, manifests, app code, database records, storage objects, or deployment settings were modified by this audit.

## Executive Summary

| Batch | Total reviewed | OK | Mismatched | Needs human review | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| Batch 03 | 20 | 20 | 0 | 0 | No repair needed |
| Batch 04 | 11 | 2 | 9 | 0 | Repair needed |

Independent conclusion:
- Batch 03 processed files, manifest metadata, Supabase `media_assets`, assignments, and visual content match.
- Batch 04 has 9 image-content/source-mapping mismatches. The database titles, categories, alt text, and SEO filenames appear to describe the intended final records, but 9 storage/processed images point to the wrong visual content.
- The prior handoff/audit claim that Batch 04 failed 9 of 11 is independently confirmed. The Batch 04 `gallery-batch-04-source-inventory.md` is contradictory and should not be used as the repair source of truth.
- The live production gallery HTML at `https://sweet-fork-v2.vercel.app/gallery` includes a 71-item Supabase-backed gallery payload and contains the Batch 04 records/storage URLs listed below.

## Current Repo/Runtime Context

- Current branch observed during audit: `main`.
- Local `main` is ahead of `origin/main` by 1 commit: `3d543c2 docs: full read-only gallery media audit (Batches 01-04)`.
- Existing untracked files were preserved and not touched: `.agents/`, `scratch/process-import-batch-04.mjs`, `scratch/qa/orders-prod-qa.mjs`, `skills-lock.json`.
- Supabase read-only query found 31 media assets across Batch 03 and Batch 04, with 62 media assignments.
- Live gallery spot-check found filter counts: All 71, Custom Cakes 29, Sugar Cookies 22, Macarons 5, Cupcakes 13, Wedding Cakes 2.

## Batch 03 Detailed Audit

All Batch 03 rows are high confidence OK. Recommended fix for every row: none.

| Source filename | SEO filename | Title | Category | Visual check | Issue type | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| `1000015648.jpeg` | `sweet-fork-western-highland-cow-baby-shower-sugar-cookies-centerville-utah.jpg` | Western Highland Cow Baby Shower Cookies | Sugar Cookies | Western/highland cow baby shower cookie tray | OK | High |
| `1000015649.jpeg` | `sweet-fork-highland-cow-baby-shower-sugar-cookie-centerville-utah.jpg` | Highland Cow Custom Sugar Cookie | Sugar Cookies | Highland cow cookie closeup | OK | High |
| `1000015650.jpeg` | `sweet-fork-saguaro-cactus-baby-shower-sugar-cookie-centerville-utah.jpg` | Saguaro Cactus Custom Sugar Cookie | Sugar Cookies | Saguaro cactus cookie closeup | OK | High |
| `1000015651.jpeg` | `sweet-fork-lavender-onesie-baby-shower-sugar-cookie-centerville-utah.jpg` | Lavender Onesie Custom Sugar Cookie | Sugar Cookies | Lavender baby onesie cookie closeup | OK | High |
| `1000015652.jpeg` | `sweet-fork-cowboy-boot-and-rattle-sugar-cookies-centerville-utah.jpg` | Cowboy Boot and Rattle Sugar Cookies | Sugar Cookies | Cowboy boot and rattle cookies | OK | High |
| `4AE0774B-D06F-4A44-91E7-1BB086C47AE7.PNG` | `sweet-fork-shark-birthday-cupcakes-centerville-utah.jpg` | Shark Cupcake Stand | Cupcakes | Shark-themed cupcake stand | OK | High |
| `D4673383-1DFE-4914-92E1-B974972481F9.PNG` | `sweet-fork-shark-birthday-bakery-box-cupcakes-centerville-utah.jpg` | Shark Cupcake Box | Cupcakes | Shark-themed cupcakes in bakery box | OK | High |
| `IMG_1787.heic` | `sweet-fork-strawberry-baby-shower-sugar-cookies-centerville-utah.jpg` | Strawberry Baby Shower Sugar Cookies | Sugar Cookies | Strawberry baby shower cookies | OK | High |
| `IMG_1792.heic` | `sweet-fork-strawberry-and-macaron-baby-shower-cookies-centerville-utah.jpg` | Strawberry Baby Shower Cookie and Macaron Box | Sugar Cookies | Mixed cookie/macaron baby shower box, correctly categorized as Sugar Cookies per manifest | OK | High |
| `IMG_2605.jpg` | `sweet-fork-shark-cupcake-centerville-utah.jpg` | Shark Cupcake | Cupcakes | Single shark cupcake | OK | High |
| `IMG_2684 2.jpg` | `sweet-fork-funny-chocolate-birthday-cake-centerville-utah.jpg` | Funny Chocolate Birthday Cake | Custom Cakes | Chocolate birthday cake | OK | High |
| `IMG_2994.heic` | `sweet-fork-puppy-first-birthday-sugar-cookies-centerville-utah.jpg` | Puppy First Birthday Sugar Cookies | Sugar Cookies | Blue puppy first birthday cookies | OK | High |
| `IMG_2999.heic` | `sweet-fork-blue-puppy-birthday-sugar-cookies-centerville-utah.jpg` | Blue Puppy Birthday Sugar Cookies | Sugar Cookies | Blue puppy birthday cookies | OK | High |
| `IMG_3006.heic` | `sweet-fork-puppy-party-sugar-cookie-box-centerville-utah.jpg` | Puppy Party Sugar Cookies | Sugar Cookies | Puppy party cookie box | OK | High |
| `IMG_3183.jpg` | `sweet-fork-vintage-pink-lambeth-heart-cake-centerville-utah.jpg` | Vintage Pink Lambeth Heart Cake | Custom Cakes | Pink vintage Lambeth heart cake | OK | High |
| `IMG_3800.jpg` | `sweet-fork-german-chocolate-cake-centerville-utah.jpg` | Classic German Chocolate Cake | Custom Cakes | German chocolate cake | OK | High |
| `IMG_3803.jpg` | `sweet-fork-cream-cheese-carrot-cake-centerville-utah.jpg` | Classic Cream Cheese Carrot Cake | Custom Cakes | Cream cheese carrot cake | OK | High |
| `IMG_3804.jpg` | `sweet-fork-cream-vintage-lambeth-cake-centerville-utah.jpg` | Vintage Off-White Lambeth Cake | Custom Cakes | Off-white vintage Lambeth cake | OK | High |
| `IMG_3807.jpg` | `sweet-fork-pixel-blocks-video-game-birthday-cake-centerville-utah.jpg` | Pixel Blocks Video Game Birthday Cake | Custom Cakes | Pixel-block video game birthday cake | OK | High |
| `IMG_3810.jpg` | `sweet-fork-whimsical-pastel-birthday-cake-centerville-utah.jpg` | Whimsical Pastel Birthday Cake | Custom Cakes | Whimsical pastel birthday cake | OK | High |

## Batch 04 Detailed Audit

Issue type key:
- `OK`: visual content matches title/category/alt/SEO filename.
- `IMAGE_CONTENT_MISMATCH`: stored/processed image is not the item described.
- `TITLE_ALT_SEO_MISMATCH`: visible image does not match the public title, alt text, or SEO filename.
- `CATEGORY_MISMATCH`: visible image belongs to a different category from the DB/gallery category.
- `SOURCE_MAPPING_MISMATCH`: DB/source filename tracking points to the wrong source for the visible item.

| Asset ID | Current source filename | Current SEO filename | Current title | Current category | Actual visual content | Issue type | Confidence | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ca20d76b-3a06-4a57-8729-3a4a8976637c` | `4Fre3-hniucr5bp4tjb62wuaqnwdqu.HEIC` | `sweet-fork-mini-pie-sugar-cookie-box-centerville-utah.jpg` | Mini Pie Sugar Cookie Box | Sugar Cookies | Blue/white pearl cupcakes in a 12-count box | IMAGE_CONTENT_MISMATCH; TITLE_ALT_SEO_MISMATCH; CATEGORY_MISMATCH; SOURCE_MAPPING_MISMATCH | High | Replace image at this SEO path with processed output from `IMG_0821.heic`; update source tracking/checksum/dimensions/file size. |
| `5f0fdf7e-ac31-4092-9556-36d0ba26c88c` | `Ej93e-jtl5pood6q2ibg6vfaa7dgyu.HEIC` | `sweet-fork-lemon-birthday-cake-centerville-utah.jpg` | Lemon Birthday Cake | Custom Cakes | Lemon birthday cake | OK | High | None. |
| `739ad4a3-efce-45e2-a878-95489f176eaf` | `IMG_0045.HEIC` | `sweet-fork-vendor-booth-dessert-display-centerville-utah.jpg` | Sweet Fork Vendor Booth Display | Custom Cakes | Lemon cupcake display | IMAGE_CONTENT_MISMATCH; TITLE_ALT_SEO_MISMATCH; CATEGORY_MISMATCH; SOURCE_MAPPING_MISMATCH | High | Replace image at this SEO path with processed output from `IMG_9985.heic`; update source tracking/checksum/dimensions/file size. |
| `fd113eab-d987-485e-86ab-1b4e0f362ca5` | `IMG_0821.heic` | `sweet-fork-blue-white-buttercream-cupcake-set-centerville-utah.jpg` | Blue and White Buttercream Cupcake Set | Cupcakes | Open mini pie sugar cookie box | IMAGE_CONTENT_MISMATCH; TITLE_ALT_SEO_MISMATCH; CATEGORY_MISMATCH; SOURCE_MAPPING_MISMATCH | High | Replace image at this SEO path with processed output from `cdClX-fp5y3hld7a7fyyhyslcpy23l.HEIC`; update source tracking/checksum/dimensions/file size. |
| `c36f6b8c-d54e-48b0-a078-14577bcb8e9b` | `IMG_0824.heic` | `sweet-fork-blue-white-pearl-cupcakes-centerville-utah.jpg` | Blue and White Pearl Cupcakes | Cupcakes | Boxed mini pie sugar cookies through bakery box window | IMAGE_CONTENT_MISMATCH; TITLE_ALT_SEO_MISMATCH; CATEGORY_MISMATCH; SOURCE_MAPPING_MISMATCH | High | Replace image at this SEO path with processed output from `4Fre3-hniucr5bp4tjb62wuaqnwdqu.HEIC`; update source tracking/checksum/dimensions/file size. |
| `d624556e-26b7-443b-b54f-24d223e0892c` | `IMG_1091.heic` | `sweet-fork-lemon-cupcake-display-centerville-utah.jpg` | Lemon Cupcake Display | Cupcakes | Confetti sprinkle cupcakes | IMAGE_CONTENT_MISMATCH; TITLE_ALT_SEO_MISMATCH; SOURCE_MAPPING_MISMATCH | High | Replace image at this SEO path with processed output from `IMG_0045.HEIC`; update source tracking/checksum/dimensions/file size. |
| `6a4b87e9-a33e-4755-bd08-176f415ca583` | `IMG_1120.heic` | `sweet-fork-confetti-sprinkle-cupcakes-centerville-utah.jpg` | Confetti Sprinkle Cupcakes | Cupcakes | Christmas decorated sugar cookies | IMAGE_CONTENT_MISMATCH; TITLE_ALT_SEO_MISMATCH; CATEGORY_MISMATCH; SOURCE_MAPPING_MISMATCH | High | Replace image at this SEO path with processed output from `IMG_1091.heic`; update source tracking/checksum/dimensions/file size. |
| `0bc2f848-e907-413c-b679-4ae160a9bcd1` | `IMG_1782.heic` | `sweet-fork-christmas-decorated-sugar-cookies-centerville-utah.jpg` | Christmas Sugar Cookie Set | Sugar Cookies | Pink/coral macaron box | IMAGE_CONTENT_MISMATCH; TITLE_ALT_SEO_MISMATCH; CATEGORY_MISMATCH; SOURCE_MAPPING_MISMATCH | High | Replace image at this SEO path with processed output from `IMG_1120.heic`; update source tracking/checksum/dimensions/file size. |
| `f0ccd24b-bd65-45c1-b53a-f6605cbef5f2` | `IMG_9985.heic` | `sweet-fork-pink-coral-macaron-box-centerville-utah.jpg` | Pink and Coral Macaron Box | Macarons | Sweet Fork vendor booth display | IMAGE_CONTENT_MISMATCH; TITLE_ALT_SEO_MISMATCH; CATEGORY_MISMATCH; SOURCE_MAPPING_MISMATCH | High | Replace image at this SEO path with processed output from `IMG_1782.heic`; update source tracking/checksum/dimensions/file size. |
| `4f4d3100-315b-4034-a3d9-f1861b310284` | `Q95A4-eeij43pyuoql3emt3pdumvmi.JPG` | `sweet-fork-raspberry-chocolate-cupcakes-centerville-utah.jpg` | Raspberry Chocolate Cupcakes | Cupcakes | Raspberry chocolate cupcakes | OK | High | None. |
| `59d56667-490a-4f71-871f-576cde8bf795` | `cdClX-fp5y3hld7a7fyyhyslcpy23l.HEIC` | `sweet-fork-boxed-mini-pie-sugar-cookies-centerville-utah.jpg` | Boxed Mini Pie Sugar Cookies | Sugar Cookies | Blue/white buttercream cupcakes on wooden tray | IMAGE_CONTENT_MISMATCH; TITLE_ALT_SEO_MISMATCH; CATEGORY_MISMATCH; SOURCE_MAPPING_MISMATCH | High | Replace image at this SEO path with processed output from `IMG_0824.heic`; update source tracking/checksum/dimensions/file size. |

## Correct Batch 04 Source-To-SEO Mapping

Use this table for repair. It is based on visual inspection of the local originals via temporary previews and local processed images, then cross-checked against the DB records and live gallery payload.

| Correct source file | Correct SEO filename | Correct title | Correct category | Current status |
| --- | --- | --- | --- | --- |
| `4Fre3-hniucr5bp4tjb62wuaqnwdqu.HEIC` | `sweet-fork-blue-white-pearl-cupcakes-centerville-utah.jpg` | Blue and White Pearl Cupcakes | Cupcakes | Needs repair |
| `Ej93e-jtl5pood6q2ibg6vfaa7dgyu.HEIC` | `sweet-fork-lemon-birthday-cake-centerville-utah.jpg` | Lemon Birthday Cake | Custom Cakes | OK |
| `IMG_0045.HEIC` | `sweet-fork-lemon-cupcake-display-centerville-utah.jpg` | Lemon Cupcake Display | Cupcakes | Needs repair |
| `IMG_0821.heic` | `sweet-fork-mini-pie-sugar-cookie-box-centerville-utah.jpg` | Mini Pie Sugar Cookie Box | Sugar Cookies | Needs repair |
| `IMG_0824.heic` | `sweet-fork-boxed-mini-pie-sugar-cookies-centerville-utah.jpg` | Boxed Mini Pie Sugar Cookies | Sugar Cookies | Needs repair |
| `IMG_1091.heic` | `sweet-fork-confetti-sprinkle-cupcakes-centerville-utah.jpg` | Confetti Sprinkle Cupcakes | Cupcakes | Needs repair |
| `IMG_1120.heic` | `sweet-fork-christmas-decorated-sugar-cookies-centerville-utah.jpg` | Christmas Sugar Cookie Set | Sugar Cookies | Needs repair |
| `IMG_1782.heic` | `sweet-fork-pink-coral-macaron-box-centerville-utah.jpg` | Pink and Coral Macaron Box | Macarons | Needs repair |
| `IMG_9985.heic` | `sweet-fork-vendor-booth-dessert-display-centerville-utah.jpg` | Sweet Fork Vendor Booth Display | Custom Cakes | Needs repair |
| `Q95A4-eeij43pyuoql3emt3pdumvmi.JPG` | `sweet-fork-raspberry-chocolate-cupcakes-centerville-utah.jpg` | Raspberry Chocolate Cupcakes | Cupcakes | OK |
| `cdClX-fp5y3hld7a7fyyhyslcpy23l.HEIC` | `sweet-fork-blue-white-buttercream-cupcake-set-centerville-utah.jpg` | Blue and White Buttercream Cupcake Set | Cupcakes | Needs repair |

## Recommended Repair Strategy

1. Do not change Batch 03.
2. Reprocess the nine incorrect Batch 04 sources into optimized JPEGs using the same import quality/dimension standards used for existing gallery imports.
3. Prefer preserving the existing Batch 04 `media_assets` IDs, captions, categories, featured flags, sort order, assignments, and SEO storage paths. The DB metadata is already aligned to the intended public records.
4. For each mismatched asset, upload the corrected JPEG to the existing intended storage path, then update `media_assets.original_filename`, dimensions, file size, checksum/metadata, and updated timestamp to match the corrected source/output.
5. Do not duplicate records and do not remove existing gallery records.
6. After repair, verify Supabase storage object content, DB metadata, admin media visibility, and the customer-facing gallery page.

## Risk Notes

- Next.js image optimization and Vercel caching may continue serving stale optimized images if storage object paths are overwritten with new content at the same URL. After repair, verify the rendered public image, not only the Supabase object. A redeploy or cache-busting strategy may be needed if stale optimized images persist.
- If guaranteed immediate public cache separation is required, the safer but broader repair is to upload corrected images to new unique storage paths and update `media_assets.storage_path`/public URL fields accordingly. That creates more DB churn but avoids same-URL image cache ambiguity.
- The Batch 04 source inventory note is unreliable for repair because it contradicts actual source previews and processed image content.
- The audit did not modify Supabase, Vercel, app code, manifests, source images, or processed images.

## Verification Performed

- Checked branch/status/log context.
- Read Batch 03 and Batch 04 manifest/source/processed folder inventory.
- Queried Supabase `media_assets` and `media_assignments` read-only for Batch 03 and Batch 04 records.
- Visually inspected all 20 Batch 03 processed images.
- Visually inspected all 11 Batch 04 processed images.
- Generated temporary JPEG previews outside the repo under `/tmp` for Batch 04 HEIC originals and visually inspected them.
- Fetched production gallery HTML from `https://sweet-fork-v2.vercel.app/gallery`; confirmed 71-item gallery payload and Batch 04 public Supabase storage URLs are present.
