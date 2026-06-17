import type { Macros } from './macros';

export interface OffProduct {
  name: string;
  per100: Macros;
}

function n1(v: unknown): number {
  const x = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(x) ? Math.round(x * 10) / 10 : 0;
}

/** Construye un OffProduct desde un objeto product de OFF (null si falta nombre o kcal). */
function fromProduct(p: any): OffProduct | null {
  if (!p) return null;
  const nut = p.nutriments ?? {};
  const kcal = nut['energy-kcal_100g'];
  const name = p.product_name && String(p.product_name).trim();
  if (!name || kcal == null || !Number.isFinite(Number(kcal))) return null;
  return {
    name,
    per100: {
      kcal: Math.round(Number(kcal)),
      protein: n1(nut.proteins_100g),
      carbs: n1(nut.carbohydrates_100g),
      fat: n1(nut.fat_100g),
    },
  };
}

/** Parsea la respuesta de producto por código (API v2). Null si no hay producto o kcal. */
export function parseOffProduct(json: any): OffProduct | null {
  if (!json || json.status !== 1) return null;
  return fromProduct(json.product);
}

/** Parsea la respuesta de búsqueda por texto (lista de productos). */
export function parseOffSearch(json: any): OffProduct[] {
  if (!json || !Array.isArray(json.products)) return [];
  const out: OffProduct[] = [];
  const seen = new Set<string>();
  for (const p of json.products) {
    const r = fromProduct(p);
    if (r && !seen.has(r.name.toLowerCase())) {
      seen.add(r.name.toLowerCase());
      out.push(r);
    }
  }
  return out;
}

const UA = { 'User-Agent': 'Momentum/1.0 (app de gimnasio)' };

/** Busca un producto por código de barras en Open Food Facts (requiere internet). */
export async function fetchProduct(barcode: string): Promise<OffProduct | null> {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,nutriments`;
    const res = await fetch(url, { headers: UA });
    if (!res.ok) return null;
    return parseOffProduct(await res.json());
  } catch {
    return null;
  }
}

/** Busca productos por nombre en Open Food Facts (autocompletar; requiere internet). */
export async function searchProducts(query: string): Promise<OffProduct[]> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=12&fields=product_name,nutriments`;
    const res = await fetch(url, { headers: UA });
    if (!res.ok) return [];
    return parseOffSearch(await res.json());
  } catch {
    return [];
  }
}
