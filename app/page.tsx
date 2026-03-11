"use client";

import { useCallback, useState } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getPricingConfig, computeProjectEstimate } from "@/lib/pricing";
import type { WindowEntry, LeadInfo } from "@/lib/types";
import type { FilmTypeId, FrameType, ShapeType, LocationType } from "@/lib/types";
import { WindowForm } from "@/components/WindowForm";
import { Summary } from "@/components/Summary";
import { LeadForm } from "@/components/LeadForm";

const config = getPricingConfig();
const { dimensionMinInches, dimensionMaxInches, requireLeadBeforeEstimate } = config;

const windowSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Name is required"),
  quantity: z.number().min(1, "Min 1"),
  widthInches: z
    .number()
    .min(0, "Min 0")
    .max(dimensionMaxInches, `Max ${dimensionMaxInches} in`),
  heightInches: z
    .number()
    .min(0, "Min 0")
    .max(dimensionMaxInches, `Max ${dimensionMaxInches} in`),
  frameType: z.union([z.enum(["vinyl", "metal", "rubberGasket", "wood"]), z.literal("")]),
  shape: z.union([z.enum(["rectangle", "skylight", "custom"]), z.literal("")]),
  location: z.enum(["standard", "stairwell"]),
  topAbove15Feet: z.boolean(),
  existingFilmRemoval: z.boolean(),
  frenchPanes: z.boolean(),
  filmTypeId: z.string(), // "" = blank
});

const leadSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().min(1, "Email is required").refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), { message: "Invalid email" }),
  phone: z.string().min(1, "Phone number is required"),
  zipCode: z.string().min(1, "Zip code is required").max(5, "Zip code must be 5 digits").regex(/^\d{1,5}$/, "Zip code must be numeric"),
  notes: z.string(),
  smsConsent: z.boolean(),
});

const formSchema = z.object({
  windows: z.array(windowSchema).min(1, "Add at least one window"),
  lead: leadSchema,
});

type FormValues = z.infer<typeof formSchema>;

function createDefaultWindow(index: number = 0): WindowEntry {
  return {
    id: crypto.randomUUID(),
    label: `Window ${index + 1}`,
    quantity: 1,
    widthInches: 0,
    heightInches: 0,
    frameType: "",
    shape: "",
    location: "standard",
    topAbove15Feet: false,
    existingFilmRemoval: false,
    frenchPanes: false,
    filmTypeId: "",
  };
}

const defaultValues: FormValues = {
  windows: [createDefaultWindow(0)],
  lead: {
    name: "",
    email: "",
    phone: "",
    zipCode: "",
    notes: "",
    smsConsent: false,
  },
};

