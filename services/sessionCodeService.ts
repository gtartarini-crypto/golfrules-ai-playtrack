/**
 * SESSION CODE SERVICE
 * -----------------------------------------
 * Responsabilità:
 * - Generare sessionCode deterministici per sessioni parallele
 * - Validare la struttura e la correttezza della data inclusa
 * - Formato: clubId_YYYYMMDD_teeX
 */

export const sessionCodeService = {
  /**
   * Genera un sessionCode.
   * @param clubId Identificativo univoco del club
   * @param date Data in formato YYYY-MM-DD
   * @param tee Identificativo della partenza (es. "tee1", "tee10", "north")
   */
  generate(clubId: string, date: string, tee: string): string {
    // Converte YYYY-MM-DD in YYYYMMDD
    const yyyymmdd = date.replace(/-/g, '');
    return `${clubId}_${yyyymmdd}_${tee}`;
  },

  /**
   * Valida un sessionCode verificando formato e validità della data.
   * Restituisce true se il codice è valido, false altrimenti.
   */
  validate(sessionCode: string): boolean {
    if (!sessionCode || typeof sessionCode !== 'string') return false;

    // Dividiamo il codice cercando i separatori underscore
    // Ci aspettiamo esattamente 3 parti: [clubId] [date] [tee]
    const parts = sessionCode.split('_');
    if (parts.length !== 3) return false;

    const datePart = parts[1];
    
    // Verifica che la parte della data sia composta da esattamente 8 cifre
    if (!/^\d{8}$/.test(datePart)) return false;

    const year = parseInt(datePart.substring(0, 4), 10);
    const month = parseInt(datePart.substring(4, 6), 10);
    const day = parseInt(datePart.substring(6, 8), 10);

    // Range base per mese e giorno
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    // Verifica se è una data reale nel calendario (gestione anni bisestili e mesi corti)
    const dateObj = new Date(year, month - 1, day);
    const isValidDate = (
      dateObj.getFullYear() === year &&
      dateObj.getMonth() === month - 1 &&
      dateObj.getDate() === day
    );

    return isValidDate;
  }
};