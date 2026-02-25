import type { FilmTypeId, FrameType, ShapeType, LocationType } from "./pricing";

export interface WindowEntry {
  id: string;
  label: string;
  quantity: number;
  widthInches: number;
  heightInches: number;
  frameType: FrameType | "";
  shape: ShapeType | "";
  location: LocationType;
  topAbove15Feet: boolean;
  existingFilmRemoval: boolean;
  filmTypeId: FilmTypeId | "";
}

export interface LeadInfo {
  name: string;
  email: string;
  phone: string;
  zipCode: string;
  notes: string;
  smsConsent: boolean;
}

export type { FilmTypeId, FrameType, ShapeType, LocationType };
