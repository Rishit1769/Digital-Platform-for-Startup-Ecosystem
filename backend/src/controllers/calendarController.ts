import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../db';

export const getCalendarEvents = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id;
    const { start, end } = req.query; // Iso strings

    const events: any[] = [];

    // 1. Meetings (pending, confirmed, completed) - we'll send them all so the Kanban board can distribute them
    const [meetings] = await pool.query<RowDataPacket[]>(`
      SELECT m.id, m.title, m.status, m.confirmed_slot, m.proposed_slots,
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
