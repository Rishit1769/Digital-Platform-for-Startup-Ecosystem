import { Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../db';
import { sendMeetingRequestedEmail, sendMeetingStatusEmail } from '../services/email';
import { createCalendarEvent } from '../services/googleCalendar';

function getIsoEnd(startIso: string, endIso?: string | null) {
  if (endIso) return new Date(endIso).toISOString();
  const start = new Date(startIso);
  return new Date(start.getTime() + 30 * 60 * 1000).toISOString();
}

export const createMeeting = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { attendee_id, title, description, startup_id, proposed_slots } = req.body;
    const organizer_id = req.user.id;

    if (!proposed_slots || proposed_slots.length !== 3) {
      res.status(400).json({ success: false, error: 'Must provide exactly 3 proposed slots' });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO meetings (title, description, organizer_id, attendee_id, startup_id, proposed_slots) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, organizer_id, attendee_id, startup_id || null, JSON.stringify(proposed_slots)]
    );

    // Email
    const [attendees] = await pool.query<RowDataPacket[]>('SELECT email, name FROM users WHERE id = ?', [attendee_id]);
    if (attendees.length > 0) {
      await sendMeetingRequestedEmail(attendees[0].email, req.user.name, title);
    }

    res.status(201).json({ success: true, meeting_id: result.insertId });
  } catch (err) {
    next(err);
  }
};

export const getMeetings = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT m.*, 
            org.name as organizer_name, org.role as organizer_role, org.email as organizer_email, org.phone as organizer_phone, org_p.avatar_url as organizer_avatar,
            att.name as attendee_name, att.role as attendee_role, att.email as attendee_email, att.phone as attendee_phone, att_p.avatar_url as attendee_avatar,
             s.name as startup_name
      FROM meetings m
      JOIN users org ON m.organizer_id = org.id
      LEFT JOIN user_profiles org_p ON org.id = org_p.user_id
      JOIN users att ON m.attendee_id = att.id
      LEFT JOIN user_profiles att_p ON att.id = att_p.user_id
      LEFT JOIN startups s ON m.startup_id = s.id
      WHERE (m.organizer_id = ? OR m.attendee_id = ?)
    `;
    const params: any[] = [userId, userId];

    if (status) {
      query += ' AND m.status = ?';
      params.push(status);
    }

    query += ' ORDER BY m.created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

export const getMeetingDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT m.*, 
             org.name as organizer_name, org_p.avatar_url as organizer_avatar, org.email as organizer_email,
             att.name as attendee_name, att_p.avatar_url as attendee_avatar, att.email as attendee_email,
             s.name as startup_name
      FROM meetings m
      JOIN users org ON m.organizer_id = org.id
      LEFT JOIN user_profiles org_p ON org.id = org_p.user_id
      JOIN users att ON m.attendee_id = att.id
      LEFT JOIN user_profiles att_p ON att.id = att_p.user_id
      LEFT JOIN startups s ON m.startup_id = s.id
      WHERE m.id = ?
    `, [id]);

    if (rows.length === 0) {
      res.status(404).json({ success: false, error: 'Meeting not found' });
      return;
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

export const confirmMeeting = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { confirmed_slot } = req.body;
    const userId = req.user.id;

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM meetings WHERE id = ? AND attendee_id = ?', [id, userId]);
    if (rows.length === 0) {
      res.status(403).json({ success: false, error: 'Not authorized or meeting not found' });
      return;
    }

    const meeting = rows[0];

    // Conflict detection
    const datetime = new Date(confirmed_slot);
    const timeBefore = new Date(datetime.getTime() - 60 * 60 * 1000);
    const timeAfter = new Date(datetime.getTime() + 60 * 60 * 1000);

    const [conflicts] = await pool.query<RowDataPacket[]>(`
      SELECT id FROM meetings 
      WHERE status = 'confirmed' 
      AND (organizer_id IN (?, ?) OR attendee_id IN (?, ?))
      AND confirmed_slot > ? AND confirmed_slot < ?
      AND id != ?
    `, [meeting.organizer_id, meeting.attendee_id, meeting.organizer_id, meeting.attendee_id, timeBefore, timeAfter, id]);

    if (conflicts.length > 0) {
      res.status(409).json({ success: false, error: 'Slot conflict: Overlaps with an existing confirmed meeting' });
      return;
    }

    const [participants] = await pool.query<RowDataPacket[]>(
      `SELECT id, email, google_calendar_refresh_token
       FROM users
       WHERE id IN (?, ?)`,
      [meeting.organizer_id, meeting.attendee_id]
    );

    const participantMap = new Map<number, any>();
    participants.forEach((p: any) => participantMap.set(p.id, p));

    const attendee = participantMap.get(meeting.attendee_id);
    const organizer = participantMap.get(meeting.organizer_id);

    const hostCandidates = [attendee, organizer].filter(Boolean);
    const host = hostCandidates.find((u: any) => !!u.google_calendar_refresh_token);

    let meetLink = `https://meet.jit.si/Ecosystem-${id}-${Date.now()}`;
    const confirmedEnd = getIsoEnd(confirmed_slot, null);

    if (host?.google_calendar_refresh_token) {
      try {
        const event = await createCalendarEvent({
          refreshToken: host.google_calendar_refresh_token,
          summary: meeting.title,
          description: meeting.description || 'Scheduled via Ecosystem calendar.',
          startIso: new Date(confirmed_slot).toISOString(),
          endIso: confirmedEnd,
          attendeeEmails: [organizer?.email, attendee?.email].filter(Boolean),
          meetingLink: null,
        });
        if (event.meetLink) meetLink = event.meetLink;
      } catch (calendarErr) {
        console.error('Google Calendar sync failed on confirmMeeting:', calendarErr);
      }
    }

    await pool.query(
      'UPDATE meetings SET status = ?, confirmed_slot = ?, confirmed_end = ?, meeting_link = ? WHERE id = ?',
      ['confirmed', new Date(confirmed_slot), new Date(confirmedEnd), meetLink, id]
    );

    // Get emails
    const [emailRes] = await pool.query<RowDataPacket[]>('SELECT email FROM users WHERE id = ?', [meeting.organizer_id]);
    if (emailRes.length > 0) {
      await sendMeetingStatusEmail(emailRes[0].email, meeting.title, 'confirmed', confirmed_slot);
    }

    res.json({ success: true, message: 'Meeting confirmed', meeting_link: meetLink });
  } catch (err) {
    next(err);
  }
};

