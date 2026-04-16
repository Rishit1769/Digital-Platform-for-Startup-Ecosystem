import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../db';
import { exchangeGoogleCalendarCode } from '../services/googleCalendar';

export const getCalendarEvents = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id;
    const { start, end } = req.query; // Iso strings

    const events: any[] = [];

    // 1. Meetings (pending, confirmed, completed) - we'll send them all so the Kanban board can distribute them
    const [meetings] = await pool.query<RowDataPacket[]>(`
      SELECT m.id, m.title, m.status, m.confirmed_slot, m.confirmed_end, m.proposed_slots, m.meeting_link,
             org.name as organizer_name,
             att.name as attendee_name
      FROM meetings m
      JOIN users org ON m.organizer_id = org.id
      JOIN users att ON m.attendee_id = att.id
      WHERE (m.organizer_id = ? OR m.attendee_id = ?)
      AND m.status IN ('pending', 'confirmed', 'completed')
    `, [userId, userId]);

    for (const m of meetings) {
      if (m.status === 'pending') {
        const slots = JSON.parse(m.proposed_slots);
        events.push({
          id: `meeting-${m.id}`,
          type: 'meeting',
          status: 'pending',
          title: m.title,
          with: m.organizer_name === req.user.name ? m.attendee_name : m.organizer_name,
          date: slots.length > 0 ? slots[0] : new Date().toISOString(), // Fallback representation for pending
          original_data: m
        });
      } else {
        events.push({
          id: `meeting-${m.id}`,
          type: 'meeting',
          status: m.status,
          title: m.title,
          with: m.organizer_name === req.user.name ? m.attendee_name : m.organizer_name,
          date: m.confirmed_slot,
          end_date: m.confirmed_end || (m.confirmed_slot ? new Date(new Date(m.confirmed_slot).getTime() + 30 * 60000).toISOString() : null),
          meeting_link: m.meeting_link || null,
          original_data: m
        });
      }
    }

    // 2. Office Hour Bookings
    const [bookings] = await pool.query<RowDataPacket[]>(`
      SELECT b.id, b.booked_date, b.status, oh.title, oh.start_time,
             u.name as student_name,
             m.name as mentor_name
      FROM office_hour_bookings b
      JOIN office_hours oh ON b.office_hour_id = oh.id
      JOIN users u ON b.student_id = u.id
      JOIN users m ON oh.mentor_id = m.id
      WHERE (b.student_id = ? OR oh.mentor_id = ?)
      AND b.status = 'confirmed'
    `, [userId, userId]);

    for (const b of bookings) {
      // Combine date and time
      const datetime = new Date(`${new Date(b.booked_date).toISOString().split('T')[0]}T${b.start_time}`);
      events.push({
        id: `oh-${b.id}`,
        type: 'office_hour',
        status: 'confirmed',
        title: `Office Hour: ${b.title}`,
        with: b.student_name === req.user.name ? b.mentor_name : b.student_name,
        date: datetime.toISOString(),
        end_date: new Date(datetime.getTime() + 30 * 60000).toISOString(),
        original_data: b
      });
    }

    // Note: This does not strictly filter strictly by \`start\` and \`end\` SQL logic to save complexity, 
    // it returns user's active set, frontend can render properly into the week.
    // In production, we'd add \`WHERE confirmed_slot > start AND confirmed_slot < end\` handling pending differently.

    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
};

export const getGoogleCalendarStatus = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT google_calendar_email, google_calendar_connected_at FROM users WHERE id = ?',
      [req.user.id]
    );
    const row = rows[0];
    res.json({
      success: true,
      data: {
        connected: !!row?.google_calendar_connected_at,
        email: row?.google_calendar_email || null,
        connectedAt: row?.google_calendar_connected_at || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const connectGoogleCalendar = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = req.body as { code?: string };
    if (!code) {
      res.status(400).json({ success: false, error: 'Authorization code is required.' });
      return;
    }

    const { email, refreshToken } = await exchangeGoogleCalendarCode(code);

    const [existingRows] = await pool.query<RowDataPacket[]>(
      'SELECT google_calendar_refresh_token FROM users WHERE id = ?',
      [req.user.id]
    );
    const existingToken = existingRows[0]?.google_calendar_refresh_token || null;
    const finalRefreshToken = refreshToken || existingToken;

    if (!finalRefreshToken) {
      res.status(400).json({
        success: false,
        error: 'Google did not return offline access. Reconnect and grant calendar access again.',
      });
      return;
    }

    await pool.query(
      `UPDATE users
       SET google_calendar_refresh_token = ?,
           google_calendar_email = ?,
           google_calendar_connected_at = NOW()
       WHERE id = ?`,
      [finalRefreshToken, email || req.user.email, req.user.id]
    );

    res.json({ success: true, data: { connected: true, email: email || req.user.email } });
  } catch (err) {
    next(err);
  }
};

export const disconnectGoogleCalendar = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    await pool.query(
      `UPDATE users
       SET google_calendar_refresh_token = NULL,
           google_calendar_email = NULL,
           google_calendar_connected_at = NULL
       WHERE id = ?`,
      [req.user.id]
    );
    res.json({ success: true, message: 'Google Calendar disconnected.' });
  } catch (err) {
    next(err);
  }
};

export const getMeetingCandidates = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const targetRole = req.user.role === 'mentor' ? 'student' : 'mentor';
    const { search = '', limit = '30' } = req.query as { search?: string; limit?: string };
    const pageSize = Math.min(parseInt(limit, 10) || 30, 100);

    const params: any[] = [targetRole, req.user.id];
    let where = 'WHERE u.role = ? AND u.id <> ?';

    if (search) {
      where += ' AND (u.name LIKE ? OR u.email LIKE ? OR p.designation LIKE ? OR p.company LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.name, u.email, u.role,
              COALESCE(p.designation, '') AS designation,
              COALESCE(p.company, '') AS company,
              COALESCE(p.avatar_url, '') AS avatar_url
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       ${where}
       ORDER BY u.created_at DESC
       LIMIT ?`,
      [...params, pageSize]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};
