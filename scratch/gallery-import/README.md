# Gallery Import Workspace

This scratch workspace is for staging future customer-facing gallery photo batches before they are optimized and imported. Do not place production gallery content here as the final source of truth.

## Folder Roles

- `batch-XX/originals/`: untouched source files from the business owner.
- `batch-XX/processed/`: generated, optimized web-ready copies.
- `batch-XX/manifest/`: approved metadata and import manifest files.

## Source Image Rules

- Put true source/original images into the matching `batch-XX/originals/` folder.
- Do not overwrite, rename, resize, or mutate originals in place.
- Original files may be JPG, JPEG, PNG, HEIC, WebP, screenshots, or other phone exports.
- Future Codex batch imports should read from `originals/` and create optimized copies in `processed/`.
- Actual files in `originals/` and generated files in `processed/` are ignored by git by default, while `.gitkeep`, this README, and manifest templates remain commit-ready.

## Processing Expectations

- Preserve originals unchanged.
- Inspect MIME/type and dimensions before processing.
- Resize oversized images to a practical long edge, generally around 2000-2400px unless the current site establishes a different standard.
- Normal dessert/product photos should generally become optimized JPG/JPEG final web assets unless transparency is actually needed or the app's existing pipeline prefers another format.
- Handle HEIC gracefully. If the environment cannot convert HEIC, report the exact files and fallback instructions.
- Strip unnecessary metadata where appropriate.
- Use the approved SEO filename from the manifest for final web-ready copies.
- Continue using Next.js Image optimization where the frontend currently does.

## Manifest

The batch manifest is the source of truth for approved filenames and public metadata. Future batch prompts should provide or update:

- `source_filename`
- `approved_filename`
- `category`
- `title`
- `alt_text`
- `tags`
- `visibility`
- `featured`
- `sort_priority`
- `suggested_use`
- `recommended_crop`
- `notes`

The template for Batch 01 lives at `batch-01/manifest/gallery-batch-01.template.json`.

## Current Site Notes

As of this workspace setup, the production gallery implementation should not be modified by staging files here. The public gallery can read managed media from Supabase `media_assets` and `media_assignments` for the `marketing` bucket, and falls back to static placeholder imagery under `public/placeholders/marketing/` when needed. Future imports should align with that existing architecture rather than changing schema without an explicit decision.