export default function Home() {
  const [projectType, setProjectType] = useState<"residential" | "commercial">("residential");
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadSubmitError, setLeadSubmitError] = useState<string | null>(null);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [windowExpandState, setWindowExpandState] = useState<{
    expanded: Set<number>;
    hasBeenAutoCollapsed: Set<number>;
  }>({ expanded: new Set([0]), hasBeenAutoCollapsed: new Set() });

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange",
  });

  const { control, watch, getValues, setValue } = methods;
  const { fields, append, remove, replace } = useFieldArray({ control, name: "windows" });

  const handleAddWindow = useCallback(() => {
    const current = getValues("windows") ?? [];
    const nextIndex = current.length;
    const next = [...current, createDefaultWindow(nextIndex)];
    replace(next);
    setWindowExpandState((prev) => {
      const nextExpanded = new Set(prev.expanded);
      nextExpanded.add(nextIndex);
      const nextAuto = new Set(prev.hasBeenAutoCollapsed);
      for (let i = 0; i < nextIndex; i++) {
        if (!nextAuto.has(i)) {
          nextAuto.add(i);
          nextExpanded.delete(i);
        }
      }
      return { expanded: nextExpanded, hasBeenAutoCollapsed: nextAuto };
    });
  }, [getValues, replace]);

  // Subscribe to entire form so we re-render when any field changes. Compute estimate every render
  // so edits to window fields (after e.g. submitting lead) always update the summary; watch("windows")
  // can keep the same reference when nested fields change, so useMemo would not recompute.
  watch();
  const watchedWindows = watch("windows");

  const estimate =
    !watchedWindows?.length
      ? null
      : computeProjectEstimate(
          watchedWindows.map((w) => ({
            label: w.label || "Window",
            quantity: Math.max(1, w.quantity ?? 1),
            widthInches: Math.max(0, Number(w?.widthInches) || 0),
            heightInches: Math.max(0, Number(w?.heightInches) || 0),
            frameType: w.frameType ?? "",
            shape: w.shape ?? "",
            installType: "interior" as const,
            location: w.location as LocationType,
            topAbove15Feet: !!w.topAbove15Feet,
            existingFilmRemoval: !!w.existingFilmRemoval,
            frenchPanes: !!w.frenchPanes,
            filmTypeId: (w.filmTypeId ?? "") as FilmTypeId,
          })),
          projectType
        );

  const handleLeadSubmit = useCallback(async () => {
    const lead = methods.getValues("lead");
    const windows = methods.getValues("windows");
    const payload = {
      projectType,
      lead,
      estimate: estimate ?? null,
      windows: windows.map((w) => ({
        label: w.label,
        quantity: w.quantity,
        widthInches: w.widthInches,
        heightInches: w.heightInches,
        frameType: w.frameType,
        shape: w.shape,
        location: w.location,
        topAbove15Feet: w.topAbove15Feet,
        existingFilmRemoval: w.existingFilmRemoval,
        frenchPanes: w.frenchPanes,
        filmTypeId: w.filmTypeId,
      })),
    };
    setLeadSubmitError(null);
    setIsSubmittingLead(true);
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLeadSubmitError(data.error || "Submission failed. Please try again.");
        return;
      }
      setLeadSubmitted(true);
    } catch (e) {
      console.error(e);
      setLeadSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmittingLead(false);
    }
  }, [estimate, methods, projectType]);

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen w-full max-w-[100vw] bg-slate-50 overflow-x-hidden flex flex-col items-center">
        <header className="w-full border-b-2 border-brand bg-white shadow-sm">
          <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 text-center box-border">
            <div className="flex justify-center mb-4">
              {/* Add your logo file to public/logo.png (or .svg) */}
              <img
                src="/logo.png"
                alt="Vizta Tint of North Jersey"
                className="h-12 w-auto object-contain sm:h-14"
              />
            </div>
            <h1 className="text-2xl font-semibold text-brand sm:text-3xl">
              Instant Window Film Estimate
            </h1>
            <p className="mt-3 text-sm text-slate-600">
              Vizta Tint of North Jersey –
              <span className="block sm:inline">Architectural Window Film Installation</span>
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-slate-600">
              <a href="tel:973-313-5313" className="hover:text-brand hover:underline">
                973-313-5313
              </a>
              <span aria-hidden="true">•</span>
              <a href="mailto:nj@viztatint.com" className="hover:text-brand hover:underline">
                nj@viztatint.com
              </a>
              <span aria-hidden="true">•</span>
              <a
                href="https://www.viztatintnj.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand hover:underline"
              >
                www.viztatintnj.com
              </a>
            </div>
          </div>
        </header>

        <main className="w-full max-w-4xl px-4 py-8 sm:px-6 box-border flex-1">
          <div className="grid gap-8 lg:grid-cols-[1fr,320px] min-w-0 w-full max-w-full">
            <div className="space-y-6 min-w-0 w-full">
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card min-w-0 max-w-full">
                <h2 className="text-lg font-semibold text-brand mb-3">Project type</h2>
                <div className="flex rounded-lg border border-brand p-1 bg-slate-100">
                  <button
                    type="button"
                    onClick={() => setProjectType("residential")}
                    className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                      projectType === "residential"
                        ? "bg-brand text-white shadow-sm"
                        : "text-slate-600 hover:text-brand"
                    }`}
                  >
                    Residential
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjectType("commercial")}
                    className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                      projectType === "commercial"
                        ? "bg-brand text-white shadow-sm"
                        : "text-slate-600 hover:text-brand"
                    }`}
                  >
                    Commercial
                  </button>
                </div>
              </section>

              <section>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <WindowForm
                      key={field.id}
                      index={index}
                      onRemove={() => {
                        if (fields.length === 1) {
                          const id = fields[0].id;
                          setValue("windows", [{ ...createDefaultWindow(0), id }], {
                            shouldValidate: false,
                            shouldDirty: true,
                          });
                          setWindowExpandState((prev) => ({
                            ...prev,
                            expanded: new Set([0]),
                            hasBeenAutoCollapsed: new Set(),
                          }));
                        } else {
                          remove(index);
                          setWindowExpandState((prev) => {
                            const expanded = new Set(
                              Array.from(prev.expanded).filter((i) => i !== index).map((i) => (i > index ? i - 1 : i))
                            );
                            const hasBeenAutoCollapsed = new Set(
                              Array.from(prev.hasBeenAutoCollapsed).filter((i) => i !== index).map((i) => (i > index ? i - 1 : i))
                            );
                            if (expanded.size === 0) expanded.add(Math.max(0, index - 1));
                            return { expanded, hasBeenAutoCollapsed };
                          });
                        }
                      }}
                      canRemove={true}
                      isExpanded={windowExpandState.expanded.has(index)}
                      onExpand={() =>
                        setWindowExpandState((prev) => ({
                          ...prev,
                          expanded: new Set(prev.expanded).add(index),
                        }))
                      }
                      onCollapse={() =>
                        setWindowExpandState((prev) => {
                          const expanded = new Set(prev.expanded);
                          expanded.delete(index);
                          return { ...prev, expanded };
                        })
                      }
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddWindow}
                  className="mt-4 w-full rounded-lg border-2 border-dashed border-brand-light py-3 text-sm font-medium text-brand hover:border-brand hover:bg-brand-50 transition-colors"
                >
                  + Add another window
                </button>
              </section>

            </div>

            <aside className="lg:sticky lg:top-6 lg:self-start space-y-6 min-w-0 w-full max-w-full">
              <Summary
                estimate={estimate}
                windowCount={fields.length}
                requireLeadBeforeEstimate={requireLeadBeforeEstimate}
                leadSubmitted={leadSubmitted}
                leadEmail={watch("lead.email")}
              />
              <section id="lead-form">
                <LeadForm
                  onSubmit={handleLeadSubmit}
                  isSubmitting={isSubmittingLead}
                  disabled={false}
                  submitError={leadSubmitError}
                />
              </section>
            </aside>
          </div>
        </main>

        <footer className="w-full border-t border-brand-light bg-white mt-12 py-6">
          <div className="mx-auto w-full max-w-4xl px-4 text-center text-xs text-slate-500 box-border">
            <p>© Vizta Tint of North Jersey. Estimates are not binding. Final pricing confirmed after verifying glass type, access, and site conditions.</p>
          </div>
        </footer>
      </div>
    </FormProvider>
  );
}
