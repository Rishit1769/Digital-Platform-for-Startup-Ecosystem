import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../db';
import { fetchAndCacheGitHubData, fetchGitHubReadme } from '../services/githubService';

export const linkRepo = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { github_repo_url } = req.body;

    // Validate ownership
    const [startups] = await pool.query<RowDataPacket[]>('SELECT created_by FROM startups WHERE id = ?', [id]);
    if (startups.length === 0 || startups[0].created_by !== req.user.id) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    // Parse URL
    const regex = /github\.com\/([^\/]+)\/([^\/\.]+)/i;
    const match = github_repo_url.match(regex);
    if (!match) {
      res.status(400).json({ success: false, error: 'Invalid GitHub URL' });
      return;
    }

    const owner = match[1];
    const repo = match[2];

    try {
      await fetchAndCacheGitHubData(id, owner, repo);
      // Validated and cached
      await pool.query('UPDATE startups SET github_repo_url = ?, github_repo_owner = ?, github_repo_name = ? WHERE id = ?', [github_repo_url, owner, repo, id]);

      res.json({ success: true, message: 'Repository linked successfully' });
    } catch (err: any) {
      if (err.response?.status === 404) {
        res.status(404).json({ success: false, error: 'Repository not found or is private' });
      } else {
        res.status(500).json({ success: false, error: 'GitHub API error' });
      }
    }
  } catch (err) { next(err); }
};

export const unlinkRepo = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const [startups] = await pool.query<RowDataPacket[]>('SELECT created_by FROM startups WHERE id = ?', [id]);
    if (startups.length === 0 || startups[0].created_by !== req.user.id) {
       res.status(403).json({ success: false, error: 'Not authorized' });
       return;
    }

    await pool.query('UPDATE startups SET github_repo_url = NULL, github_repo_owner = NULL, github_repo_name = NULL WHERE id = ?', [id]);
    await pool.query('DELETE FROM github_cache WHERE startup_id = ?', [id]);

    res.json({ success: true, message: 'Unlinked' });
  } catch(err) { next(err); }
};

export const getCachedGitHub = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
   try {
     const { id } = req.params;
     const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM github_cache WHERE startup_id = ?', [id]);
     if (rows.length === 0) { res.status(404).json({ success: false, error: 'No cached data' }); return; }
     res.json({ success: true, data: rows[0] });
   } catch(err) { next(err); }
};

export const refreshGitHub = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const [startups] = await pool.query<RowDataPacket[]>('SELECT github_repo_owner, github_repo_name FROM startups WHERE id = ? AND github_repo_owner IS NOT NULL', [id]);
    if (startups.length === 0) { res.status(400).json({ success: false, error: 'No repo linked' }); return; }

    const { github_repo_owner, github_repo_name } = startups[0];
    await fetchAndCacheGitHubData(id as string, github_repo_owner, github_repo_name);
    
    // fetch back new cache
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM github_cache WHERE startup_id = ?', [id]);
    res.json({ success: true, data: rows[0] });
  } catch(err) { next(err); }
};

export const getActivityScore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM github_cache WHERE startup_id = ?', [id]);
    if (rows.length === 0) {
       res.json({ success: true, data: { activity_score: 0, signal: 'Unlinked' } });
       return;
    }

    const d = rows[0];
    const contribs = Array.isArray(d.contributors) ? d.contributors : (JSON.parse(d.contributors || '[]'));
    
    let activity_score = (d.commit_count_week * 3) + (d.commit_count_month * 1) + (contribs.length * 5);
    
    let signal = 'Low';
    if (activity_score > 50) signal = 'Very Active';
    else if (activity_score >= 20) signal = 'Active';
    else if (activity_score >= 5) signal = 'Moderate';

    res.json({ success: true, data: { activity_score, signal } });
  } catch(err) { next(err); }
};

export const getRepoReadme = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const [startups] = await pool.query<RowDataPacket[]>(
      'SELECT github_repo_owner, github_repo_name, github_repo_url, github_url FROM startups WHERE id = ? LIMIT 1',
      [id]
    );

    if (startups.length === 0) {
      res.status(404).json({ success: false, error: 'Startup not found' });
      return;
    }

    let owner = startups[0].github_repo_owner as string | null;
    let repo = startups[0].github_repo_name as string | null;

    if (!owner || !repo) {
      const rawUrl = String(startups[0].github_repo_url || startups[0].github_url || '');
      const match = rawUrl.match(/github\.com\/([^\/]+)\/([^\/#?]+)/i);
      if (match) {
        owner = match[1];
        repo = match[2].replace(/\.git$/i, '');
      }
    }

    if (!owner || !repo) {
      res.status(400).json({ success: false, error: 'No GitHub repository configured for this startup.' });
      return;
    }

    const markdown = await fetchGitHubReadme(owner, repo);
    res.json({ success: true, data: { markdown, owner, repo } });
  } catch (err) {
    next(err);
  }
};
