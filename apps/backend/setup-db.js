const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function createDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '159753'
    });
    
    const dbName = process.env.DB_NAME || 'startup_ecosystem';
    await connection.query('CREATE DATABASE IF NOT EXISTS `' + dbName + '`');
    console.log('Database ' + dbName + ' created or already exists.');
    
    await connection.end();
  } catch (error) {
    console.error('Error creating database:', error.message);
  }
}

createDatabase();
