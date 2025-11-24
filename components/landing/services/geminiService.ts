import { GoogleGenAI } from "@google/genai";
import { Message } from '../types';
import { SYSTEM_PROMPTS } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_API_KEY });

export async function chatWithLexi(
  userMessage: string,
  conversationHistory: Message[],
  language: 'es' | 'pt' | 'en'
): Promise<string> {
  const systemInstruction = SYSTEM_PROMPTS[language];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        ...conversationHistory.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        })),
        {
          role: 'user',
          parts: [{ text: userMessage }]
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
        maxOutputTokens: 1024,
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Error chatting with Lexi:", error);
    return "Lo siento, estoy teniendo problemas para conectar. Por favor intenta más tarde.";
  }
}