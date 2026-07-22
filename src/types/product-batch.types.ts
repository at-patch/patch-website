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
  primaryPromo?: HomepagePromo;
  secondaryPromo?: HomepagePromo;
  productBatches: HomepageBatchSetting[];
  createdAt: string;
  updatedAt: string;
}

export interface HomepagePromo {
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface AboutNarrative {
  title: string;
  body: string;
  image?: string;
}

export interface AboutSettings {
  _id: string;
  key: "about";
  eyebrow: string;
  heroTitle: string;
  narratives: AboutNarrative[];
  createdAt: string;
  updatedAt: string;
}
