export interface InventoryItem {
  _id: string;
  itemCode: string;
  image: string;
  fabricCode: string;
  category: string;
  heightInches: number;
  widthInches: number;
  quantityPcs: number;
  description?: string;
  productTags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItemInput {
  image: string;
  fabricCode: string;
  category: string;
  heightInches: number;
  widthInches: number;
  quantityPcs: number;
  description?: string;
  productTags?: string[];
}

export interface Pattern {
  _id: string;
  patternCode: string;
  patternImage: string;
  fabricCode: string;
  sampleCode?: string;
  fabAmount1: string;
  fabricAmount2: string;
  size1: number;
  size2: number;
  createdAt: string;
  updatedAt: string;
}

export interface PatternInput {
  patternImage: string;
  fabricCode: string;
  sampleCode?: string;
  fabAmount1: string;
  fabricAmount2: string;
  size1: number;
  size2: number;
}

export interface ShippingCity {
  _id: string;
  name: string;
  slug: string;
  division?: string;
  shippingCost: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingCityInput {
  name: string;
  division?: string;
  shippingCost: number;
  isActive?: boolean;
}

export type ShippingZoneScope = "country" | "district";

export interface ShippingZone {
  _id: string;
  countryCode: string;
  countryName: string;
  scope: ShippingZoneScope;
  district?: string;
  districtSlug?: string;
  baseRate: number;
  additionalKgRate: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingZoneInput {
  countryCode: string;
  countryName: string;
  scope: ShippingZoneScope;
  district?: string;
  baseRate: number;
  additionalKgRate: number;
  currency?: string;
  isActive?: boolean;
}

export interface ShippingDestination {
  id: string;
  countryCode: string;
  countryName: string;
  scope: ShippingZoneScope;
  district?: string;
  districtSlug?: string;
  currency: string;
  legacy?: boolean;
}

export type CourierClass = "premium" | "express" | "economy";

export interface CourierClassOption {
  courierClass: CourierClass;
  shippingCost: number;
}

export interface ShippingQuote {
  destination: ShippingDestination;
  totalWeightKg: number;
  chargeableWeightKg: number;
  shippingCost: number;
  currency: string;
  courierClass?: CourierClass;
  availableClasses?: CourierClassOption[];
}
