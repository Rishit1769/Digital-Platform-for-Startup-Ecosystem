import { pool } from '../db';
import { RowDataPacket } from 'mysql2/promise';

type XPEventType = 
  | 'daily_login' | 'first_login' | 'profile_completed' | 'startup_created'
  | 'team_member_added' | 'meeting_completed' | 'office_hour_attended'
  | 'idea_posted' | 'idea_upvoted_by_others' | 'peer_review_given'
  | 'peer_review_received' | 'milestone_completed' | 'role_application_accepted'
  | 'github_repo_linked' | 'weekly_active' | 'streak_7_days' | 'streak_30_days';

const XP_VALUES: Record<XPEventType, number> = {
  daily_login: 10,
  first_login: 50,
  profile_completed: 100,
  startup_created: 150,
  team_member_added: 30,
  meeting_completed: 50,
  office_hour_attended: 40,
  idea_posted: 30,
  idea_upvoted_by_others: 10,
  peer_review_given: 25,
  peer_review_received: 15,
  milestone_completed: 75,
  role_application_accepted: 60,
  github_repo_linked: 50,
  weekly_active: 80,
  streak_7_days: 100,
  streak_30_days: 500,
};

const getLevel = (xp: number): number => {
  if (xp >= 8000) return 7;
  if (xp >= 4000) return 6;
  if (xp >= 2000) return 5;
  if (xp >= 1000) return 4;
  if (xp >= 500) return 3;
  if (xp >= 200) return 2;
  return 1;
};

export const checkAndAwardBadges = async (userId: number, currentBadges: string[]): Promise<string[]> => {
  const newBadges: string[] = [];
  const addBadge = (b: string) => { if (!currentBadges.includes(b)) { newBadges.push(b); currentBadges.push(b); } };

  // check total ideas
  const [ideas] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM ideas WHERE posted_by = ?', [userId]);
  if (ideas[0].c > 0) addBadge('first_idea');

  // check upvotes received
  const [upvotes] = await pool.query<RowDataPacket[]>('SELECT SUM(upvotes) as t FROM ideas WHERE posted_by = ?', [userId]);
  if ((upvotes[0].t || 0) >= 10) addBadge('innovator');

  // check startups joined
  const [memberships] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM startup_members WHERE user_id = ?', [userId]);
  if (memberships[0].c >= 3) addBadge('team_player');

  // check mentor meetings completed
  const [meetings] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM meetings WHERE (organizer_id = ? OR attendee_id = ?) AND status = "completed"', [userId, userId]);
  if (meetings[0].c >= 5) addBadge('mentor_magnet');

  // check gamification streak
  const [gam] = await pool.query<RowDataPacket[]>('SELECT longest_streak FROM user_gamification WHERE user_id = ?', [userId]);
  if (gam.length > 0 && gam[0].longest_streak >= 7) addBadge('streak_master');

  // connectors (invited members) - simplified: if they created a startup that has members
  const [team] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM startup_members m JOIN startups s ON m.startup_id = s.id WHERE s.created_by = ? AND m.user_id != ?', [userId, userId]);
  if (team[0].c >= 5) addBadge('connector');

  // ai_pioneer -> if they have entries in xp_events for generating pitch (Wait, I didn't add an event type for pitch deck generated... let's check pitch_decks)
  const [pitches] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM pitch_decks p JOIN startups s ON p.startup_id = s.id WHERE s.created_by = ?', [userId]);
  if (pitches[0].c > 0) addBadge('ai_pioneer');

  if (newBadges.length > 0) {
     await pool.query('UPDATE user_gamification SET badges = ? WHERE user_id = ?', [JSON.stringify(currentBadges), userId]);
  }

  return newBadges;
};

export const awardXP = async (userId: number, eventType: XPEventType, referenceId?: number | null, description?: string) => {
  try {
    const xp = XP_VALUES[eventType] || 0;
    
    // Ensure gamification profile exists
    await pool.query(`INSERT IGNORE INTO user_gamification (user_id, badges) VALUES (?, '[]')`, [userId]);

    // Insert xp event
    await pool.query(
      'INSERT INTO xp_events (user_id, event_type, xp_awarded, description, reference_id) VALUES (?, ?, ?, ?, ?)',
      [userId, eventType, xp, description || eventType, referenceId || null]
    );

    // Get current state
    const [gam] = await pool.query<RowDataPacket[]>('SELECT total_xp, level, badges, current_streak, longest_streak, last_active_date FROM user_gamification WHERE user_id = ?', [userId]);
    const state = gam[0];
    const prevLevel = state.level;
    let newTotal = state.total_xp + xp;
    
    let currentStreak = state.current_streak;
    let longestStreak = state.longest_streak;
    let lastActiveDate = state.last_active_date;
    
    // Streak Logic if daily_login
    if (eventType === 'daily_login') {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const lastActiveD = lastActiveDate ? new Date(lastActiveDate) : null;
      let lastStr = '';
      if (lastActiveD) {
          lastStr = lastActiveD.toISOString().split('T')[0];
      }

      if (lastStr !== todayStr) {
          if (!lastActiveD) {
             currentStreak = 1;
          } else {
             const yesterday = new Date();
             yesterday.setDate(yesterday.getDate() - 1);
             const yesterdayStr = yesterday.toISOString().split('T')[0];

             if (lastStr === yesterdayStr) {
                 currentStreak += 1;
             } else {
                 currentStreak = 1;
             }
          }
          lastActiveDate = todayStr;
          if (currentStreak > longestStreak) longestStreak = currentStreak;
      }
    }

    const newLevel = getLevel(newTotal);
    const leveledUp = newLevel > prevLevel;
    const badgesObj = typeof state.badges === 'string' ? JSON.parse(state.badges) : (state.badges || []);

    // Update Profile
    await pool.query(
       `UPDATE user_gamification 
        SET total_xp = ?, level = ?, current_streak = ?, longest_streak = ?, last_active_date = ?, updated_at = NOW() 
        WHERE user_id = ?`,
       [newTotal, newLevel, currentStreak, longestStreak, lastActiveDate, userId]
    );

    // Check newly earned badges
    const newBadges = await checkAndAwardBadges(userId, badgesObj);

    // Recursively award streak bonuses if applicable
    if (eventType === 'daily_login') {
       if (currentStreak === 7) await awardXP(userId, 'streak_7_days');
       if (currentStreak === 30) await awardXP(userId, 'streak_30_days');
    }

    return {
      xpAwarded: xp,
      newTotalXP: newTotal,
      newLevel,
      leveledUp,
      newBadges
    };
  } catch (error) {
    console.error('Failed to award XP:', error);
    return null;
  }
};
