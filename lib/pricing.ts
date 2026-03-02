/**
 * Pricing logic for Vizta Tint window film estimates.
 * All calculations are isolated here; config comes from pricing.json.
 */

import pricingConfig from "@/config/pricing.json";

export type FilmTypeId = keyof typeof pricingConfig.filmTypes;
export type FrameType = "vinyl" | "metal" | "rubberGasket" | "wood";
export type ShapeType = "rectangle" | "skylight" | "custom";
export type InstallType = "interior" | "exterior";
export type LocationType = "standard" | "stairwell";
export type ProjectType = "residential" | "commercial";

export interface WindowInput {
  label: string;
  quantity: number;
  widthInches: number;
  heightInches: number;
  frameType: FrameType | "";
  shape: ShapeType | "";
  installType: InstallType;
  location: LocationType;
  topAbove15Feet: boolean;
  existingFilmRemoval?: boolean;
  frenchPanes?: boolean;
  filmTypeId: FilmTypeId | "";
}

export interface WindowLineItem {
  label: string;
  sqft: number;
  basePrice: number;
  perSqftAdders: number;
  flatAdders: number;
  windowTotal: number;
  breakdown: string[];
}

export interface ProjectEstimate {
  windowLineItems: WindowLineItem[];
  subtotal: number;
  totalAfterMinimum: number;
  taxAmount: number;
  totalWithTax: number;
  low: number;
  high: number;
  specialEquipmentRequired: boolean;
  canShowPriceRange: boolean;
  projectType: ProjectType;
}

const INCHES_PER_SQFT = 144;
/** Added to width and height for sqft calculation only (trim allowance); not shown in UI. */
const TRIM_INCHES = 1;

function roundToNearest(value: number, nearest: number): number {
  return Math.round(value / nearest) * nearest;
}

function getPerSqftAdderTotal(
  sqft: number,
  frameType: FrameType,
  shape: ShapeType,
  installType: InstallType
): { total: number; breakdown: string[] } {
  const adders = pricingConfig.perSqftAdders as {
    woodFrame: number;
    skylight: number;
    customShape: number;
    exteriorInstall: number;
  };
  let total = 0;
  const breakdown: string[] = [];

  if (frameType === "wood") {
    total += sqft * adders.woodFrame;
    breakdown.push(`Wood frame: $${adders.woodFrame}/sqft`);
  }
  if (shape === "skylight") {
    total += sqft * adders.skylight;
    breakdown.push(`Skylight: $${adders.skylight}/sqft`);
  }
  if (shape === "custom") {
    total += sqft * adders.customShape;
    breakdown.push(`Custom shape: $${adders.customShape}/sqft`);
  }
  if (installType === "exterior") {
    total += sqft * adders.exteriorInstall;
    breakdown.push(`Exterior install: $${adders.exteriorInstall}/sqft`);
  }

  return { total, breakdown };
}

export function inchesToSqft(widthInches: number, heightInches: number): number {
  return (widthInches * heightInches) / INCHES_PER_SQFT;
}

