/**
 * Client-side PDF generation for the estimate summary (no contact details).
 * Used by the "Email me this estimate" and "Download PDF" actions.
 */

import type { ProjectEstimate } from "@/lib/pricing";

// Dynamic import so jspdf only loads in the browser when needed
async function getJsPDF() {
  const { jsPDF } = await import("jspdf");
  return jsPDF;
}

function formatPrice(value: number, specialEquipment: boolean): string {
  return specialEquipment ? "N/A" : `$${value.toFixed(2)}`;
}

export async function buildEstimatePdfBase64(estimate: ProjectEstimate): Promise<string> {
  const JsPDF = await getJsPDF();
  const doc = new JsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 40;
  const lineHeight = 16;
  const left = 40;

  const specialEquipment = estimate.specialEquipmentRequired;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Window Film Estimate", left, y);
  y += lineHeight * 1.5;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Vizta Tint of North Jersey", left, y);
  y += lineHeight * 1.2;

  // Line items
  doc.setFont("helvetica", "bold");
  doc.text("Window line items", left, y);
  y += lineHeight;

  doc.setFont("helvetica", "normal");
  const lineItems = estimate.windowLineItems ?? [];
  for (const item of lineItems) {
    const total = Number(item.windowTotal);
    const displayTotal = specialEquipment ? "N/A" : (Number.isFinite(total) ? `$${total.toFixed(2)}` : "$0.00");
    doc.text(item.label, left, y);
    doc.text(displayTotal, pageWidth - left - 80, y, { align: "right" });
    y += lineHeight;
  }

  y += lineHeight * 0.5;
  doc.setDrawColor(200, 200, 200);
  doc.line(left, y, pageWidth - left, y);
  y += lineHeight;

  doc.text("Subtotal", left, y);
  doc.text(formatPrice(estimate.subtotal, specialEquipment), pageWidth - left - 80, y, { align: "right" });
  y += lineHeight;

  if (estimate.totalAfterMinimum > estimate.subtotal) {
    doc.text("Minimum project ($350)", left, y);
    doc.text(formatPrice(estimate.totalAfterMinimum, specialEquipment), pageWidth - left - 80, y, { align: "right" });
    y += lineHeight;
  }

  if (estimate.taxAmount > 0) {
    doc.text("NJ tax (6.625%)", left, y);
    doc.text(formatPrice(estimate.taxAmount, specialEquipment), pageWidth - left - 80, y, { align: "right" });
    y += lineHeight;
    doc.setFont("helvetica", "bold");
    doc.text("Total (with tax)", left, y);
    doc.text(formatPrice(estimate.totalWithTax, specialEquipment), pageWidth - left - 80, y, { align: "right" });
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
    y += lineHeight;
    doc.setFont("helvetica", "bold");
    doc.text(
      `Estimated range: $${estimate.low.toLocaleString()} – $${estimate.high.toLocaleString()}`,
      left,
      y
    );
    doc.setFont("helvetica", "normal");
    y += lineHeight;
    doc.setFontSize(9);
    doc.text("Final pricing confirmed after on-site verification.", left, y);
    doc.setFontSize(10);
    y += lineHeight;
  }

  y += lineHeight;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Estimates are not binding. Final pricing confirmed after verifying glass type, access, and site conditions.", left, y, { maxWidth: pageWidth - 2 * left });
  doc.setTextColor(0, 0, 0);

  const output = doc.output("arraybuffer");
  const bytes = new Uint8Array(output);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(bytes).toString("base64");
}

export function downloadEstimatePdf(estimate: ProjectEstimate, filename = "vizta-tint-estimate.pdf"): void {
  buildEstimatePdfBase64(estimate).then((base64) => {
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${base64}`;
    link.download = filename;
    link.click();
  });
}
