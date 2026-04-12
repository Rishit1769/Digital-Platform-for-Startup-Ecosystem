import { Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../db';
import { generateJsonFromGemini, generateStreamFromGemini } from '../services/geminiClient';

// Simple in-memory rate limitter
const rateLimits: { [key: string]: { count: number, resetAt: number } } = {};

const checkRateLimit = (userId: string | number) => {
  const now = Date.now();
  const limit = rateLimits[userId];
  if (!limit) {
    rateLimits[userId] = { count: 1, resetAt: now + 3600 * 1000 };
    return true;
  }
  if (now > limit.resetAt) {
    rateLimits[userId] = { count: 1, resetAt: now + 3600 * 1000 };
    return true;
  }
  if (limit.count >= 10) return false;
  limit.count++;
  return true;
};

// 1. Mentors
export const recommendMentors = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id;
    if (req.user.role !== 'student') {
      res.status(403).json({ success: false, error: 'Only students can access mentor recommendations' });
      return;
    }

    if (!checkRateLimit(userId)) {
      res.status(429).json({ success: false, error: 'AI limit reached (10 requests/hr)' });
      return;
    }

    // Student profile
    const [students] = await pool.query<RowDataPacket[]>('SELECT u.name, p.skills, p.interests, p.preferred_domains FROM users u JOIN user_profiles p ON u.id = p.user_id WHERE u.id = ?', [userId]);
    const student = students[0] || {};

    // Mentors
    const [mentors] = await pool.query<RowDataPacket[]>('SELECT u.id as mentor_id, u.name, p.expertise, p.company, p.designation, p.years_of_experience FROM users u JOIN user_profiles p ON u.id = p.user_id WHERE u.role = "mentor" LIMIT 50');

    const prompt = `You are a startup ecosystem matchmaker. Given this student profile:
${JSON.stringify(student)}

And these available mentors:
${JSON.stringify(mentors.map(m => ({ id: m.mentor_id, expertise: m.expertise, company: m.company, role: m.designation })))}

Rank the top 5 most suitable mentors for this student. Return ONLY a valid JSON array of objects.
Object format: { "mentor_id": number, "compatibility_score": number (0-100), "match_reasons": ["reason1", "reason2", "reason3"], "suggested_topics": ["topic1", "topic2"] }`;

    const aiRes = await generateJsonFromGemini(prompt);
    
    // Merge DB
    const finalData = aiRes.map((rec: any) => {
      const dbInfo = mentors.find(m => m.mentor_id === rec.mentor_id);
      return { ...rec, mentor_details: dbInfo };
    }).filter((r: any) => r.mentor_details);

    res.json({ success: true, data: finalData });

  } catch (err) { next(err); }
};

// 2. Co-Founders
export const recommendCofounders = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id;
    if (!checkRateLimit(userId)) return res.status(429).json({ success: false, error: 'AI limit reached' }) as any;

    const [students] = await pool.query<RowDataPacket[]>('SELECT u.name, p.skills, p.interests, p.preferred_domains FROM users u JOIN user_profiles p ON u.id = p.user_id WHERE u.id = ?', [userId]);
    const student = students[0];

    const [others] = await pool.query<RowDataPacket[]>('SELECT u.id as student_id, u.name, p.skills, p.interests, p.preferred_domains, p.college FROM users u JOIN user_profiles p ON u.id = p.user_id WHERE u.role = "student" AND u.id != ? LIMIT 50', [userId]);

    const prompt = `You are a co-founder matchmaker. Given this student:
${JSON.stringify(student)}

And these potential co-founders:
${JSON.stringify(others.map(o => ({ id: o.student_id, skills: o.skills, domains: o.preferred_domains })))}

Rank the top 5 most complementary students to form a startup team. Focus on complementary skills and shared domains.
Return ONLY a valid JSON array.
Object format: { "student_id": number, "compatibility_score": number (0-100), "match_reasons": ["reason1", "reason2", "reason3"], "suggested_topics": ["topic1", "topic2"] }`;

    const aiRes = await generateJsonFromGemini(prompt);
    const finalData = aiRes.map((rec: any) => {
      const dbInfo = others.find(m => m.student_id === rec.student_id);
      return { ...rec, student_details: dbInfo };
    }).filter((r: any) => r.student_details);

    res.json({ success: true, data: finalData });

  } catch(err) { next(err); }
};

// 3. Current Trend
export const getTrendRadar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [cache] = await pool.query<RowDataPacket[]>('SELECT * FROM trends_cache WHERE cache_key = "trends_v2" AND updated_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)');
    if (cache.length > 0) {
      res.json({ success: true, data: cache[0].data, source: 'cache' });
      return;
    }

    const prompt = `You are a startup ecosystem analyst. Analyze the current startup landscape in India for 2025. 
Return the top 12 trending startup domains as a JSON array. 
For each domain return ONLY this structure: 
{ "name": string, "emoji": string, "growth_signal": "high"|"medium"|"rising", "why_trending": string (max 20 words), "example_startups": [string, string], "skills_needed": [string, string, string], "opportunity_score": number 1-10 }
Return ONLY valid JSON array.`;

    const data = await generateJsonFromGemini(prompt);

    await pool.query('INSERT INTO trends_cache (cache_key, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data=VALUES(data)', ['trends_v2', JSON.stringify(data)]);

    res.json({ success: true, data, source: 'ai' });

  } catch(err) { next(err); }
};

