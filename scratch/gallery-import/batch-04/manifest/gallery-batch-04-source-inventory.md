# Sweet Fork Gallery Batch 04 Source Inventory

This file provides a comprehensive inventory of the raw source photos received for **Gallery Batch 04**. All original images are preserved in their original state in the `originals/` folder.

## Inventory Summary

- **Target Folder**: `scratch/gallery-import/batch-04/originals/`
- **Expected Count**: 11
- **Actual Count Found**: 11 (plus `.gitkeep`)
- **Validation Status**: **PASSED** (all 11 source photos are present, uncorrupted, and have valid dimensions/sizes).

## Source Inventory Table

| # | Filename | Type | Dimensions | Size | Orientation | Preliminary Category | Notes |
|---|---|---:|---:|---:|---|---|---|
| 1 | `4Fre3-hniucr5bp4tjb62wuaqnwdqu.HEIC` | image/heic | 4032 × 3024 | 2,245,539 B | Landscape (4:3) | Sugar Cookies | Mini pie/cookie-style dessert box, open box (Taken 2025-09-25 15:11:58) |
| 2 | `Ej93e-jtl5pood6q2ibg6vfaa7dgyu.HEIC` | image/heic | 2808 × 3768 | 1,098,415 B | Portrait (3:4) | Sugar Cookies | Christmas decorated sugar cookies (Taken 2025-08-27 13:32:40) |
| 3 | `IMG_0045.HEIC` | image/heic | 3050 × 2714 | 1,201,011 B | Landscape (5:4) | Custom Cakes | Lemon-themed birthday cake (Taken 2025-08-16 18:34:00) |
| 4 | `IMG_0821.heic` | image/heic | 4283 × 4320 | 3,315,230 B | Portrait (1:1) | Cupcakes | Blue/white pearl cupcakes on wooden tray (Taken 2025-11-10 17:11:34) |
| 5 | `IMG_0824.heic` | image/heic | 4280 × 5031 | 2,840,807 B | Portrait (4:5) | Cupcakes | Blue/white pearl cupcakes in 12-count box (Taken 2025-11-10 17:12:06) |
| 6 | `IMG_1091.heic` | image/heic | 5711 × 3755 | 1,543,008 B | Landscape (3:2) | Cupcakes | Lemon cupcakes on display table (Taken 2025-12-04 15:15:22) |
| 7 | `IMG_1120.heic` | image/heic | 3992 × 4295 | 2,274,195 B | Portrait (1:1) | Cupcakes | Confetti sprinkle cupcakes in 12-count box (Taken 2025-12-05 18:17:51) |
| 8 | `IMG_1782.heic` | image/heic | 4174 × 5449 | 2,746,361 B | Portrait (3:4) | Cupcakes | Raspberry chocolate cupcakes with pink frosting (Taken 2026-01-16 15:31:27) |
| 9 | `IMG_9985.heic` | image/heic | 2719 × 2556 | 508,112 B | Landscape (1:1) | Macarons | Pink/coral macarons in box (Taken 2025-10-12 12:49:43) |
| 10 | `Q95A4-eeij43pyuoql3emt3pdumvmi.JPG` | image/jpeg | 6016 × 4016 | 14,855,151 B | Landscape (3:2) | Brand/Event | Vendor booth display with Melissa/The Sweet Fork (Taken 2025-08-30 12:38:19) |
| 11 | `cdClX-fp5y3hld7a7fyyhyslcpy23l.HEIC` | image/heic | 3940 × 2875 | 1,327,856 B | Landscape (4:3) | Sugar Cookies | Boxed mini pies with Sweet Fork label (Taken 2025-09-25 15:17:48) |

## Intake & Quality Observations

1. **HEIC Native Format**: 10 of 11 files are in Apple's native HEIC format. These files are uncompressed and excellent for preservation but will require automatic translation/rendering into optimized progressive JPEGs during processing to ensure 100% browser compatibility.
2. **DSLR Source File Size**: `Q95A4-eeij43pyuoql3emt3pdumvmi.JPG` is a high-end 6016x4016 digital photo measuring **14.85 MB**. This file must be downscaled/compressed during the processing stage to prevent severe performance penalties in the gallery.
3. **Brand/Lifestyle Asset**: `Q95A4-eeij43pyuoql3emt3pdumvmi.JPG` is verified to be a vendor booth lifestyle photo containing Melissa/The Sweet Fork rather than a specific single dessert product. It will be assigned a specific category or featured parameter when the metadata manifest is constructed.
4. **Original Preservation**: All 11 raw files were inspected with non-destructive APIs (`sips` and `mdls`). No changes, conversions, renames, writes, or metadata modifications were performed on the raw files.
