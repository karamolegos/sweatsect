/**
 * WooCommerce REST API client
 * All fetches go server-side — consumer key/secret never hit the browser.
 */

const WC_URL = process.env.NEXT_PUBLIC_WC_URL!;
const WC_KEY = process.env.WC_CONSUMER_KEY!;
const WC_SECRET = process.env.WC_CONSUMER_SECRET!;

function wcAuth(): string {
  return "Basic " + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");
}

export async function wcFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${WC_URL}/wp-json/wc/v3${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: wcAuth(),
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    // On Cloudflare Edge, don't cache API responses by default
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WooCommerce API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// Convenience wrappers
import type { WCProduct, WCVariation, WCOrder } from "@/types";

export async function getProducts(): Promise<WCProduct[]> {
  return wcFetch<WCProduct[]>("/products?per_page=20&status=publish");
}

export async function getProduct(slug: string): Promise<WCProduct> {
  const products = await wcFetch<WCProduct[]>(`/products?slug=${slug}`);
  if (!products.length) throw new Error(`Product not found: ${slug}`);
  return products[0];
}

export async function getVariations(productId: number): Promise<WCVariation[]> {
  return wcFetch<WCVariation[]>(`/products/${productId}/variations`);
}

export async function createOrder(body: object): Promise<WCOrder> {
  return wcFetch<WCOrder>("/orders", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateOrder(
  orderId: number,
  body: object
): Promise<WCOrder> {
  return wcFetch<WCOrder>(`/orders/${orderId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
