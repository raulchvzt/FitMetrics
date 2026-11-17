// Recharts dibuja en SVG con colores fijos: aquí van los de cada tema
const COLORES = {
  oscuro: { dato: '#D4FF3F', superficie: '#161616', rejilla: '#2A2A2A', ejes: '#A3A3A3', cursor: '#6B6B6B', resalte: 'rgba(255,255,255,0.05)' },
  claro: { dato: '#65A30D', superficie: '#FFFFFF', rejilla: '#E2E2DC', ejes: '#6B6B6B', cursor: '#A3A3A3', resalte: 'rgba(0,0,0,0.05)' }
};

export function coloresGrafica(tema) {
  return COLORES[tema] ?? COLORES.oscuro;
}
