import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const stripFences = (text: string) => text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();

const extractBalancedJson = (text: string): string | null => {
  const starts = ['[', '{'];
  let startIndex = -1;
  let startChar = '';

  for (const ch of starts) {
    const i = text.indexOf(ch);
    if (i !== -1 && (startIndex === -1 || i < startIndex)) {
      startIndex = i;
      startChar = ch;
    }
  }

  if (startIndex === -1) return null;

  const endChar = startChar === '[' ? ']' : '}';
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = startIndex; i < text.length; i++) {
    const c = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (c === '\\') {
        escaped = true;
      } else if (c === '"') {
        inString = false;
      }
      continue;
    }

    if (c === '"') {
      inString = true;
      continue;
    }

    if (c === startChar) depth++;
    if (c === endChar) depth--;

    if (depth === 0) {
      return text.slice(startIndex, i + 1);
    }
  }

  return null;
};

export const parseJsonSafely = (rawText: string): any => {
  const cleaned = stripFences(rawText);
  try {
    return JSON.parse(cleaned);
  } catch {
    const extracted = extractBalancedJson(cleaned);
    if (extracted) {
      return JSON.parse(extracted);
    }
    throw new Error('No valid JSON payload found in model output');
  }
};

export const getGeminiModel = () => {
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" }); // the preview 05-20 is standard flash or we can explicitly use "gemini-1.5-flash" / "gemini-2.5-flash" based on API availability. Let's use gemini-2.5-flash.
};

// Retry logic to force JSON formatting
export const generateJsonFromGemini = async (prompt: string, retries = 1): Promise<any> => {
  try {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt + '\n\nIMPORTANT: Return ONLY a valid JSON string without any markdown wrapping (no ```json ... ```). Output the raw JSON text directly.');
    const text = result.response.text();

    return parseJsonSafely(text);

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
