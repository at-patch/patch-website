import type { Product } from "./product.types";

export interface ProductBatch {
  _id: string;
  title: string;
  description?: string;
  products: string[] | Product[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HomepageBatchSetting {
  batch: string | ProductBatch;
  enabled: boolean;
  order: number;
}

export interface HomepageSettings {
  _id: string;
  key: "homepage";
  productBatches: HomepageBatchSetting[];
  createdAt: string;
  updatedAt: string;
}
