import { generateJsonFromGemini } from './geminiClient';

export interface PitchDeckAnalysis {
  clarity: { score: number; summary: string; strengths: string[]; risks: string[] };
  market_size: { score: number; summary: string; strengths: string[]; risks: string[] };
  value_proposition: { score: number; summary: string; strengths: string[]; risks: string[] };
  overall_summary: string;
}

export interface PitchOutlineSlide {
  slide_number: number;
  title: string;
  objective: string;
  bullets: string[];
}

export interface SuggestedMilestone {
  title: string;
  description: string;
  stage: 'idea' | 'prototype' | 'mvp' | 'beta' | 'launch' | 'funded';
}

export const analyzePitchTextWithAI = async (pitchText: string): Promise<PitchDeckAnalysis> => {
  const prompt = `You are a startup investment analyst.
Analyze the pitch deck text and return only strict JSON with this structure:
{
  "clarity": { "score": number, "summary": string, "strengths": string[], "risks": string[] },
  "market_size": { "score": number, "summary": string, "strengths": string[], "risks": string[] },
  "value_proposition": { "score": number, "summary": string, "strengths": string[], "risks": string[] },
  "overall_summary": string
}
Rules:
- Score each criterion from 1 to 10.
- Keep summary concise and specific.
- Keep strengths and risks max 3 items each.

Pitch text:
${pitchText.slice(0, 28000)}`;

  return generateJsonFromGemini(prompt);
};

export const generatePitchOutlineWithAI = async (input: {
  name: string;
  tagline?: string | null;
  description?: string | null;
  domain?: string | null;
}): Promise<{ slides: PitchOutlineSlide[] }> => {
  const prompt = `Create a 10-slide startup pitch deck outline.
Startup:
- Name: ${input.name}
- Tagline: ${input.tagline || 'N/A'}
- Domain: ${input.domain || 'N/A'}
- Description: ${input.description || 'N/A'}

Return only valid JSON:
{
  "slides": [
    { "slide_number": 1, "title": string, "objective": string, "bullets": string[] }
  ]
}
Rules:
- Exactly 10 slides.
- Slide numbers must be 1..10.
- Each slide should include 3 to 5 bullets.
- Focus on investor-ready narrative flow.`;

  return generateJsonFromGemini(prompt);
};

export const suggestStartupMilestonesWithAI = async (input: {
  name: string;
  domain?: string | null;
  description?: string | null;
}): Promise<{ milestones: SuggestedMilestone[] }> => {
  const prompt = `Suggest exactly 3 practical milestones for an early-stage startup.
Startup:
- Name: ${input.name}
- Domain: ${input.domain || 'N/A'}
- Description: ${input.description || 'N/A'}

Return only strict JSON:
{
  "milestones": [
    { "title": string, "description": string, "stage": "idea" | "prototype" | "mvp" | "beta" | "launch" | "funded" }
  ]
}
Rules:
- Exactly 3 milestones.
- Milestones should be a mix of business and technical progress.
- Keep each description concise and actionable.`;

  return generateJsonFromGemini(prompt);
};
