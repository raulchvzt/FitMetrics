export const UNIDADES = ['kg', 'lb'];

const KG_POR_LB = 0.45359237;

// Convierte lo que capturó el usuario a kg para guardarlo (3 decimales)
export function aKg(valor, unidad) {
  const kg = unidad === 'lb' ? valor * KG_POR_LB : valor;
  return Math.round(kg * 1000) / 1000;
}

// Convierte de kg a la unidad del usuario para mostrarlo (2 decimales)
export function desdeKg(kg, unidad) {
  if (kg === null || kg === undefined) return null;
  const valor = unidad === 'lb' ? kg / KG_POR_LB : kg;
  return Math.round(valor * 100) / 100;
}