import { GoogleGenAI, Type } from "@google/genai";
import { AIMoodResponse } from '../types';

// Initialize the client
// NOTE: API Key is assumed to be in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getStationInsight = async (stationName: string, country: string, tags: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are a cool, knowledgeable radio DJ. 
      The user just tuned into "${stationName}" in ${country}. 
      Tags: ${tags}.
      
      Give a very short (1 sentence, max 20 words) fun fact or interesting comment about this location's music scene or culture. 
      Keep it punchy and engaging. Do not use quotes.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.8,
        maxOutputTokens: 50,
      }
    });

    return response.text || "Enjoy the tunes!";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Tuning into global frequencies...";
  }
};

export const getMoodRecommendation = async (userQuery: string): Promise<AIMoodResponse> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Analyze this user request for radio music: "${userQuery}".
      Extract a target country (if mentioned or implied) and a music genre tag.
      Also provide a short 5-word explanation.
      
      Return JSON format.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            country: { type: Type.STRING, nullable: true },
            tag: { type: Type.STRING, nullable: true },
            explanation: { type: Type.STRING }
          },
          required: ["explanation"]
        }
      }
    });
    
    // Parse the JSON response
    if (response.text) {
      return JSON.parse(response.text) as AIMoodResponse;
    }
    throw new Error("No text returned");

  } catch (error) {
    console.error("Gemini Mood Error:", error);
    return { explanation: "Couldn't quite catch that vibe. Try 'Jazz from France'.", tag: 'pop' };
  }
};