export function computeWindowLineItem(
  input: WindowInput,
  projectType: ProjectType = "residential"
): WindowLineItem {
  const filmTypeId = String(input.filmTypeId ?? "").trim();
  const frameType = input.frameType ?? "";
  const shape = input.shape ?? "";
  const incomplete =
    !filmTypeId ||
    !frameType ||
    !shape ||
    (input.widthInches ?? 0) <= 0 ||
    (input.heightInches ?? 0) <= 0;
  if (incomplete) {
    const displayLabel =
      (input.quantity ?? 1) > 1 ? `${input.label} (×${input.quantity ?? 1})` : input.label;
    return {
      label: displayLabel,
      sqft: 0,
      basePrice: 0,
      perSqftAdders: 0,
      flatAdders: 0,
      windowTotal: 0,
      breakdown: [],
    };
  }

  const sqft = inchesToSqft(
    input.widthInches! + TRIM_INCHES,
    input.heightInches! + TRIM_INCHES
  );
  const cfg = getPricingConfig();
  const filmTypes = cfg.filmTypes as Record<string, { label: string; pricePerSqft: number }>;
  const filmConfig =
    filmTypeId && Object.prototype.hasOwnProperty.call(filmTypes, filmTypeId)
      ? filmTypes[filmTypeId]
      : null;
  let basePricePerSqft = filmConfig != null ? filmConfig.pricePerSqft : 15;
  const commercialAdder = (cfg as { commercialPricePerSqftAdder?: number }).commercialPricePerSqftAdder ?? 1;
  if (projectType === "commercial") {
    basePricePerSqft += commercialAdder;
  }
  const basePrice = sqft * basePricePerSqft;

  const { total: perSqftAddersBase, breakdown: perSqftBreakdown } = getPerSqftAdderTotal(
    sqft,
    input.frameType as FrameType,
    input.shape as ShapeType,
    input.installType
  );

  const addersConfig = cfg.perSqftAdders as {
    existingFilmRemovalMin?: number;
    existingFilmRemovalMax?: number;
    frenchPanes?: number;
  };
  const filmRemovalMin = addersConfig.existingFilmRemovalMin ?? 2;
  const filmRemovalMax = addersConfig.existingFilmRemovalMax ?? 3;
  const filmRemovalPerSqft = input.existingFilmRemoval ? (filmRemovalMin + filmRemovalMax) / 2 : 0;
  const filmRemovalAdder = sqft * filmRemovalPerSqft;
  if (filmRemovalAdder > 0) {
    perSqftBreakdown.push(`Existing film removal: $${filmRemovalMin}–$${filmRemovalMax}/sqft`);
  }
  const frenchPanesPerSqft = addersConfig.frenchPanes ?? 2;
  const frenchPanesAdder = input.frenchPanes ? sqft * frenchPanesPerSqft : 0;
  if (frenchPanesAdder > 0) {
    perSqftBreakdown.push(`French panes: $${frenchPanesPerSqft}/sqft`);
  }
  const perSqftAdders = perSqftAddersBase + filmRemovalAdder + frenchPanesAdder;

  const flatAddersConfig = pricingConfig.flatAdders as { stairwellPerWindow: number };
  const flatAddersPerWindow = input.location === "stairwell" ? flatAddersConfig.stairwellPerWindow : 0;
  const flatBreakdown =
    flatAddersPerWindow > 0 ? [`Stairwell access: $${flatAddersConfig.stairwellPerWindow} × ${input.quantity}`] : [];

  const singleWindowTotal = basePrice + perSqftAdders + flatAddersPerWindow;
  const qty = Math.max(1, input.quantity);
  const windowTotal = singleWindowTotal * qty;
  const flatAdders = flatAddersPerWindow * qty;
  const displayLabel = qty > 1 ? `${input.label} (×${qty})` : input.label;
  const breakdown = [
    `Base (${sqft.toFixed(2)} sqft × $${basePricePerSqft}${qty > 1 ? ` × ${qty}` : ""}): $${(basePrice * qty).toFixed(2)}`,
    ...perSqftBreakdown.map((s) => (qty > 1 ? `${s} × ${qty}` : s)),
    ...flatBreakdown,
  ].filter(Boolean);

  return {
    label: displayLabel,
    sqft: Math.round(sqft * 100) / 100,
    basePrice: Math.round((basePrice * qty) * 100) / 100,
    perSqftAdders: Math.round((perSqftAdders * qty) * 100) / 100,
    flatAdders: Math.round(flatAdders * 100) / 100,
    windowTotal: Math.round(windowTotal * 100) / 100,
    breakdown,
  };
}

export function computeProjectEstimate(
  windows: WindowInput[],
  projectType: ProjectType = "residential"
): ProjectEstimate {
  const minimum = (pricingConfig.minimumProjectInvestment as number) ?? 350;
  const roundTo = (pricingConfig.roundToNearest as number) ?? 10;
  const njTaxRate = (pricingConfig as { njTaxRate?: number }).njTaxRate ?? 0.06625;

  const specialEquipmentRequired = windows.some((w) => w.topAbove15Feet);
  const windowLineItems = windows.map((w) => computeWindowLineItem(w, projectType));
  const subtotal = windowLineItems.reduce((sum, item) => sum + item.windowTotal, 0);
  const totalAfterMinimum = Math.max(subtotal, minimum);

  const taxAmount = projectType === "commercial" ? totalAfterMinimum * njTaxRate : 0;
  const totalWithTax = totalAfterMinimum + taxAmount;
  const low = roundToNearest(totalWithTax, roundTo);
  const high = roundToNearest(totalWithTax * 1.15, roundTo);

  return {
    windowLineItems,
    subtotal: Math.round(subtotal * 100) / 100,
    totalAfterMinimum: Math.round(totalAfterMinimum * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalWithTax: Math.round(totalWithTax * 100) / 100,
    low,
    high,
    specialEquipmentRequired,
    canShowPriceRange: !specialEquipmentRequired,
    projectType,
  };
}

export function getPricingConfig() {
  return pricingConfig as {
    minimumProjectInvestment: number;
    estimateRangeLowMultiplier: number;
    estimateRangeHighMultiplier: number;
    roundToNearest: number;
    dimensionMinInches: number;
    dimensionMaxInches: number;
    requireLeadBeforeEstimate: boolean;
    filmTypes: Record<FilmTypeId, { label: string; pricePerSqft: number }>;
    perSqftAdders: {
      woodFrame: number;
      skylight: number;
      customShape: number;
      exteriorInstall: number;
      existingFilmRemovalMin?: number;
      existingFilmRemovalMax?: number;
      frenchPanes?: number;
    };
    flatAdders: { stairwellPerWindow: number };
    commercialPricePerSqftAdder?: number;
    njTaxRate?: number;
  };
}
