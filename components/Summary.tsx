"use client";

import { useState } from "react";
import type { ProjectEstimate } from "@/lib/pricing";

interface SummaryProps {
  estimate: ProjectEstimate | null;
  windowCount: number;
  requireLeadBeforeEstimate: boolean;
  leadSubmitted: boolean;
  /** Pre-filled email for "Email me this estimate" (e.g. from contact form) */
  leadEmail?: string;
}

export function Summary({
  estimate,
  windowCount,
  requireLeadBeforeEstimate,
  leadSubmitted,
  leadEmail,
}: SummaryProps) {
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [emailError, setEmailError] = useState<string | null>(null);
  if (windowCount === 0) {
    return (
      <div className="rounded-xl border border-slate-200 border-t-4 border-t-[#8BD0A3] bg-white p-6 shadow-card">
        <p className="text-slate-500 text-center py-8">Add at least one window to see your estimate.</p>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="rounded-xl border border-slate-200 border-t-4 border-t-[#8BD0A3] bg-white p-6 shadow-card">
        <p className="text-slate-500 text-center py-8">Complete window details to calculate.</p>
      </div>
    );
  }

  const showPriceRange = estimate.canShowPriceRange;
  const specialEquipment = estimate.specialEquipmentRequired;
  const lineItems = estimate?.windowLineItems ?? [];

  const inactiveClasses = specialEquipment ? "text-slate-400 opacity-75" : "";
  const formatPrice = (value: number) => (specialEquipment ? "N/A" : `$${value.toFixed(2)}`);

  return (
    <div className="rounded-xl border border-slate-200 border-t-4 border-t-[#17A147] bg-white p-6 shadow-card">
      <h3 className="text-lg font-semibold text-[#23575E] mb-4">Estimate summary</h3>

      <div className={`space-y-3 text-sm ${inactiveClasses}`}>
        {lineItems.length > 0 ? (
          lineItems.map((item, i) => {
            const total = Number(item.windowTotal);
            const displayTotal = specialEquipment ? "N/A" : (Number.isFinite(total) ? `$${total.toFixed(2)}` : "$0.00");
            return (
              <div
                key={`${item.label}-${i}`}
                className="flex justify-between border-b border-slate-100 pb-2"
              >
                <span className="font-medium">{item.label}</span>
                <span>{displayTotal}</span>
              </div>
            );
          })
        ) : (
          <p className="py-2">No window line items yet.</p>
        )}
      </div>

      <div className={`mt-4 pt-4 border-t border-slate-200 space-y-1 text-sm ${inactiveClasses}`}>
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrice(estimate.subtotal)}</span>
        </div>
        {estimate.totalAfterMinimum > estimate.subtotal && (
          <div className="flex justify-between">
            <span>Minimum project ($350)</span>
            <span>{formatPrice(estimate.totalAfterMinimum)}</span>
          </div>
        )}
        {estimate.taxAmount > 0 && (
          <div className="flex justify-between">
            <span>NJ tax (6.625%)</span>
            <span>{formatPrice(estimate.taxAmount)}</span>
          </div>
        )}
        {estimate.taxAmount > 0 && (
          <div className="flex justify-between font-medium pt-1">
            <span>Total (with tax)</span>
            <span>{formatPrice(estimate.totalWithTax)}</span>
          </div>
        )}
      </div>

      {estimate.specialEquipmentRequired && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm font-medium text-amber-900">
            Special equipment is required. Schedule a free assessment by filling out the form below.
          </p>
        </div>
      )}

      {showPriceRange && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Estimated range</p>
          <p className="text-2xl font-semibold text-[#23575E]">
            ${estimate.low.toLocaleString()} – ${estimate.high.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">Final pricing confirmed after on-site verification.</p>
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-slate-200 space-y-2">
        <p className="text-xs text-slate-500">
          If &quot;Email me this estimate&quot; fails for some addresses, the sender may need to verify a domain at resend.com/domains. You can always use Download PDF to save or share your estimate.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={async () => {
            const email = (leadEmail && leadEmail.trim()) || prompt("Enter your email to receive the estimate:");
            const toSend = (email && typeof email === "string" ? email.trim() : "") || null;
            if (!toSend || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toSend)) {
              setEmailStatus("error");
              setEmailError("Please enter a valid email address.");
              return;
            }
            setEmailStatus("sending");
            setEmailError(null);
            try {
              const { buildEstimatePdfBase64 } = await import("@/lib/estimate-pdf");
              const pdfBase64 = await buildEstimatePdfBase64(estimate);
              const res = await fetch("/api/email-estimate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: toSend, pdfBase64 }),
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) {
                setEmailStatus("error");
                const msg = data?.error || "Failed to send email. Try again or use the Download PDF button below.";
                setEmailError(msg);
                return;
              }
              setEmailStatus("sent");
            } catch (e) {
              setEmailStatus("error");
              setEmailError("Something went wrong. Try again or download the PDF below.");
            }
          }}
          disabled={emailStatus === "sending"}
          className="rounded-lg bg-[#17A147] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#128a3d] disabled:opacity-60 transition-colors"
        >
          {emailStatus === "sending" ? "Sending…" : emailStatus === "sent" ? "Estimate sent" : "Email me this estimate"}
        </button>
        <button
          type="button"
          onClick={async () => {
            const { downloadEstimatePdf } = await import("@/lib/estimate-pdf");
            downloadEstimatePdf(estimate);
          }}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Download PDF
        </button>
        </div>
      </div>
      {emailStatus === "error" && emailError && (
        <p className="mt-2 text-sm text-red-600">{emailError}</p>
      )}
      {emailStatus === "sent" && (
        <p className="mt-2 text-sm text-slate-600">Check your inbox for the estimate PDF.</p>
      )}
    </div>
  );
}
