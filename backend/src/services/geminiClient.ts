import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export const getGeminiModel = () => {
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // the preview 05-20 is standard flash or we can explicitly use "gemini-1.5-flash" / "gemini-2.5-flash" based on API availability. Let's use gemini-2.5-flash.
};

// Retry logic to force JSON formatting
export const generateJsonFromGemini = async (prompt: string, retries = 1): Promise<any> => {
  try {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt + '\n\nIMPORTANT: Return ONLY a valid JSON string without any markdown wrapping (no ```json ... ```). Output the raw JSON text directly.');
    const text = result.response.text();
    
    // Clean markdown if it leaked
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);

  } catch (err) {
    if (retries > 0) {
      console.warn('Gemini JSON generation failed, retrying...', err);
      return generateJsonFromGemini(prompt + '\n\nFATAL RULE: You MUST return ONLY valid JSON with no markdown or explanation. Absolutely no code blocks.', retries - 1);
    }
    throw new Error('Failed to generate valid JSON from AI.');
  }
};

export const generateStreamFromGemini = async function* (prompt: string): AsyncGenerator<string, void, unknown> {
  const model = getGeminiModel();
  const result = await model.generateContentStream(prompt + '\n\nIMPORTANT: Return ONLY a valid JSON string without any markdown wrapping (no ```json ... ```). Provide the complete and raw JSON text directly in the stream.');
  
  for await (const chunk of result.stream) {
    yield chunk.text();
  }
};
