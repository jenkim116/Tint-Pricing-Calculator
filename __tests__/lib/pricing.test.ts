import {
  inchesToSqft,
  computeWindowLineItem,
  computeProjectEstimate,
  getPricingConfig,
} from "@/lib/pricing";
import type { WindowInput } from "@/lib/pricing";

const baseWindow: WindowInput = {
  label: "Test",
  quantity: 1,
  widthInches: 36,
  heightInches: 48,
  frameType: "vinyl",
  shape: "rectangle",
  installType: "interior",
  location: "standard",
  topAbove15Feet: false,
  filmTypeId: "solar-ceramic",
};

describe("inchesToSqft", () => {
  it("converts 36x48 inches to 12 sqft", () => {
    expect(inchesToSqft(36, 48)).toBe(12);
  });

  it("converts 12x12 to 1 sqft", () => {
    expect(inchesToSqft(12, 12)).toBe(1);
  });

  it("converts 6x6 to 0.25 sqft", () => {
    expect(inchesToSqft(6, 6)).toBe(0.25);
  });
});

describe("computeWindowLineItem", () => {
  // Pricing uses +1" trim per dimension (37×49 for 36×48) → 12.59 sqft
  it("computes base price only for standard interior rectangle vinyl", () => {
    const item = computeWindowLineItem(baseWindow);
    expect(item.sqft).toBe(12.59);
    expect(item.basePrice).toBe(188.85);
    expect(item.perSqftAdders).toBe(0);
    expect(item.flatAdders).toBe(0);
    expect(item.windowTotal).toBe(188.85);
  });

  it("adds wood frame adder ($1/sqft)", () => {
    const item = computeWindowLineItem({ ...baseWindow, frameType: "wood" });
    expect(item.perSqftAdders).toBe(12.59);
    expect(item.windowTotal).toBe(188.85 + 12.59);
  });

  it("adds skylight adder ($3/sqft)", () => {
    const item = computeWindowLineItem({ ...baseWindow, shape: "skylight" });
    expect(item.perSqftAdders).toBe(37.77);
    expect(item.windowTotal).toBe(226.63);
  });

  it("adds custom shape adder ($3/sqft)", () => {
    const item = computeWindowLineItem({ ...baseWindow, shape: "custom" });
    expect(item.perSqftAdders).toBe(37.77);
    expect(item.windowTotal).toBe(226.63);
  });

  it("adds exterior install adder ($3/sqft)", () => {
    const item = computeWindowLineItem({ ...baseWindow, installType: "exterior" });
    expect(item.perSqftAdders).toBe(37.77);
    expect(item.windowTotal).toBe(226.63);
  });

  it("adds stairwell flat adder ($150)", () => {
    const item = computeWindowLineItem({ ...baseWindow, location: "stairwell" });
    expect(item.flatAdders).toBe(150);
    expect(item.windowTotal).toBe(188.85 + 150);
  });

  it("uses correct base price for different film type", () => {
    const item = computeWindowLineItem({ ...baseWindow, filmTypeId: "solar-reflective" });
    expect(item.basePrice).toBe(151.08); // 12.59 × $12
    expect(item.windowTotal).toBe(151.08);
  });
});

describe("computeProjectEstimate", () => {
  it("sums multiple windows and applies minimum $350", () => {
    const windows: WindowInput[] = [
      { ...baseWindow, widthInches: 24, heightInches: 24 }, // 25×25/144 sqft × 15
      { ...baseWindow, widthInches: 24, heightInches: 24, label: "W2" },
    ];
    const est = computeProjectEstimate(windows);
    expect(est.subtotal).toBe(130.2); // 2 × (4.34 × 15)
    expect(est.totalAfterMinimum).toBe(350);
    expect(est.low).toBe(350);
    expect(est.high).toBe(400);
  });

  it("applies range with low=total, high=total×1.15 rounded to $10", () => {
    const windows: WindowInput[] = [
      { ...baseWindow, widthInches: 48, heightInches: 48 }, // 49×49/144 sqft
    ];
    const est = computeProjectEstimate(windows);
    expect(est.subtotal).toBe(250.1);
    expect(est.totalAfterMinimum).toBe(350);
    expect(est.low).toBe(350);
    expect(est.high).toBe(400);
  });

  it("when subtotal above minimum, range is low=total high=total×1.15", () => {
    const windows: WindowInput[] = [
      { ...baseWindow, widthInches: 60, heightInches: 60 }, // 61×61/144 sqft
    ];
    const est = computeProjectEstimate(windows);
    expect(est.totalAfterMinimum).toBe(387.6);
    expect(est.low).toBe(390);
    expect(est.high).toBe(450);
  });

  it("when subtotal well above minimum, range is low=total high=total×1.15", () => {
    const windows: WindowInput[] = [
      { ...baseWindow, widthInches: 96, heightInches: 60 }, // 97×61/144 sqft
    ];
    const est = computeProjectEstimate(windows);
    expect(est.subtotal).toBe(616.35);
    expect(est.totalAfterMinimum).toBe(616.35);
    expect(est.low).toBe(620);
    expect(est.high).toBe(710);
  });

  it("sets specialEquipmentRequired when any window has topAbove15Feet", () => {
    const windows: WindowInput[] = [
      { ...baseWindow, topAbove15Feet: false },
      { ...baseWindow, label: "High", topAbove15Feet: true },
    ];
    const est = computeProjectEstimate(windows);
    expect(est.specialEquipmentRequired).toBe(true);
    expect(est.canShowPriceRange).toBe(false);
  });

  it("removing windows updates totals (dynamic)", () => {
    const one = computeProjectEstimate([baseWindow]);
    const two = computeProjectEstimate([
      baseWindow,
      { ...baseWindow, label: "W2", widthInches: 36, heightInches: 48 },
    ]);
    expect(two.subtotal).toBe(one.subtotal * 2);
  });
});

describe("getPricingConfig", () => {
  it("returns dimension limits from config", () => {
    const cfg = getPricingConfig();
    expect(cfg.dimensionMinInches).toBe(6);
    expect(cfg.dimensionMaxInches).toBe(200);
  });

  it("returns requireLeadBeforeEstimate", () => {
    const cfg = getPricingConfig();
    expect(typeof cfg.requireLeadBeforeEstimate).toBe("boolean");
  });
});
