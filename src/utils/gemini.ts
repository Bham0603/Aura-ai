import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn("VITE_GEMINI_API_KEY is not defined in the environment.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

const systemInstruction = "You are an educational AI assistant. Analyze the following transcript segment. If it contains a core concept, theory, or technical term, define it concisely in 1-2 sentences. If it is just casual filler conversation, respond strictly with 'NULL'. Output your response in clean, brief Markdown.";

const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  systemInstruction: systemInstruction 
});

export const generateAIResponse = async (text: string) => {
  if (!apiKey || apiKey === 'your_gemini_api_key_here') return "NULL";
  
  try {
    const result = await model.generateContent(text);
    return result.response.text().trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "NULL";
  }
};
