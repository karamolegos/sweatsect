// WooCommerce product types
export interface WCProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: string;
  regular_price: string;
  sale_price: string;
  images: { id: number; src: string; alt: string }[];
  attributes: { name: string; options: string[] }[];
  variations: number[];
  stock_status: "instock" | "outofstock" | "onbackorder";
  purchasable: boolean;
}

export interface WCVariation {
  id: number;
  price: string;
  attributes: { name: string; option: string }[];
  stock_status: "instock" | "outofstock";
  purchasable: boolean;
}

export interface WCOrder {
  id: number;
  number: string;
  status: string;
  total: string;
  line_items: {
    id: number;
    name: string;
    product_id: number;
    quantity: number;
    total: string;
    image?: { src: string };
  }[];
}

// Supabase types (mirrors DB schema)
export interface Gym {
  id: string;
  name: string;
  code: string;
  commission_rate: number; // 0.20 = 20%
  active: boolean;
}

export interface Profile {
  user_id: string;
  gym_id: string;
  locked_at: string;
}

export interface Commission {
  id: string;
  order_id: number;
  gym_id: string;
  amount: number;
  status: "pending" | "paid";
  created_at: string;
}

// Cart
export interface CartItem {
  product_id: number;
  variation_id?: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  attributes?: { name: string; option: string }[];
}

// Webhook payload from WooCommerce
export interface WCOrderWebhook {
  id: number;
  number: string;
  status: string;
  total: string;
  currency: string;
  customer_id: number;
  billing: {
    email: string;
    first_name: string;
    last_name: string;
  };
  line_items: {
    name: string;
    quantity: number;
    total: string;
  }[];
  meta_data: {
    key: string;
    value: string;
  }[];
}
