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

/**
 * Parsea la respuesta de búsqueda por texto. Soporta el servicio nuevo (search-a-licious,
 * campo `hits`) y el antiguo (`products`).
 */
export function parseOffSearch(json: any): OffProduct[] {
  const arr = json && (Array.isArray(json.hits) ? json.hits : Array.isArray(json.products) ? json.products : null);
  if (!arr) return [];
  const out: OffProduct[] = [];
  const seen = new Set<string>();
  for (const p of arr) {
    const r = fromProduct(p);
    if (r && !seen.has(r.name.toLowerCase())) {
      seen.add(r.name.toLowerCase());
      out.push(r);
    }
  }
  return out;
}

const UA = { 'User-Agent': 'Momentum/1.0 (app de gimnasio)' };

/** fetch con timeout (aborta si tarda demasiado, para no dejar la búsqueda colgada). */
async function fetchWithTimeout(url: string, ms: number): Promise<Response | null> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { headers: UA, signal: ctrl.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

/** Busca un producto por código de barras en Open Food Facts (requiere internet). */
export async function fetchProduct(barcode: string): Promise<OffProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,nutriments`;
  const res = await fetchWithTimeout(url, 8000);
  if (!res || !res.ok) return null;
  try {
    return parseOffProduct(await res.json());
  } catch {
    return null;
  }
}

/**
 * Busca productos por nombre (autocompletar; requiere internet). Usa el servicio de
 * búsqueda nuevo de OFF (search-a-licious), mucho más rápido que el cgi antiguo.
 */
export async function searchProducts(query: string): Promise<OffProduct[]> {
  const url = `https://search.openfoodfacts.org/search?q=${encodeURIComponent(query)}&page_size=20&fields=product_name,nutriments`;
  const res = await fetchWithTimeout(url, 8000);
  if (!res || !res.ok) return [];
  try {
    return parseOffSearch(await res.json());
  } catch {
    return [];
  }
}
