import type { PricingPreset, PricingProfile, StageHours } from "./types";

function hours(
  planning: number,
  shoppingPrep: number,
  baking: number,
  decorating: number,
  packagingCleanup: number,
): StageHours {
  return { baking, decorating, deliverySetup: 0, packagingCleanup, planning, shoppingPrep };
}

function preset(
  stageHours: StageHours,
  materialAllowance: number,
  packagingAllowance: number,
): PricingPreset {
  return { materialAllowance, packagingAllowance, stageHours };
}

/** Editable calibration seed. Approve its business assumptions before activation. */
export const defaultPricingProfile = {
  currency: "USD",
  defaultDepositRate: 0.5,
  defaultQuoteValidityDays: 14,
  defaultTaxRate: 0,
  delivery: { mileageRate: 0.725, minimumCharge: 15 },
  fixedOverheadPerOrder: 15,
  minimumMargin: 0.15,
  ownerHourlyRate: 35,
  productPresets: {
    "custom-cake": {
      complexities: {
        simple: preset(hours(0.5, 0.75, 1.5, 1.5, 0.75), 25, 8),
        standard: preset(hours(0.75, 1, 2, 3, 1), 40, 10),
        intricate: preset(hours(1.5, 1.5, 3, 6, 1.5), 75, 15),
      },
      label: "Custom cake",
      publicStartingPrice: 80,
    },
    "wedding-cake": {
      complexities: {
        simple: preset(hours(2, 2, 4, 6, 2), 100, 25),
        standard: preset(hours(3, 3, 6, 10, 3), 175, 40),
        intricate: preset(hours(4, 4, 8, 18, 4), 300, 60),
      },
      label: "Wedding cake",
      publicStartingPrice: 300,
    },
    cupcakes: {
      complexities: {
        simple: preset(hours(0.25, 0.5, 1, 0.75, 0.5), 12, 4),
        standard: preset(hours(0.5, 0.75, 1.5, 1.5, 0.75), 18, 5),
        intricate: preset(hours(0.75, 1, 2, 3, 1), 28, 7),
      },
      label: "Cupcakes",
      publicStartingPrice: 36,
    },
    "sugar-cookies": {
      complexities: {
        simple: preset(hours(0.5, 0.75, 1.5, 2, 0.75), 14, 5),
        standard: preset(hours(0.75, 1, 2, 3.5, 1), 20, 6),
        intricate: preset(hours(1, 1.25, 2.5, 6, 1.25), 30, 8),
      },
      label: "Sugar cookies",
      publicStartingPrice: 48,
    },
    macarons: {
      complexities: {
        simple: preset(hours(0.5, 0.75, 1.5, 0.75, 0.75), 12, 5),
        standard: preset(hours(0.75, 1, 2, 1.5, 1), 18, 6),
        intricate: preset(hours(1, 1.25, 2.5, 3, 1.25), 28, 8),
      },
      label: "Macarons",
      publicStartingPrice: 30,
    },
    "diy-kit": {
      complexities: {
        simple: preset(hours(0.25, 0.5, 1, 0.5, 0.5), 10, 4),
        standard: preset(hours(0.5, 0.75, 1.5, 0.75, 0.75), 15, 5),
        intricate: preset(hours(0.75, 1, 2, 1.5, 1), 22, 7),
      },
      label: "DIY kit",
      publicStartingPrice: 25,
    },
  },
  profileId: "sweet-fork-calibration-seed",
  targetMargin: 0.3,
  variableOverheadRate: 0.1,
  version: 1,
} satisfies PricingProfile;
