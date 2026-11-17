let contexto = null;

// Se llama al tocar "Registrar serie": los navegadores (sobre todo Safari)
// solo permiten activar el audio como respuesta a un toque del usuario.
export function prepararAviso() {
  try {
    const Contexto = window.AudioContext || window.webkitAudioContext;
    if (!Contexto) return;
    contexto ??= new Contexto();
    if (contexto.state === 'suspended') contexto.resume();
  } catch {
    contexto = null;
  }
}

export function sonarAviso() {
  try {
    if (contexto) {
      const inicio = contexto.currentTime;
      [0, 0.25, 0.5].forEach((retraso) => {
        const oscilador = contexto.createOscillator();
        const volumen = contexto.createGain();
        oscilador.frequency.value = 880;
        volumen.gain.setValueAtTime(0.0001, inicio + retraso);
        volumen.gain.exponentialRampToValueAtTime(0.3, inicio + retraso + 0.02);
        volumen.gain.exponentialRampToValueAtTime(0.0001, inicio + retraso + 0.18);
        oscilador.connect(volumen).connect(contexto.destination);
        oscilador.start(inicio + retraso);
        oscilador.stop(inicio + retraso + 0.2);
      });
    }
    navigator.vibrate?.([200, 100, 200]);
  } catch {
    /* sin audio ni vibración disponibles */
  }
}