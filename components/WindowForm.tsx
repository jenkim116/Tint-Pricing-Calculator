"use client";

import { useFormContext } from "react-hook-form";

function ChevronRightIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

import { getPricingConfig } from "@/lib/pricing";
import type { WindowEntry } from "@/lib/types";
import type { FrameType, ShapeType, FilmTypeId } from "@/lib/types";

const config = getPricingConfig();
const { dimensionMinInches, dimensionMaxInches } = config;
const filmOptions = Object.entries(config.filmTypes).map(([id, { label }]) => ({
  value: id as FilmTypeId,
  label,
}));

const frameOptions: { value: FrameType; label: string }[] = [
  { value: "vinyl", label: "Vinyl" },
  { value: "metal", label: "Metal" },
  { value: "rubberGasket", label: "Rubber Gasket" },
  { value: "wood", label: "Wood" },
];

const shapeOptions: { value: ShapeType; label: string }[] = [
  { value: "rectangle", label: "Rectangle / Square" },
  { value: "skylight", label: "Skylight" },
  { value: "custom", label: "Other (Custom)" },
];

interface WindowFormProps {
  index: number;
  onRemove: () => void;
  canRemove: boolean;
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
}

export function WindowForm({
  index,
  onRemove,
  canRemove,
  isExpanded,
  onExpand,
  onCollapse,
}: WindowFormProps) {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<{ windows: WindowEntry[] }>();

  const label = watch(`windows.${index}.label`);
  const quantity = watch(`windows.${index}.quantity`);
  const topAbove15Feet = watch(`windows.${index}.topAbove15Feet`);
  const location = watch(`windows.${index}.location`);
  const inStairwell = location === "stairwell";
  const widthInches = watch(`windows.${index}.widthInches`);
  const heightInches = watch(`windows.${index}.heightInches`);

  const displayName = (typeof label === "string" && label.trim()) || `Window ${index + 1}`;
  const displayQty = typeof quantity === "number" && quantity >= 1 ? quantity : 1;
  const dimensionsStr =
    widthInches != null && heightInches != null && widthInches > 0 && heightInches > 0
      ? `${widthInches} × ${heightInches} in`
      : "— × — in";

  if (!isExpanded) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onExpand}
            className="flex flex-1 min-w-0 items-center gap-2 text-left rounded-lg hover:bg-slate-50 -m-2 p-2 transition-colors"
          >
            <span className="text-slate-400 shrink-0" aria-hidden>
              <ChevronRightIcon />
            </span>
            <span className="font-medium text-slate-800 truncate">{displayName}</span>
            <span className="text-slate-500 shrink-0">·</span>
            <span className="text-slate-600 text-sm shrink-0">
              {displayQty} {displayQty === 1 ? "window" : "windows"}
            </span>
            <span className="text-slate-500 shrink-0">·</span>
            <span className="text-slate-500 text-sm shrink-0">{dimensionsStr}</span>
          </button>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-sm text-slate-500 hover:text-red-600 transition-colors shrink-0"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-2">
        <input
          type="text"
          className="flex-1 min-w-0 text-lg font-semibold text-slate-800 bg-transparent border border-transparent rounded px-1 -ml-1 hover:border-slate-300 focus:border-slate-400 focus:outline-none"
          placeholder={`Window ${index + 1}`}
          {...register(`windows.${index}.label`, { required: "Name is required" })}
        />
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onCollapse}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-0.5"
            title="Collapse"
          >
            <span className="text-slate-400" aria-hidden>
              <ChevronDownIcon />
            </span>
            <span>Collapse</span>
          </button>
          {canRemove && (
            <>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={onRemove}
                className="text-sm text-slate-500 hover:text-red-600 transition-colors"
              >
                Remove
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Quantity (of windows)</label>
          <input
            type="number"
            min={1}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            {...register(`windows.${index}.quantity`, {
              required: "Required",
              valueAsNumber: true,
              min: { value: 1, message: "Min 1" },
            })}
          />
          {errors.windows?.[index]?.quantity && (
            <p className="mt-1 text-sm text-red-600">{errors.windows[index]?.quantity?.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Width (in)</label>
            <input
              type="number"
              min={0}
              max={dimensionMaxInches}
              step={1}
              placeholder=""
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              value={widthInches === 0 || widthInches === undefined ? "" : widthInches}
              onChange={(e) => {
                const v = e.target.value;
                const n = v === "" ? 0 : parseInt(v, 10);
                setValue(
                  `windows.${index}.widthInches`,
                  Number.isNaN(n) ? 0 : Math.min(dimensionMaxInches, Math.max(0, n)),
                  { shouldValidate: true }
                );
              }}
            />
            {errors.windows?.[index]?.widthInches && (
              <p className="mt-1 text-sm text-red-600">
                {errors.windows[index]?.widthInches?.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Height (in)</label>
            <input
              type="number"
              min={0}
              max={dimensionMaxInches}
              step={1}
              placeholder=""
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              value={heightInches === 0 || heightInches === undefined ? "" : heightInches}
              onChange={(e) => {
                const v = e.target.value;
                const n = v === "" ? 0 : parseInt(v, 10);
                setValue(
                  `windows.${index}.heightInches`,
                  Number.isNaN(n) ? 0 : Math.min(dimensionMaxInches, Math.max(0, n)),
                  { shouldValidate: true }
                );
              }}
            />
            {errors.windows?.[index]?.heightInches && (
              <p className="mt-1 text-sm text-red-600">
                {errors.windows[index]?.heightInches?.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Frame type</label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 bg-white"
            {...register(`windows.${index}.frameType`)}
          >
            <option value="">Select...</option>
            {frameOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Shape</label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 bg-white"
            {...register(`windows.${index}.shape`)}
          >
            <option value="">Select...</option>
            {shapeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Film type</label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 bg-white"
            {...register(`windows.${index}.filmTypeId`)}
          >
            <option value="">Select...</option>
            {filmOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-center">
            <p className="text-sm text-slate-500">Check all that apply</p>
          </div>
          <div className="space-y-3">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-600"
                checked={inStairwell}
                onChange={(e) =>
                  setValue(`windows.${index}.location`, e.target.checked ? "stairwell" : "standard")
                }
              />
              <span className="text-sm font-medium text-slate-800">Located above stairs</span>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-600"
                {...register(`windows.${index}.topAbove15Feet`)}
              />
              <span className="text-sm font-medium text-slate-800">Top of frame exceeds 15 ft</span>
            </label>
            {topAbove15Feet && (
              <p className="ml-7 text-xs text-amber-800">
                This window will require special access equipment. A site assessment and custom quote
                will be provided.
              </p>
            )}
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-600"
                {...register(`windows.${index}.existingFilmRemoval`)}
              />
              <span className="text-sm font-medium text-slate-800">Existing film removal required</span>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-600"
                {...register(`windows.${index}.frenchPanes`)}
              />
              <span className="text-sm font-medium text-slate-800">French panes</span>
              <span className="group relative ml-1 inline-flex text-slate-400 hover:text-slate-600 cursor-help">
                <InfoIcon />
                <span className="pointer-events-none absolute left-0 top-full z-10 mt-1.5 hidden w-56 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-600 shadow-md group-hover:block sm:w-64">
                  French panes are small glass panes arranged in a grid within a window or door frame
                </span>
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
