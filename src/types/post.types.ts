export type PostCategory = "sustainability" | "styling-tips" | "behind-the-scenes";

export interface Post {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: PostCategory;
  author: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostInput {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: PostCategory;
  author?: string;
  published?: boolean;
}
