import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../db';

// Ecosystem Health Dashboard
export const getEcosystemHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [userRes] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM users');
    const [roleRes] = await pool.query<RowDataPacket[]>('SELECT role, COUNT(*) as c FROM users GROUP BY role');
    const [startupRes] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM startups');
    const [stageRes] = await pool.query<RowDataPacket[]>('SELECT stage, COUNT(*) as c FROM startups GROUP BY stage');
    
    // Meetings
    const [meetTotalRes] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM meetings');
    const [meetWeekRes] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM meetings WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)');
    
    // Mentor engagement
    const [mentorRes] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM users WHERE role = "mentor"');
    const totalMentors = mentorRes[0].c;
    const [activeMentors] = await pool.query<RowDataPacket[]>('SELECT COUNT(DISTINCT m.mentor_id) as c FROM office_hours m'); 
    // ^ Approximating: mentors with open slots or meetings
    const mentorEngageRes = await pool.query<RowDataPacket[]>('SELECT COUNT(DISTINCT organizer_id) as c FROM meetings WHERE organizer_id IN (SELECT id FROM users WHERE role="mentor")');
    const activeMentorCount = activeMentors[0].c + mentorEngageRes[0][0].c;

    const mentor_engagement_rate = totalMentors > 0 ? (activeMentorCount / totalMentors) : 0;

    // Avg days from startup creation to first non-founder member joining
    const [velocityRes] = await pool.query<RowDataPacket[]>(`
      SELECT AVG(DATEDIFF(sm.joined_at, s.created_at)) as avg_days
      FROM startup_members sm
      JOIN startups s ON sm.startup_id = s.id
      WHERE sm.user_id != s.created_by
    `);
    const team_formation_velocity = velocityRes[0].avg_days !== null ? Math.round(velocityRes[0].avg_days * 10) / 10 : 0;

    // Domains
    const [domainRes] = await pool.query<RowDataPacket[]>('SELECT domain, COUNT(*) as count FROM startups GROUP BY domain ORDER BY count DESC LIMIT 5');

    // Ideas & Roles
    const [ideaRes] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM ideas');
    
    const [roleTotalRes] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM open_roles');
    const [roleFilledRes] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM open_roles WHERE is_filled = TRUE');
    const open_roles_filled_rate = roleTotalRes[0].c > 0 ? (roleFilledRes[0].c / roleTotalRes[0].c) : 0;

    // Users by role mapping
    const users_by_role = { student: 0, mentor: 0, admin: 0 };
    roleRes.forEach(r => { (users_by_role as any)[r.role] = r.c; });

    const startups_by_stage = { idea: 0, mvp: 0, growth: 0, funded: 0 };
    stageRes.forEach(r => { (startups_by_stage as any)[r.stage] = r.c; });

    res.json({
      success: true,
      data: {
        total_users: userRes[0].c,
        users_by_role,
        total_startups: startupRes[0].c,
        active_startups: startupRes[0].c,
        startups_by_stage,
        total_meetings: meetTotalRes[0].c,
        meetings_this_week: meetWeekRes[0].c,
        mentor_engagement_rate,
        team_formation_velocity,
        top_domains: domainRes,
        total_ideas: ideaRes[0].c,
        ideas_posted: ideaRes[0].c,
        open_roles_filled_rate
      }
    });
  } catch (err) {
    next(err);
  }
};

// Skill Gaps — aggregate skill counts across all user profiles
export const getSkillGaps = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT skills FROM user_profiles WHERE skills IS NOT NULL');
    const counts: Record<string, number> = {};
    for (const row of rows) {
      const skills: string[] = typeof row.skills === 'string' ? JSON.parse(row.skills) : row.skills;
      if (Array.isArray(skills)) {
        for (const skill of skills) {
          const key = skill.trim();
          if (key) counts[key] = (counts[key] || 0) + 1;
        }
      }
    }
    const data = Object.entries(counts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => a.count - b.count);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const getCronSnapshots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await pool.query('SELECT * FROM ecosystem_snapshots ORDER BY snapshot_date ASC');
    res.json({ success: true, data: rows });
  } catch(err) { next(err); }
};

