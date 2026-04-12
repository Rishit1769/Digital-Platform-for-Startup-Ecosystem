import axios from 'axios';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2/promise';

export const fetchAndCacheGitHubData = async (startupId: string | number, owner: string, repo: string) => {
  try {
    const headers: any = {
      'Accept': 'application/vnd.github.v3+json'
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const baseURL = `https://api.github.com/repos/${owner}/${repo}`;

    // a) Basic repo info
    const repoRes = await axios.get(baseURL, { headers });
    const { stargazers_count, forks_count, open_issues_count, pushed_at } = repoRes.data;

    // Dates for since params
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // b) Commits week
    let commit_count_week = 0;
    try {
      const cwRes = await axios.get(`${baseURL}/commits?per_page=100&since=${sevenDaysAgo}`, { headers });
      commit_count_week = cwRes.data.length;
    } catch (err) {}

    // c) Commits month
    let commit_count_month = 0;
    try {
      const cmRes = await axios.get(`${baseURL}/commits?per_page=100&since=${thirtyDaysAgo}`, { headers });
      commit_count_month = cmRes.data.length;
    } catch(err) {}

    // d) Contributors
    let contributors = [];
    try {
      const contribRes = await axios.get(`${baseURL}/contributors?per_page=10`, { headers });
      contributors = contribRes.data.map((c: any) => ({
        login: c.login,
        avatar_url: c.avatar_url,
        contributions: c.contributions
      }));
    } catch(err) {}

    // e) Languages
    let languages = {};
    try {
      const langRes = await axios.get(`${baseURL}/languages`, { headers });
      languages = langRes.data;
    } catch(err) {}

    const cachedAt = new Date();

    await pool.query(
      `INSERT INTO github_cache 
        (startup_id, commit_count_week, commit_count_month, last_push_at, open_issues, stars, forks, contributors, languages, cached_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
        commit_count_week=VALUES(commit_count_week), 
        commit_count_month=VALUES(commit_count_month), 
        last_push_at=VALUES(last_push_at), 
        open_issues=VALUES(open_issues), 
        stars=VALUES(stars), 
        forks=VALUES(forks), 
        contributors=VALUES(contributors), 
        languages=VALUES(languages), 
        cached_at=VALUES(cached_at)`,
       [
         startupId, commit_count_week, commit_count_month, new Date(pushed_at), 
         open_issues_count, stargazers_count, forks_count, 
         JSON.stringify(contributors), JSON.stringify(languages), cachedAt
       ]
    );

    return true;
  } catch (error: any) {
    console.error('GitHub fetch failed:', error?.response?.status, error?.response?.data || error.message);
    throw error;
  }
};
