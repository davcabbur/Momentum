import type { Macros } from './macros';

export interface BasicFood {
  name: string;
  per100: Macros; // kcal, proteína, carbos, grasa por 100 g
}

/**
 * Catálogo local de alimentos básicos sin procesar (genéricos), en español, con valores
 * por 100 g. Disponible sin conexión y al instante, para cubrir lo que Open Food Facts
 * cubre peor (genéricos crudos/cocidos). Valores aproximados de fuentes públicas
 * (USDA FoodData Central — dominio público — y BEDCA). Orientativos.
 */
export const BASIC_FOODS: BasicFood[] = [
  // Aves, carnes y derivados
  { name: 'Pechuga de pollo', per100: { kcal: 120, protein: 22.5, carbs: 0, fat: 2.6 } },
  { name: 'Muslo de pollo (sin piel)', per100: { kcal: 130, protein: 18, carbs: 0, fat: 6 } },
  { name: 'Pechuga de pavo', per100: { kcal: 115, protein: 24, carbs: 0, fat: 1.5 } },
  { name: 'Ternera magra', per100: { kcal: 131, protein: 21, carbs: 0, fat: 5 } },
  { name: 'Lomo de cerdo', per100: { kcal: 143, protein: 21, carbs: 0, fat: 6 } },
  { name: 'Jamón serrano', per100: { kcal: 240, protein: 31, carbs: 1, fat: 12 } },
  { name: 'Jamón cocido (york)', per100: { kcal: 110, protein: 18, carbs: 1.5, fat: 3.5 } },
  { name: 'Huevo entero', per100: { kcal: 143, protein: 12.6, carbs: 0.7, fat: 9.5 } },
  { name: 'Clara de huevo', per100: { kcal: 52, protein: 11, carbs: 0.7, fat: 0.2 } },
  // Pescados y mariscos
  { name: 'Salmón', per100: { kcal: 208, protein: 20, carbs: 0, fat: 13 } },
  { name: 'Atún fresco', per100: { kcal: 144, protein: 23, carbs: 0, fat: 5 } },
  { name: 'Atún en lata al natural', per100: { kcal: 116, protein: 26, carbs: 0, fat: 1 } },
  { name: 'Merluza', per100: { kcal: 90, protein: 17, carbs: 0, fat: 2.5 } },
  { name: 'Bacalao', per100: { kcal: 82, protein: 18, carbs: 0, fat: 0.7 } },
  { name: 'Gambas', per100: { kcal: 85, protein: 20, carbs: 0, fat: 0.5 } },
  // Lácteos
  { name: 'Leche entera', per100: { kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3 } },
  { name: 'Leche desnatada', per100: { kcal: 34, protein: 3.4, carbs: 5, fat: 0.1 } },
  { name: 'Yogur natural', per100: { kcal: 61, protein: 3.5, carbs: 4.7, fat: 3.3 } },
  { name: 'Yogur griego', per100: { kcal: 100, protein: 9, carbs: 4, fat: 5 } },
  { name: 'Queso fresco batido 0%', per100: { kcal: 50, protein: 9, carbs: 4, fat: 0.2 } },
  { name: 'Requesón', per100: { kcal: 98, protein: 11, carbs: 3.4, fat: 4.3 } },
  { name: 'Queso curado', per100: { kcal: 390, protein: 25, carbs: 1, fat: 32 } },
  { name: 'Mozzarella', per100: { kcal: 280, protein: 22, carbs: 2, fat: 21 } },
  // Cereales, pan y tubérculos
  { name: 'Arroz blanco (cocido)', per100: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 } },
  { name: 'Arroz blanco (crudo)', per100: { kcal: 360, protein: 7, carbs: 79, fat: 0.6 } },
  { name: 'Arroz integral (cocido)', per100: { kcal: 112, protein: 2.6, carbs: 24, fat: 0.9 } },
  { name: 'Pasta (cocida)', per100: { kcal: 158, protein: 5.8, carbs: 31, fat: 0.9 } },
  { name: 'Pasta (cruda)', per100: { kcal: 371, protein: 13, carbs: 75, fat: 1.5 } },
  { name: 'Pan blanco', per100: { kcal: 265, protein: 9, carbs: 49, fat: 3.2 } },
  { name: 'Pan integral', per100: { kcal: 247, protein: 13, carbs: 41, fat: 3.4 } },
  { name: 'Copos de avena', per100: { kcal: 389, protein: 16.9, carbs: 66, fat: 6.9 } },
  { name: 'Patata (cruda)', per100: { kcal: 77, protein: 2, carbs: 17, fat: 0.1 } },
  { name: 'Boniato', per100: { kcal: 86, protein: 1.6, carbs: 20, fat: 0.1 } },
  { name: 'Quinoa (cocida)', per100: { kcal: 120, protein: 4.4, carbs: 21, fat: 1.9 } },
  { name: 'Maíz dulce', per100: { kcal: 86, protein: 3.2, carbs: 19, fat: 1.2 } },
  // Legumbres
  { name: 'Lentejas (cocidas)', per100: { kcal: 116, protein: 9, carbs: 20, fat: 0.4 } },
  { name: 'Garbanzos (cocidos)', per100: { kcal: 164, protein: 8.9, carbs: 27, fat: 2.6 } },
  { name: 'Alubias (cocidas)', per100: { kcal: 127, protein: 8.7, carbs: 23, fat: 0.5 } },
  { name: 'Guisantes', per100: { kcal: 81, protein: 5.4, carbs: 14, fat: 0.4 } },
  // Verduras
  { name: 'Brócoli', per100: { kcal: 34, protein: 2.8, carbs: 7, fat: 0.4 } },
  { name: 'Espinacas', per100: { kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4 } },
  { name: 'Tomate', per100: { kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 } },
  { name: 'Lechuga', per100: { kcal: 15, protein: 1.4, carbs: 2.9, fat: 0.2 } },
  { name: 'Cebolla', per100: { kcal: 40, protein: 1.1, carbs: 9, fat: 0.1 } },
  { name: 'Pimiento', per100: { kcal: 31, protein: 1, carbs: 6, fat: 0.3 } },
  { name: 'Zanahoria', per100: { kcal: 41, protein: 0.9, carbs: 10, fat: 0.2 } },
  { name: 'Calabacín', per100: { kcal: 17, protein: 1.2, carbs: 3.1, fat: 0.3 } },
  { name: 'Champiñones', per100: { kcal: 22, protein: 3.1, carbs: 3.3, fat: 0.3 } },
  { name: 'Judías verdes', per100: { kcal: 31, protein: 1.8, carbs: 7, fat: 0.2 } },
  { name: 'Pepino', per100: { kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1 } },
  { name: 'Berenjena', per100: { kcal: 25, protein: 1, carbs: 6, fat: 0.2 } },
  // Frutas
  { name: 'Manzana', per100: { kcal: 52, protein: 0.3, carbs: 14, fat: 0.2 } },
  { name: 'Plátano', per100: { kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 } },
  { name: 'Naranja', per100: { kcal: 47, protein: 0.9, carbs: 12, fat: 0.1 } },
  { name: 'Fresa', per100: { kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3 } },
  { name: 'Uva', per100: { kcal: 69, protein: 0.7, carbs: 18, fat: 0.2 } },
  { name: 'Pera', per100: { kcal: 57, protein: 0.4, carbs: 15, fat: 0.1 } },
  { name: 'Sandía', per100: { kcal: 30, protein: 0.6, carbs: 8, fat: 0.2 } },
  { name: 'Melón', per100: { kcal: 34, protein: 0.8, carbs: 8, fat: 0.2 } },
  { name: 'Kiwi', per100: { kcal: 61, protein: 1.1, carbs: 15, fat: 0.5 } },
  { name: 'Piña', per100: { kcal: 50, protein: 0.5, carbs: 13, fat: 0.1 } },
  { name: 'Arándanos', per100: { kcal: 57, protein: 0.7, carbs: 14, fat: 0.3 } },
  { name: 'Aguacate', per100: { kcal: 160, protein: 2, carbs: 9, fat: 15 } },
  { name: 'Melocotón', per100: { kcal: 39, protein: 0.9, carbs: 10, fat: 0.3 } },
  { name: 'Mandarina', per100: { kcal: 53, protein: 0.8, carbs: 13, fat: 0.3 } },
  // Frutos secos y grasas
  { name: 'Almendras', per100: { kcal: 579, protein: 21, carbs: 22, fat: 50 } },
  { name: 'Nueces', per100: { kcal: 654, protein: 15, carbs: 14, fat: 65 } },
  { name: 'Cacahuetes', per100: { kcal: 567, protein: 26, carbs: 16, fat: 49 } },
  { name: 'Crema de cacahuete', per100: { kcal: 588, protein: 25, carbs: 20, fat: 50 } },
  { name: 'Pistachos', per100: { kcal: 560, protein: 20, carbs: 28, fat: 45 } },
  { name: 'Aceite de oliva', per100: { kcal: 884, protein: 0, carbs: 0, fat: 100 } },
  { name: 'Mantequilla', per100: { kcal: 717, protein: 0.9, carbs: 0.1, fat: 81 } },
  // Otros básicos
  { name: 'Azúcar', per100: { kcal: 387, protein: 0, carbs: 100, fat: 0 } },
  { name: 'Miel', per100: { kcal: 304, protein: 0.3, carbs: 82, fat: 0 } },
  { name: 'Chocolate negro 85%', per100: { kcal: 600, protein: 8, carbs: 30, fat: 46 } },
  { name: 'Tomate triturado', per100: { kcal: 30, protein: 1.3, carbs: 5, fat: 0.2 } },
];

/** Quita tildes y pasa a minúsculas para buscar sin que importen los acentos. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[áàä]/g, 'a')
    .replace(/[éèë]/g, 'e')
    .replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o')
    .replace(/[úùü]/g, 'u')
    .replace(/ñ/g, 'n');
}

/** Busca alimentos básicos por nombre (sin tildes/mayúsculas); los que empiezan por la query, primero. */
export function searchBasicFoods(query: string, limit = 6): BasicFood[] {
  const q = norm(query.trim());
  if (q.length < 1) return [];
  const matches = BASIC_FOODS.filter((f) => norm(f.name).includes(q));
  matches.sort((a, b) => (norm(a.name).startsWith(q) ? 0 : 1) - (norm(b.name).startsWith(q) ? 0 : 1));
  return matches.slice(0, limit);
}
