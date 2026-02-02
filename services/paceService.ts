/**
 * Calcola il tempo target cumulativo considerando la buca di partenza.
 * Supporta partenze dal Tee 1, Tee 10 o Shotgun.
 */
export const getTargetMinutesForHole = (
  config: Record<number, number>,
  startHole: number,
  currentHole: number
): number => {
  if (!config || currentHole <= 0) return 0;

  // Ottimizzazione: se siamo alla buca di partenza, il target è solo il tempo di quella buca
  if (startHole === currentHole) {
    return config[currentHole] || 0;
  }

  let totalTarget = 0;
  let holePointer = startHole;
  const maxHoles = 18; // Standard golf course

  // Somma i tempi dalla buca di partenza fino alla buca corrente
  // Gestisce il "wrap around" (es: partenza alla 10, arrivo alla 2)
  let safetyCounter = 0;
  while (holePointer !== currentHole && safetyCounter < maxHoles) {
    totalTarget += config[holePointer] || 0;
    
    holePointer++;
    if (holePointer > maxHoles) holePointer = 1; // Ritorna alla 1 dopo la 18
    safetyCounter++;
  }
  
  // Aggiunge il tempo della buca corrente (tempo per finire la buca in cui si trova)
  totalTarget += config[currentHole] || 0;

  return totalTarget;
};

/**
 * Calcola la differenza tra tempo trascorso e tempo target.
 */
export const calculateDelayMinutes = (
  startTimeMs: number,
  targetMinutes: number
): number => {
  const now = Date.now();
  const elapsedMinutes = Math.floor((now - startTimeMs) / 60000);
  return elapsedMinutes - targetMinutes;
};