// Startup tracking
export const getStartupAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const [startups] = await pool.query<RowDataPacket[]>('SELECT created_at, stage FROM startups WHERE id = ?', [id]);
    if (startups.length === 0) return;
    const startup = startups[0];

    // milestone completion rate
    const [mTot] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM startup_milestones WHERE startup_id = ?', [id]);
    const [mDone] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM startup_milestones WHERE startup_id = ? AND completed_at IS NOT NULL', [id]);
    const completionRate = mTot[0].c > 0 ? Math.round((mDone[0].c / mTot[0].c) * 100) : 0;

    // Days since creation
    const diff = new Date().getTime() - new Date(startup.created_at).getTime();
    const daysSinceCreation = Math.floor(diff / (1000 * 3600 * 24));

    // Meeting count with mentors
    const [meetRes] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) as c FROM meetings m
      JOIN users u ON (m.organizer_id = u.id OR m.attendee_id = u.id)
      WHERE m.startup_id = ? AND m.status = 'completed' AND u.role = 'mentor'
    `, [id]);

    const [memRes] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM startup_members WHERE startup_id = ?', [id]);

    res.json({
      success: true,
      data: {
        completion_rate: completionRate,
        days_active: daysSinceCreation,
        current_stage: startup.stage,
        mentor_meetings: meetRes[0].c,
        team_size: memRes[0].c + 1 // + founder
      }
    });

  } catch (err) { next(err); }
};

// Mentor Impact
export const getMentorImpact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const mentorId = req.params.mentorId;
    
    // Total office hours booked
    const [ohRes] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM office_hour_bookings b JOIN office_hours h ON b.office_hour_id = h.id WHERE h.mentor_id = ? AND b.status = "confirmed"', [mentorId]);
    
    // Meetings computed as completed
    const [meetRes] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM meetings WHERE (organizer_id = ? OR attendee_id = ?) AND status = "completed"', [mentorId, mentorId]);

    // Mentees count
    const [menteeRes] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(DISTINCT u.id) as c 
      FROM users u
      JOIN office_hour_bookings b ON b.student_id = u.id
      JOIN office_hours h ON b.office_hour_id = h.id
      WHERE h.mentor_id = ?
    `, [mentorId]);

    const [menteeRes2] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(DISTINCT attendee_id) as c 
      FROM meetings WHERE organizer_id = ? AND status = "completed"
    `, [mentorId]);

    const totalMentees = menteeRes[0].c + menteeRes2[0].c;

    // Actual avg peer review rating for this mentor
    const [reviewRes] = await pool.query<RowDataPacket[]>(
      'SELECT AVG(rating) as avg_rating FROM peer_reviews WHERE reviewee_id = ?',
      [mentorId]
    );
    const avgScore = reviewRes[0].avg_rating !== null ? Math.round(reviewRes[0].avg_rating * 10) / 10 : null;

    const score = (meetRes[0].c * 2) + (ohRes[0].c * 1) + ((avgScore ?? 0) * 10);

    // Get assigned startups
    const [startups] = await pool.query<RowDataPacket[]>(`
      SELECT DISTINCT s.id, s.name, s.logo_url, s.domain 
      FROM startups s
      JOIN meetings m ON m.startup_id = s.id
      WHERE (m.organizer_id = ? OR m.attendee_id = ?) AND m.status = 'completed'
      LIMIT 4
    `, [mentorId, mentorId]);

    res.json({
      success: true,
      data: {
        total_mentees: totalMentees,
        total_meetings_completed: meetRes[0].c,
        total_office_hours_booked: ohRes[0].c,
        avg_peer_review_rating: avgScore,
        startups_mentored: startups,
        impact_score: score
      }
    });
  } catch (err) { next(err); }
};
