import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2/promise';
import { GoogleGenAI } from '@google/genai';
import { pool } from '../db';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getTrendRadar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cacheKey = 'trend_radar';
    const [rows] = await pool.query<RowDataPacket[]>('SELECT data, updated_at FROM trends_cache WHERE cache_key = ?', [cacheKey]);

    if (rows.length > 0) {
      const cacheDate = new Date(rows[0].updated_at);
      const now = new Date();
      // If cache is less than 24h old, return it
      if (now.getTime() - cacheDate.getTime() < 24 * 60 * 60 * 1000 && process.env.NODE_ENV !== 'development') {
        res.json({ success: true, data: rows[0].data });
        return;
      }
    }

    const prompt = "List the top 10 trending startup domains in India in 2025. For each domain return: name, growth_signal (high/medium), why_trending (1 sentence), example_startups (2 names). Return as JSON array.";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || "[]";
    let jsonData = [];
    try {
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      jsonData = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Error parsing Gemini output', e);
      jsonData = [];
    }

    await pool.query(
      'INSERT INTO trends_cache (cache_key, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = ?, updated_at = CURRENT_TIMESTAMP',
      [cacheKey, JSON.stringify(jsonData), JSON.stringify(jsonData)]
    );

    res.json({ success: true, data: jsonData });
  } catch (err) {
    next(err);
  }
};
