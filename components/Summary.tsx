"use client";

import type { ProjectEstimate } from "@/lib/pricing";

interface SummaryProps {
  estimate: ProjectEstimate | null;
  windowCount: number;
  requireLeadBeforeEstimate: boolean;
  leadSubmitted: boolean;
}

export function Summary({
  estimate,
  windowCount,
  requireLeadBeforeEstimate,
  leadSubmitted,
}: SummaryProps) {
  if (windowCount === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <p className="text-slate-500 text-center py-8">Add at least one window to see your estimate.</p>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
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
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Estimate summary</h3>

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
          <p className="text-2xl font-semibold text-slate-900">
            ${estimate.low.toLocaleString()} – ${estimate.high.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">Final pricing confirmed after on-site verification.</p>
        </div>
      )}
    </div>
  );
}
