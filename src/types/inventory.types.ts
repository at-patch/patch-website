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
