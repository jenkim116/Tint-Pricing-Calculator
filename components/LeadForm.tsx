"use client";

import { useFormContext } from "react-hook-form";
import type { LeadInfo } from "@/lib/types";

interface LeadFormProps {
  onSubmit: () => void;
  isSubmitting: boolean;
  disabled?: boolean;
  submitError?: string | null;
}

export function LeadForm({ onSubmit, isSubmitting, disabled, submitError }: LeadFormProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<{ lead: LeadInfo }>();

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      {/* Header */}
      <div className="bg-brand px-5 py-6 sm:px-6">
        <div className="mb-2 inline-block rounded-full bg-brand-hover px-3 py-1 text-xs font-medium uppercase tracking-wide text-white">
          Free Assessment
        </div>
        <h3 className="text-xl font-semibold leading-tight text-white sm:text-2xl">
          Lock in your <span className="text-[#8ed4d9]">exact price</span>
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-white/90">
          Your estimate is ready. Book a free on-site visit and we&apos;ll confirm it within 24 hours — no obligation, no cost.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4 p-5 sm:p-6">
        {submitError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {submitError}
          </p>
        )}

        <div>
          <label htmlFor="lead-name" className="mb-1 block text-sm font-medium text-slate-700">
            Full name
          </label>
          <input
            id="lead-name"
            type="text"
            placeholder="Jane Smith"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400"
            {...register("lead.name")}
          />
          {errors.lead?.name && (
            <p className="mt-1 text-sm text-red-600">{errors.lead.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="lead-email" className="mb-1 block text-sm font-medium text-slate-700">
            Email address
          </label>
          <input
            id="lead-email"
            type="email"
            placeholder="jane@email.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400"
            {...register("lead.email")}
          />
          {errors.lead?.email && (
            <p className="mt-1 text-sm text-red-600">{errors.lead.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="lead-phone" className="mb-1 block text-sm font-medium text-slate-700">
            Phone number
          </label>
          <input
            id="lead-phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400"
            {...register("lead.phone")}
          />
          {errors.lead?.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.lead.phone.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="lead-zipCode" className="mb-1 block text-sm font-medium text-slate-700">
            Zip code
          </label>
          <input
            id="lead-zipCode"
            type="text"
            inputMode="numeric"
            maxLength={5}
            placeholder="e.g. 07470"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400"
            {...register("lead.zipCode")}
          />
          {errors.lead?.zipCode && (
            <p className="mt-1 text-sm text-red-600">{errors.lead.zipCode.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={disabled || isSubmitting}
          className="w-full rounded-lg bg-[#17A147] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#128a3d] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Submitting…" : "Book my free assessment →"}
        </button>

        <p className="text-center text-xs text-slate-500">
          🔒 Your details are private and never sold or shared.
        </p>
      </form>
    </div>
  );
}
