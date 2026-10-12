export type Category = {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  sort_order: number;
  created_at?: string;
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  brand: string | null;
  short_description: string | null;
  description: string | null;
  price: number;
  sale_price: number | null;
  image_url: string | null;
  is_preorder: boolean;
  preorder_note: string | null;
  sale_start: string | null;
  sale_end: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at?: string;
  category?: Category | null;
};
