
import { GoogleGenAI } from "@google/genai";

let ai: any = null;

const getAIClient = () => {
  if (!ai) {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Gemini API key is missing. AI features will be disabled.");
      return null;
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export const getAIResponse = async (prompt: string) => {
  try {
    const aiClient = getAIClient();
    if (!aiClient) {
      return "AI assistant is currently unavailable due to missing configuration.";
    }
    
    const response = await aiClient.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: `You are an AI assistant for MSD&W Integrated Holdings, owned by William Melven Dumbuya.
        The company operates in Construction, Logistics, Fashion, Wholesale, and Cleaning.
        Location: 1 Jarret street, Asaba. Phone: +2347046997301.
        Answer user queries professionally about our services and products.
        Keep responses concise and helpful.`,
      },
    });
    // Use .text property to get response string
    return response.text || "I'm sorry, I couldn't process that request right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Our AI assistant is currently resting. Please try again later.";
  }
};
