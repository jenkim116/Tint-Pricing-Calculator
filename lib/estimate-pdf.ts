/**
 * Client-side PDF generation for the estimate summary (no contact details).
 * Used by the "Email me this estimate" and "Download PDF" actions.
 */

import type { ProjectEstimate, WindowLineItem } from "@/lib/pricing";

async function getJsPDF() {
  const { jsPDF } = await import("jspdf");
  return jsPDF;
}

function formatPrice(value: number, specialEquipment: boolean): string {
  return specialEquipment ? "N/A" : `$${value.toFixed(2)}`;
}

function formatDimensions(item: WindowLineItem): string {
  const w = item.widthInches ?? 0;
  const h = item.heightInches ?? 0;
  if (w <= 0 || h <= 0) return "";
  return `${w} x ${h} in`;
}

export async function buildEstimatePdfBase64(estimate: ProjectEstimate): Promise<string> {
  const JsPDF = await getJsPDF();
  const doc = new JsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const left = 40;
  const topMarginPt = 0.75 * 72; // 0.75" from top
  let y = topMarginPt;
  const lineHeight = 16;
  const smallLine = 12;

  const specialEquipment = estimate.specialEquipmentRequired;
  const lineItems = estimate.windowLineItems ?? [];

  // Top: Vizta Tint of North Jersey (centered)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Vizta Tint of North Jersey", pageWidth / 2, y, { align: "center" });
  y += lineHeight;

  // Contact information below (centered)
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("973-313-5313 | nj@viztatint.com | www.viztatintnj.com", pageWidth / 2, y, { align: "center" });
  y += 12;

  // Date generated (centered)
  const dateGenerated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.setFontSize(9);
  doc.text(dateGenerated, pageWidth / 2, y, { align: "center" });
  y += 33; // 33pt above "Window Film Estimate"

  // Document title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Window Film Estimate", left, y);
  y += 22; // 22pt below title (before top grey line)

  // 22pt spacing around key elements only (heading, grey lines, estimated range)
  const spacingPt = 22;
  const lineItemSectionGap = 14; // standardized: heading-to-first-item, between sections, last-item-to-bottom-grey
  const topBandPadding = spacingPt; // 22pt between top grey line and "Line items" heading
  const headingToFirstItemGap = lineItemSectionGap;
  const bottomBandPadding = lineItemSectionGap;
  let blockHeight = 16 + headingToFirstItemGap; // heading line + gap
  for (const item of lineItems) {
    blockHeight += smallLine; // label + total
    const hasDetails =
      item.filmLabel ?? item.widthInches ?? item.frameLabel ?? item.shapeLabel ?? (item.optionLabels?.length ?? 0) > 0;
    if (hasDetails) {
      if (item.filmLabel) blockHeight += smallLine;
      if (item.widthInches && item.heightInches) blockHeight += smallLine;
      if (item.frameLabel || item.shapeLabel) blockHeight += smallLine;
      if (item.optionLabels?.length) blockHeight += item.optionLabels.length * smallLine;
    }
    blockHeight += lineItemSectionGap;
  }

  // First grey line
  doc.setDrawColor(200, 200, 200);
  doc.line(left, y, pageWidth - left, y);
  y += topBandPadding;

  // "Line items" heading
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Line items", left, y);
  y += 16; // heading line height
  y += headingToFirstItemGap;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  for (const item of lineItems) {
    const total = Number(item.windowTotal);
    const displayTotal = specialEquipment ? "N/A" : (Number.isFinite(total) ? `$${total.toFixed(2)}` : "$0.00");

    doc.setFont("helvetica", "bold");
    doc.text(item.label, left, y);
    doc.text(displayTotal, pageWidth - left, y, { align: "right" });
    y += smallLine;

    doc.setFont("helvetica", "normal");
    const hasDetails =
      item.filmLabel ?? item.widthInches ?? item.frameLabel ?? item.shapeLabel ?? (item.optionLabels?.length ?? 0) > 0;

    if (hasDetails) {
      if (item.filmLabel) {
        doc.text(`Film: ${item.filmLabel}`, left, y);
        y += smallLine;
      }
      const dims = formatDimensions(item);
      if (dims) {
        doc.text(`Dimensions: ${dims} • ${(item.sqft ?? 0).toFixed(2)} sq ft`, left, y);
        y += smallLine;
      }
      if (item.frameLabel && item.shapeLabel) {
        doc.text(`Frame: ${item.frameLabel} • Shape: ${item.shapeLabel}`, left, y);
        y += smallLine;
      } else if (item.frameLabel) {
        doc.text(`Frame: ${item.frameLabel}`, left, y);
        y += smallLine;
      } else if (item.shapeLabel) {
        doc.text(`Shape: ${item.shapeLabel}`, left, y);
        y += smallLine;
      }
      if (item.optionLabels?.length) {
        for (const opt of item.optionLabels) {
          doc.text(opt, left, y);
          y += smallLine;
        }
      }
    }

    y += lineItemSectionGap;
  }

  y += bottomBandPadding;
  doc.line(left, y, pageWidth - left, y);
  y += spacingPt; // 22pt below bottom grey line

  if (estimate.totalAfterMinimum > estimate.subtotal) {
    doc.text("Minimum project ($350)", left, y);
    doc.text(formatPrice(estimate.totalAfterMinimum, specialEquipment), pageWidth - left, y, { align: "right" });
    y += lineHeight;
  }

  if (estimate.taxAmount > 0) {
    doc.text("NJ tax (6.625%)", left, y);
    doc.text(formatPrice(estimate.taxAmount, specialEquipment), pageWidth - left, y, { align: "right" });
    y += lineHeight;
    doc.setFont("helvetica", "bold");
    doc.text("Total (with tax)", left, y);
    doc.text(formatPrice(estimate.totalWithTax, specialEquipment), pageWidth - left, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += lineHeight;
  }

  if (estimate.specialEquipmentRequired) {
    y += lineHeight;
    doc.setFont("helvetica", "bold");
    doc.text("Special equipment required. Schedule a free assessment.", left, y);
    doc.setFont("helvetica", "normal");
    y += lineHeight;
  }

  if (estimate.canShowPriceRange) {
    y += spacingPt; // 22pt above Estimated range
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(
      `Estimated range: $${estimate.low.toLocaleString()} – $${estimate.high.toLocaleString()}`,
      pageWidth - left,
      y,
      { align: "right" }
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y += spacingPt; // 22pt below Estimated range
  }

  y += lineHeight;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "Estimates are not binding. Final pricing confirmed after verifying glass type, access, and site conditions.",
    left,
    y,
    { maxWidth: pageWidth - 2 * left }
  );
  doc.setTextColor(0, 0, 0);

  const output = doc.output("arraybuffer");
  const bytes = new Uint8Array(output);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(bytes).toString("base64");
}

export function downloadEstimatePdf(
  estimate: ProjectEstimate,
  filename = "vizta-tint-estimate.pdf"
): void {
  buildEstimatePdfBase64(estimate).then((base64) => {
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${base64}`;
    link.download = filename;
    link.click();
  });
}
