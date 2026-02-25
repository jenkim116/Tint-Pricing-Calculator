"use client";

import { useFormContext } from "react-hook-form";
import type { LeadInfo } from "@/lib/types";

interface LeadFormProps {
  onSubmit: () => void;
  isSubmitting: boolean;
  disabled?: boolean;
}

export function LeadForm({ onSubmit, isSubmitting, disabled }: LeadFormProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<{ lead: LeadInfo }>();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Contact details</h3>
      <p className="text-sm text-slate-600 mb-4">
        Optional: share your details if you’d like us to follow up. We will not share your data.
      </p>

      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Name (optional)</label>
          <input
            type="text"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            {...register("lead.name")}
          />
          {errors.lead?.name && (
            <p className="mt-1 text-sm text-red-600">{errors.lead.name.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email (optional)</label>
          <input
            type="email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            {...register("lead.email")}
          />
          {errors.lead?.email && (
            <p className="mt-1 text-sm text-red-600">{errors.lead.email.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Phone (optional)</label>
          <input
            type="tel"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            {...register("lead.phone")}
          />
          {errors.lead?.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.lead.phone.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">ZIP code (optional)</label>
          <input
            type="text"
            placeholder="e.g. 07024"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            {...register("lead.zipCode")}
          />
          {errors.lead?.zipCode && (
            <p className="mt-1 text-sm text-red-600">{errors.lead.zipCode.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Notes (optional)</label>
          <textarea
            rows={3}
            placeholder="Any specific questions or project details..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            {...register("lead.notes")}
          />
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-600"
              {...register("lead.smsConsent")}
            />
            <span className="text-sm text-slate-700">
              I agree to receive SMS updates about my estimate and project.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={disabled || isSubmitting}
          className="w-full rounded-lg bg-slate-800 text-white py-3 text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Submitting…" : "Submit my details"}
        </button>
      </form>
    </div>
  );
}
