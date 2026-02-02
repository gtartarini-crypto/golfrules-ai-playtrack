import { GoogleGenAI } from "@google/genai";
import { GameContext, Language, IdentifiedCourse } from '../types';

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const getSystemInstruction = (lang: Language, localRules?: string): string => {
  const instructions = {
    it: `Sei un esperto arbitro di golf (Marshall). Aiuta i giocatori a risolvere dubbi in campo.
    
    REGOLE DI PRIORITÀ:
    1. REGOLE LOCALI: Se fornite, usale come fonte primaria.
    2. CITAZIONI: Cita sempre la Regola ufficiale (es. "Regola 16.1b").
    3. CONTESTO: Considera l'Area del campo e il Lie indicati.
    4. STILE: Conciso e tecnico. Evita chiacchiere.
    
    REGOLE LOCALI DEL CLUB:
    ${localRules || "Nessuna regola locale specifica. Segui il regolamento standard USGA/R&A."}`,
    
    en: `You are an expert golf referee (Marshall). Help players resolve rules issues.
    
    PRIORITY RULES:
    1. LOCAL RULES: Use provided local rules as the primary source.
    2. CITATIONS: Always cite the official Rule number.
    3. CONTEXT: Use provided location and lie data.
    4. STYLE: Concise and professional.
    
    CLUB LOCAL RULES:
    ${localRules || "No specific local rules provided. Follow standard USGA/R&A rules."}`
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
    const prompt = `Diagramma tecnico golf (vista dall'alto, stile 2D pulito): ${situationDescription}. Mostra area di soccorso e punto di riferimento. Sfondo bianco.`;

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
    const promptText = `DOMANDA: "${query}"
    CONTESTO: Area=${context.location}, Lie=${context.lie}`;

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

    const textResponse = response.text || "Spiacente, non ho trovato una regola specifica.";
    let generatedImage: string | undefined = undefined;
    
    const needsDiagram = ['drop', 'soccorso', 'relief', 'punto più vicino'].some(k => textResponse.toLowerCase().includes(k));
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
        parts: [{ text: `Identifica Golf Club nel raggio di 50km da: ${lat}, ${lon}. Restituisci JSON: [{"club": "Nome", "country": "Italy", "latitude": 45.1, "longitude": 9.1}]` }] 
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