# Gallery Batch 03 Intake

Welcome to the intake folder for Gallery Batch 03. Please follow the instructions below to add, process, and import Batch 03 source images.

## Intake Workflow

1. **Originals**: Place original Batch 03 source images in:
   `scratch/gallery-import/batch-03/originals/`
2. **Naming**: Do not rename originals manually unless instructed. Keep originals unchanged.
3. **Format Support**:
   - Preferred source image types: `.jpg`, `.jpeg`, `.png` (if needed).
   - Avoid HEIC unless it will be converted during processing.
4. **Processing**: Do not place edited/optimized images in `originals/`. The `processed/` directory is reserved for generated import-ready copies.
5. **Manifest**: The `manifest/` directory is reserved for proposed/final manifest JSON files.
6. **No Preemptive Imports**: No Supabase import should happen until after validation and manifest approval.

## Technical Architecture Alignment

All future Batch 03 imports should mirror the Batch 01/Batch 02 Supabase-backed media architecture:
- **Supabase Storage bucket**: `marketing`
- **Storage prefix**: `gallery-batch-03/`
- **Database Tables**:
  - `media_assets`
  - `media_assignments`
- **Gallery Placement**: `gallery.grid`
- **Category Context**: `gallery-category`
