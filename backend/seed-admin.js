const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function seedAdmin() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '159753',
    database: process.env.DB_NAME || 'startup_ecosystem',
  });

  const email = 'admin@gmail.com';
  const password = 'rishit@159753';
  const name = 'Admin';
  const role = 'admin';

  const passwordHash = await bcrypt.hash(password, 12);

  // Upsert: insert or update if already exists
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

  let userId;
  if (existing.length > 0) {
    userId = existing[0].id;
    await pool.query(
      'UPDATE users SET password_hash = ?, role = ?, name = ?, is_verified = TRUE, is_email_verified = TRUE WHERE id = ?',
      [passwordHash, role, name, userId]
    );
    console.log(`Updated existing user (id=${userId}) → role set to admin`);
  } else {
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, role, name, is_verified, is_email_verified) VALUES (?, ?, ?, ?, TRUE, TRUE)',
      [email, passwordHash, role, name]
    );
    userId = result.insertId;
    console.log(`Created admin user with id=${userId}`);
  }

  // Ensure a user_profile row exists (required by FK relations)
  const [profileExists] = await pool.query('SELECT user_id FROM user_profiles WHERE user_id = ?', [userId]);
  if (profileExists.length === 0) {
    await pool.query('INSERT INTO user_profiles (user_id) VALUES (?)', [userId]);
    console.log('Created empty user_profile for admin.');
  }

  // Ensure gamification row exists
  const [gamExists] = await pool.query('SELECT user_id FROM user_gamification WHERE user_id = ?', [userId]);
  if (gamExists.length === 0) {
    await pool.query('INSERT INTO user_gamification (user_id) VALUES (?)', [userId]);
    console.log('Created gamification record for admin.');
  }

  console.log(`\nAdmin ready:\n  Email:    ${email}\n  Password: ${password}\n  Role:     admin`);
  await pool.end();
}

seedAdmin().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
