/**
 * DATE SCOPING SERVICE
 * -----------------------------------------
 * Responsabilità:
 * - Gestire roundDate in formato YYYY-MM-DD
 * - Applicare roundDate ai documenti quando necessario
 * - Non toccare flight attivi o logiche esistenti
 * - Supportare analytics storiche
 */

export const dateScopingService = {
  /**
   * Restituisce la data odierna in formato YYYY-MM-DD.
   * Utilizza la data locale del sistema senza dipendenze esterne.
   */
  getToday(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  },

  /**
   * Aggiunge roundDate a un payload Firestore se non presente.
   * Restituisce un nuovo oggetto per mantenere l'immutabilità se necessario.
   */
  attachDate(data: any): any {
    // Se roundDate esiste già, restituiamo i dati invariati
    if (data && data.roundDate) {
      return data;
    }

    // Altrimenti aggiungiamo roundDate usando getToday()
    return {
      ...data,
      roundDate: this.getToday()
    };
  }
};