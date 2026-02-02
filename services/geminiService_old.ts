import { GoogleGenAI } from "@google/genai";
import { GameContext, Language, IdentifiedCourse } from '../types';

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const getSystemInstruction = (lang: Language, localRules?: string): string => {
  const instructions = {
    it: `Sei Marshall AI, un esperto arbitro di golf. Il tuo compito è fornire risposte istantanee, chiare e professionali ai giocatori in campo.
    
    LINEE GUIDA PER LA RISPOSTA:
    1. PRIORITÀ REGOLE LOCALI: Se l'utente ha caricato delle Regole Locali, usale sempre come prima fonte. Se il club consente di piazzare la palla o ha regole speciali sui cart, menzionalo subito.
    2. CONCISIONE ESTREMA: Il giocatore è in gara. Non fare introduzioni. Vai dritto al punto: cosa fare e quante penalità.
    3. STRUTTURA: Usa elenchi puntati se ci sono più opzioni (es. opzioni di soccorso).
    4. CITAZIONI: Cita sempre la Regola USGA/R&A (es. Regola 17.1).
    5. CONTESTO ATTUALE: Adatta la risposta all'Area (es. Bunker) e al Lie (es. Infossata) forniti.
    
    REGOLE LOCALI DEL CLUB ATTUALE:
    ${localRules || "Segui il regolamento standard USGA/R&A. Non sono state fornite regole locali specifiche."}`,
    
    en: `You are Marshall AI, an expert golf referee. Provide instant, clear, and professional answers to players on the course.
    
    RESPONSE GUIDELINES:
    1. LOCAL RULES PRIORITY: If Local Rules are provided, use them as the primary source. If ball placement is allowed or special cart rules apply, mention them first.
    2. EXTREME CONCISE: The player is playing. No fluff. Get straight to the point: what to do and how many penalty strokes.
    3. STRUCTURE: Use bullet points for relief options.
    4. CITATIONS: Always cite the official USGA/R&A Rule (e.g., Rule 17.1).
    5. CONTEXT: Adapt the response to the provided Area and Lie.
    
    CURRENT CLUB LOCAL RULES:
    ${localRules || "Follow standard USGA/R&A rules. No specific local rules provided."}`
  };
  return instructions[lang] || instructions['en'];
};

interface SearchResult {
  text: string;
  generatedImage?: string;
}

const generateDiagram = async (situationDescription: string): Promise<string | undefined> => {
  try {
    const ai = getAiClient();
    const prompt = `Technical golf diagram (top-down view, clean 2D style): ${situationDescription}. Show relief area and reference point. White background.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return undefined;
  } catch (e) { return undefined; }
};

export const searchRuleOnline = async (
  query: string, 
  context: GameContext,
  lang: Language,
  imageBase64?: string | null,
  localRules?: string
): Promise<SearchResult> => {
  try {
    const ai = getAiClient();
    const promptText = `PLAYER SITUATION: "${query}"
    ENVIRONMENT: Location=${context.location}, Lie=${context.lie}`;

    const parts: any[] = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } });
    }
    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: { 
        systemInstruction: getSystemInstruction(lang, localRules),
        temperature: 0.1, 
      },
    });

    const textResponse = response.text || (lang === 'it' ? "Spiacente, non ho trovato una regola specifica." : "Sorry, I couldn't find a specific rule.");
    let generatedImage: string | undefined = undefined;
    
    const needsDiagram = ['drop', 'soccorso', 'relief', 'punto più vicino', 'nearest point'].some(k => textResponse.toLowerCase().includes(k));
    if (needsDiagram) {
      generatedImage = await generateDiagram(query);
    }

    return { text: textResponse, generatedImage };
  } catch (error) { 
    console.error("Gemini Error:", error);
    throw error; 
  }
};

export const transcribeLocalRules = async (base64Data: string, mimeType: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { 
        parts: [
          { inlineData: { mimeType, data: cleanBase64 } }, 
          { text: "Trascrivi fedelmente il testo di questo regolamento locale di golf." }
        ] 
      }
    });
    return response.text || "";
  } catch (error) { throw new Error("Transcription failed"); }
};

export const identifyCourseByLocation = async (lat: number, lon: number): Promise<IdentifiedCourse[]> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { 
        parts: [{ text: `Identify Golf Clubs within 50km of: ${lat}, ${lon}. Return JSON only: [{"club": "Name", "country": "Italy", "latitude": 45.1, "longitude": 9.1}]` }] 
      },
      config: { 
        tools: [{ googleMaps: {} }], 
        toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lon } } },
      }
    });
    const jsonMatch = response.text?.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch (error) { return []; }
};