import { Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../db';
import { sendOfficeHourBookedEmail } from '../services/email';

// Mentor actions
export const createOfficeHour = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, day_of_week, start_time, end_time, max_bookings } = req.body;
    const mentor_id = req.user.id;

    if (req.user.role !== 'mentor') {
      res.status(403).json({ success: false, error: 'Only mentors can create office hours' });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO office_hours (mentor_id, title, day_of_week, start_time, end_time, max_bookings) VALUES (?, ?, ?, ?, ?, ?)',
      [mentor_id, title, day_of_week, start_time, end_time, max_bookings || 1]
    );

    res.status(201).json({ success: true, slot_id: result.insertId });
  } catch (err) {
    next(err);
  }
};

export const getMentorOfficeHours = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { mentorId } = req.params;
    const [rows] = await pool.query(`
      SELECT * FROM office_hours WHERE mentor_id = ? AND is_active = TRUE
      ORDER BY FIELD(day_of_week, 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'), start_time
    `, [mentorId]);
    
    // Also fetch bookings mapped to these slots mapped by date
    const [bookings] = await pool.query(`
      SELECT b.*, u.name as student_name, p.avatar_url
      FROM office_hour_bookings b
      JOIN office_hours oh ON b.office_hour_id = oh.id
      JOIN users u ON b.student_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE oh.mentor_id = ? AND b.status = 'confirmed' AND oh.is_active = TRUE
    `, [mentorId]);

    res.json({ success: true, data: { slots: rows, bookings } });
  } catch (err) {
    next(err);
  }
};

export const updateOfficeHour = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, day_of_week, start_time, end_time, max_bookings, is_active } = req.body;
    const mentor_id = req.user.id;

    await pool.query(
      'UPDATE office_hours SET title=?, day_of_week=?, start_time=?, end_time=?, max_bookings=?, is_active=? WHERE id=? AND mentor_id=?',
      [title, day_of_week, start_time, end_time, max_bookings, is_active, id, mentor_id]
    );

    res.json({ success: true, message: 'Updated' });
  } catch (err) {
    next(err);
  }
};

export const deactivateOfficeHour = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE office_hours SET is_active = FALSE WHERE id = ? AND mentor_id = ?', [id, req.user.id]);
    res.json({ success: true, message: 'Deactivated' });
  } catch (err) {
    next(err);
  }
};

// Student actions
export const getAvailableSlots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { mentorId } = req.params;
    const { date } = req.query; // YYYY-MM-DD
    
    if (!date) return;

    const dayName = new Date(date as string).toLocaleDateString('en-US', { weekday: 'short' }); // "Mon", "Tue"

    const [slots] = await pool.query<RowDataPacket[]>(`
      SELECT oh.*, 
        (SELECT COUNT(*) FROM office_hour_bookings WHERE office_hour_id = oh.id AND booked_date = ? AND status != 'cancelled') as booked_count
      FROM office_hours oh
      WHERE oh.mentor_id = ? AND oh.day_of_week = ? AND oh.is_active = TRUE
    `, [date, mentorId, dayName]);

    res.json({ success: true, data: slots });
  } catch (err) {
    next(err);
  }
};

export const bookOfficeHour = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { date } = req.body;
    const student_id = req.user.id;

    // Verify slot
    const [slots] = await pool.query<RowDataPacket[]>('SELECT * FROM office_hours WHERE id = ? AND is_active = TRUE', [id]);
    if (slots.length === 0) { res.status(404).json({ success: false, error: 'Slot not found' }); return; }
    
    const oh = slots[0];
    
    // Day check
    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
    if (oh.day_of_week !== dayName) {
      res.status(400).json({ success: false, error: 'Date does not match the slots day string' }); return;
    }

    // Capacity check
    const [bookings] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM office_hour_bookings WHERE office_hour_id = ? AND booked_date = ? AND status != "cancelled"', [id, date]);
    if (bookings[0].count >= oh.max_bookings) {
      res.status(400).json({ success: false, error: 'Slot is full for this date' }); return;
    }

    try {
      await pool.query(
        'INSERT INTO office_hour_bookings (office_hour_id, student_id, booked_date, status) VALUES (?, ?, ?, ?)',
        [id, student_id, date, 'confirmed']
      );

      // Email mentor
      const [mentors] = await pool.query<RowDataPacket[]>('SELECT email FROM users WHERE id = ?', [oh.mentor_id]);
      if (mentors.length > 0) {
        await sendOfficeHourBookedEmail(mentors[0].email, req.user.name, date, oh.start_time);
      }

      res.status(201).json({ success: true, message: 'Booked' });
    } catch(e: any) {
      if (e.code === 'ER_DUP_ENTRY') res.status(400).json({ success: false, error:'Already booked this slot on this date.' });
      else throw e;
    }
  } catch (err) {
    next(err);
  }
};

export const getMyBookings = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await pool.query(`
      SELECT b.id as booking_id, b.booked_date, b.status, oh.title, oh.start_time, oh.end_time,
             u.name as mentor_name, p.avatar_url
      FROM office_hour_bookings b
      JOIN office_hours oh ON b.office_hour_id = oh.id
      JOIN users u ON oh.mentor_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE b.student_id = ?
      ORDER BY b.booked_date DESC
    `, [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

export const cancelBooking = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE office_hour_bookings SET status = "cancelled" WHERE id = ? AND student_id = ?', [id, req.user.id]);
    res.json({ success: true, message: 'Cancelled' });
  } catch (err) {
    next(err);
  }
};
