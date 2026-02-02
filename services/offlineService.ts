
import { OFFLINE_RULES } from '../constants';
import { Language } from '../types';

export const searchRuleOffline = (query: string, lang: Language): string => {
  const lowerQuery = query.toLowerCase();
  const rules = OFFLINE_RULES[lang];
  
  // Simple keyword matching score
  const results = rules.map(rule => {
    let score = 0;
    if (rule.title.toLowerCase().includes(lowerQuery)) score += 5;
    if (rule.description.toLowerCase().includes(lowerQuery)) score += 2;
    
    // Check keywords
    rule.keywords.forEach(k => {
      if (lowerQuery.includes(k)) score += 3;
    });

    return { rule, score };
  })
  .filter(r => r.score > 0)
  .sort((a, b) => b.score - a.score);

  if (results.length === 0) {
    switch(lang) {
        case 'it': return "Nessuna regola trovata nel database offline. Prova a riformulare o connettiti a internet.";
        case 'fr': return "Aucune règle trouvée dans la base de données hors ligne. Essayez de reformuler ou connectez-vous à Internet.";
        case 'de': return "Keine Regeln in der Offline-Datenbank gefunden. Versuchen Sie es umzuformulieren oder verbinden Sie sich mit dem Internet.";
        case 'es': return "No se encontraron reglas en la base de datos offline. Intenta reformular o conéctate a internet.";
        default: return "No rules found in the offline database. Try rephrasing or connect to the internet.";
    }
  }

  const topRule = results[0].rule;
  const resultTitle = {
      it: 'Risultato Offline',
      en: 'Offline Result',
      fr: 'Résultat Hors Ligne',
      de: 'Offline Ergebnis',
      es: 'Resultado Offline'
  };
  const ruleLabel = {
      it: 'Regola',
      en: 'Rule',
      fr: 'Règle',
      de: 'Regel',
      es: 'Regla'
  };
  const note = {
      it: 'Nota: Questa è una risposta dal database locale. Per casi complessi, connettiti online.',
      en: 'Note: This is a response from the local database. For complex cases, connect online.',
      fr: 'Note : Ceci est une réponse de la base de données locale. Pour les cas complexes, connectez-vous.',
      de: 'Hinweis: Dies ist eine Antwort aus der lokalen Datenbank. Für komplexe Fälle online verbinden.',
      es: 'Nota: Esta es una respuesta de la base de datos local. Para casos complejos, conéctate online.'
  };
  
  // Format as a simple markdown response
  return `
### ${resultTitle[lang]} (${ruleLabel[lang]} ${topRule.id})

**${topRule.title}**

${topRule.description}

_${note[lang]}_
  `;
};