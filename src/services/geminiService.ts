import { GoogleGenAI } from "@google/genai";
import { Category } from "../types";

// Note: In a real production build, ensure API_KEY is handled via backend proxy or env vars securely.
// For this demo, we assume process.env.API_KEY is available or user provides it.
const apiKey = process.env.API_KEY || ''; 

export const GeminiService = {
  suggestCategory: async (description: string, categories: Category[]): Promise<string | null> => {
    if (!apiKey) {
      console.warn("Gemini API Key missing");
      return null;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const model = 'gemini-2.5-flash';

      const prompt = `
        You are a financial assistant. 
        Given the transaction description: "${description}"
        And this list of categories: ${JSON.stringify(categories.map(c => ({ id: c.id, name: c.name })))}
        
        Return ONLY the 'id' of the category that best fits this description. 
        If unsure, return 'null'. Do not return markdown or json, just the string ID.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      const text = response.text?.trim();
      return text === 'null' ? null : text || null;

    } catch (error) {
      console.error("Gemini AI Error:", error);
      return null;
    }
  }
};