// 4. Suggest Pivot
export const suggestPivot = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startup_id } = req.body;
    const userId = req.user.id;

    if (!checkRateLimit(userId)) return res.status(429).json({ success: false, error: 'AI limit reached' }) as any;

    const [startups] = await pool.query<RowDataPacket[]>('SELECT name, domain, description FROM startups WHERE id = ?', [startup_id]);
    const [mems] = await pool.query<RowDataPacket[]>('SELECT p.skills FROM startup_members m JOIN user_profiles p ON m.user_id = p.user_id WHERE m.startup_id = ?', [startup_id]);
    
    // Flatten skills intelligently assuming arrays
    let allSkills: string[] = [];
    mems.forEach(m => {
       const s = typeof m.skills === 'string' ? JSON.parse(m.skills) : m.skills;
       if (Array.isArray(s)) allSkills.push(...s);
    });

    const [cache] = await pool.query<RowDataPacket[]>('SELECT data FROM trends_cache WHERE cache_key = "trends_v2"');
    const trendsObj = cache.length > 0 ? cache[0].data : [];

    const prompt = `Given this startup in domain [${startups[0].domain}] named "${startups[0].name}" with these combined team skills: [${allSkills.join(', ')}], and the current trending domains data:
${JSON.stringify(trendsObj)}
Suggest 2-3 strategic pivot or expansion opportunities.
Return JSON array: [{ "pivot_to": string (domain name), "reason": string, "skill_overlap_pct": number, "opportunity_score": number 1-10 }]`;

    const data = await generateJsonFromGemini(prompt);
    res.json({ success: true, data });

  } catch(err) { next(err); }
};

export const getPitchDeck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
   try {
     const { startupId } = req.params;
     const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM pitch_decks WHERE startup_id = ? ORDER BY generated_at DESC LIMIT 1', [startupId]);
     if (rows.length === 0) return res.status(404).json({ success: false, error: 'No deck found' }) as any;
     res.json({ success: true, data: rows[0] });
   } catch(err) { next(err); }
};

export const generatePitchDeck = async (req: any, res: Response, next: NextFunction): Promise<void> => {
   try {
     const { startupId } = req.params; // Using params internally for SSE ease if doing SSE POST
     const id = startupId || req.body.startup_id;

     if (!checkRateLimit(req.user.id)) {
       res.write('data: {"error": "AI limit reached"}\n\n');
       res.end();
       return;
     }

     const [startups] = await pool.query<RowDataPacket[]>('SELECT * FROM startups WHERE id = ?', [id]);
     const s = startups[0];

     res.setHeader('Content-Type', 'text/event-stream');
     res.setHeader('Cache-Control', 'no-cache');
     res.setHeader('Connection', 'keep-alive');

     const prompt = `Generate a professional startup pitch deck outline for this startup:
Name: ${s.name}
Tagline: ${s.tagline}
Description: ${s.description}
Domain: ${s.domain}

Create exactly 10 slides with this structure: 1-Problem, 2-Solution, 3-Market Opportunity, 4-Product/Technology, 5-Business Model, 6-Traction & Milestones, 7-Team, 8-Competition, 9-Go-to-Market Strategy, 10-Ask/Funding.
For each slide return: slide_number, title, key_points (array of 4-5 bullet points), speaker_notes (2-3 sentences).
Return ONLY valid JSON with structure: { "startup_name": "${s.name}", "tagline": "${s.tagline}", "slides": [ ... ] }`;

     let rawJsonString = '';
     try {
       const stream = generateStreamFromGemini(prompt);
       for await (const chunk of stream) {
          rawJsonString += chunk;
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
       }

       // Clean end data
       const cleaned = rawJsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
       const parsedDeck = JSON.parse(cleaned);

       // Save to DB
       const [old] = await pool.query<RowDataPacket[]>('SELECT MAX(version) as v FROM pitch_decks WHERE startup_id = ?', [id]);
       const nextV = (old[0].v || 0) + 1;
       
       await pool.query('INSERT INTO pitch_decks (startup_id, content, version) VALUES (?, ?, ?)', [id, JSON.stringify(parsedDeck), nextV]);

       res.write(`data: ${JSON.stringify({ done: true, version: nextV })}\n\n`);
     } catch(err) {
       res.write(`data: ${JSON.stringify({ error: "Failed to generate deck stream." })}\n\n`);
     } finally {
       res.end();
     }
   } catch(err) { next(err); }
};
