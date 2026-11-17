// Cálculos del inventario de suplementos (sin base de datos).

// Si el usuario todavía no tiene historial, suponemos 3 entrenamientos por semana.
export const ENTRENOS_POR_DEFECTO = 3;

export function entrenosPorSemana(sesionesUltimos28Dias) {
  const promedio = sesionesUltimos28Dias / 4;
  return promedio >= 1 ? Math.round(promedio * 10) / 10 : ENTRENOS_POR_DEFECTO;
}

export function estadoInventario({ stock, dosis, frecuencia, diasAlerta }, entrenosSemana) {
  const tomasRestantes = Math.floor(stock / dosis);
  const tomasPorDia = frecuencia === 'Diario' ? 1 : entrenosSemana / 7;
  const diasRestantes = Math.floor(tomasRestantes / tomasPorDia);

  return {
    tomasRestantes,
    diasRestantes,
    agotado: tomasRestantes === 0,
    requiereReposicion: diasRestantes <= diasAlerta
  };
}

// ¿Toca recordar este suplemento hoy?
export function pendienteHoy({ frecuencia, tomadoHoy, agotado }, entrenasteHoy) {
  if (tomadoHoy || agotado) return false;
  return frecuencia === 'Diario' || entrenasteHoy;
}