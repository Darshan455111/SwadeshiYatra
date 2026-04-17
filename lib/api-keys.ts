import { GoogleGenerativeAI } from "@google/generative-ai";

const getKey = (): string => {
  return process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEYS ||
    "";
};

export async function runWithRotation<T>(
  operation: (genAI: GoogleGenerativeAI) => Promise<T>
): Promise<T> {
  const apiKeyStr = getKey();

  if (!apiKeyStr) {
    throw new Error("No Gemini API key found in environment variables.");
  }

  // Use only the first key even if multiple are present in the string
  const singleKey = apiKeyStr.split(",")[0].trim();
  const genAI = new GoogleGenerativeAI(singleKey);

  try {
    return await operation(genAI);
  } catch (err: any) {
    console.error(`[AI Execution] Request failed:`, err.message || err);
    throw err;
  }
}