export const scheduleMeetingDirect = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizerId = req.user.id;
    const { attendee_id, title, description, startup_id, start_time, end_time, meeting_link } = req.body as {
      attendee_id?: number;
      title?: string;
      description?: string;
      startup_id?: number | null;
      start_time?: string;
      end_time?: string;
      meeting_link?: string;
    };

    if (!attendee_id || !title || !start_time) {
      res.status(400).json({ success: false, error: 'attendee_id, title and start_time are required.' });
      return;
    }
    if (attendee_id === organizerId) {
      res.status(400).json({ success: false, error: 'You cannot schedule a meeting with yourself.' });
      return;
    }

    const startIso = new Date(start_time).toISOString();
    const endIso = getIsoEnd(startIso, end_time || null);

    if (new Date(endIso) <= new Date(startIso)) {
      res.status(400).json({ success: false, error: 'end_time must be after start_time.' });
      return;
    }

    const [users] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, email, google_calendar_refresh_token
       FROM users
       WHERE id IN (?, ?)`,
      [organizerId, attendee_id]
    );

    if (users.length !== 2) {
      res.status(404).json({ success: false, error: 'Attendee not found.' });
      return;
    }

    const userMap = new Map<number, any>();
    users.forEach((u: any) => userMap.set(u.id, u));
    const organizer = userMap.get(organizerId);
    const attendee = userMap.get(attendee_id);

    if (!organizer.google_calendar_refresh_token) {
      res.status(400).json({
        success: false,
        error: 'Connect your Google Calendar first to schedule synced meetings.',
      });
      return;
    }

    const [conflicts] = await pool.query<RowDataPacket[]>(
      `SELECT id
       FROM meetings
       WHERE status = 'confirmed'
         AND (organizer_id IN (?, ?) OR attendee_id IN (?, ?))
         AND confirmed_slot < ?
         AND IFNULL(confirmed_end, DATE_ADD(confirmed_slot, INTERVAL 30 MINUTE)) > ?`,
      [organizerId, attendee_id, organizerId, attendee_id, new Date(endIso), new Date(startIso)]
    );

    if (conflicts.length > 0) {
      res.status(409).json({ success: false, error: 'Time conflict with an existing confirmed meeting.' });
      return;
    }

    const calendarEvent = await createCalendarEvent({
      refreshToken: organizer.google_calendar_refresh_token,
      summary: title,
      description: description || `Scheduled by ${organizer.name} on Ecosystem`,
      startIso,
      endIso,
      attendeeEmails: [organizer.email, attendee.email],
      meetingLink: meeting_link || null,
    });

    const finalMeetingLink = calendarEvent.meetLink || meeting_link || null;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO meetings
         (title, description, organizer_id, attendee_id, startup_id, status, proposed_slots, confirmed_slot, confirmed_end, meeting_link)
       VALUES (?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?)`,
      [
        title,
        description || null,
        organizerId,
        attendee_id,
        startup_id || null,
        JSON.stringify([startIso]),
        new Date(startIso),
        new Date(endIso),
        finalMeetingLink,
      ]
    );

    await sendMeetingStatusEmail(attendee.email, title, 'confirmed', startIso);

    res.status(201).json({
      success: true,
      data: {
        meeting_id: result.insertId,
        meeting_link: finalMeetingLink,
        start_time: startIso,
        end_time: endIso,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const setMeetingStatus = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, action } = req.params; // action = reject, cancel, complete
    const userId = req.user.id;
    const { notes } = req.body || {};

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM meetings WHERE id = ?', [id]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, error: 'Meeting not found' });
      return;
    }

    const meeting = rows[0];
    
    // Auth
    if (action === 'reject' && meeting.attendee_id !== userId) { res.status(403).json({success:false, error:'Not auth'}); return; }
    if (action === 'cancel' && meeting.organizer_id !== userId) { res.status(403).json({success:false, error:'Not auth'}); return; }
    if (action === 'complete' && (meeting.organizer_id !== userId && meeting.attendee_id !== userId)) { res.status(403).json({success:false, error:'Not auth'}); return; }

    let nextStatus = action === 'reject' ? 'rejected' : action === 'cancel' ? 'cancelled' : 'completed';

    await pool.query('UPDATE meetings SET status = ?, notes = ? WHERE id = ?', [nextStatus, notes || meeting.notes, id]);

    // Send email to other party
    const targetUserId = userId === meeting.organizer_id ? meeting.attendee_id : meeting.organizer_id;
    const [emailRes] = await pool.query<RowDataPacket[]>('SELECT email FROM users WHERE id = ?', [targetUserId]);
    
    if (emailRes.length > 0 && action !== 'complete') {
      await sendMeetingStatusEmail(emailRes[0].email, meeting.title, nextStatus);
    }

    res.json({ success: true, message: `Meeting ${nextStatus}` });
  } catch (err) {
    next(err);
  }
};

export const rescheduleMeeting = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { proposed_slots } = req.body;

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM meetings WHERE id = ?', [id]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, error: 'Meeting not found' });
      return;
    }
    const meeting = rows[0];

    if (meeting.organizer_id !== userId && meeting.attendee_id !== userId) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    // Allowed for either currently if 'pending' or 'confirmed'
    await pool.query(
      'UPDATE meetings SET status = ?, proposed_slots = ?, confirmed_slot = NULL, meeting_link = NULL WHERE id = ?',
      ['pending', JSON.stringify(proposed_slots), id]
    );

    // Notify other party
    const targetUserId = userId === meeting.organizer_id ? meeting.attendee_id : meeting.organizer_id;
    const [emailRes] = await pool.query<RowDataPacket[]>('SELECT email FROM users WHERE id = ?', [targetUserId]);
    
    if (emailRes.length > 0) {
      await sendMeetingRequestedEmail(emailRes[0].email, req.user.name, `Reschedule: ${meeting.title}`);
    }

    res.json({ success: true, message: 'Meeting requested for reschedule' });
  } catch (err) {
    next(err);
  }
};
