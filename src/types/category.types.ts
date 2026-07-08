export interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInput {
  name: string;
  slug: string;
  image?: string;
  order?: number;
}
