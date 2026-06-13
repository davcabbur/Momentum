import type { Macros } from './macros';

export interface OffProduct {
  name: string;
  per100: Macros;
}

function n1(v: unknown): number {
  const x = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(x) ? Math.round(x * 10) / 10 : 0;
}

/** Parsea la respuesta de Open Food Facts (API v2). Devuelve null si no hay producto o kcal. */
export function parseOffProduct(json: any): OffProduct | null {
  if (!json || json.status !== 1 || !json.product) return null;
  const p = json.product;
  const nut = p.nutriments ?? {};
  const kcal = nut['energy-kcal_100g'];
  if (kcal == null || !Number.isFinite(Number(kcal))) return null;
  return {
    name: (p.product_name && String(p.product_name).trim()) || 'Producto',
    per100: {
      kcal: Math.round(Number(kcal)),
      protein: n1(nut.proteins_100g),
      carbs: n1(nut.carbohydrates_100g),
      fat: n1(nut.fat_100g),
    },
  };
}

/** Busca un producto por código de barras en Open Food Facts (requiere internet). */
export async function fetchProduct(barcode: string): Promise<OffProduct | null> {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,nutriments`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Momentum/1.0 (app de gimnasio)' } });
    if (!res.ok) return null;
    return parseOffProduct(await res.json());
  } catch {
    return null;
  }
}
