"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = exports.pool = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.pool = promise_1.default.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'cloudcampus',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
const initializeDatabase = async () => {
    try {
        const connection = await exports.pool.getConnection();
        console.log('Successfully connected to the database.');
        // Create tables
        await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('student', 'mentor', 'admin') DEFAULT 'student',
        name VARCHAR(255) NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        is_email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        await connection.query(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        type ENUM('register', 'forgot_password') NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        await connection.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id INT PRIMARY KEY,
        bio TEXT,
        avatar_url VARCHAR(255),
        skills JSON,
        interests JSON,
        preferred_domains JSON,
        github_url VARCHAR(255),
        linkedin_url VARCHAR(255),
        college VARCHAR(255),
        year_of_study VARCHAR(50),
        cgpa DECIMAL(3,2),
        company VARCHAR(255),
        expertise VARCHAR(255),
        designation VARCHAR(255),
        years_of_experience INT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        // Safe alter tables to add fields if db is already initialized
        try {
            await connection.query('ALTER TABLE user_profiles ADD COLUMN cgpa DECIMAL(3,2)');
        }
        catch (e) { }
        try {
            await connection.query('ALTER TABLE user_profiles ADD COLUMN designation VARCHAR(255)');
        }
        catch (e) { }
        try {
            await connection.query('ALTER TABLE user_profiles ADD COLUMN years_of_experience INT');
        }
        catch (e) { }
        await connection.query(`
      CREATE TABLE IF NOT EXISTS verification_badges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        badge_type VARCHAR(100) NOT NULL,
        granted_by INT,
        granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
        console.log('Database schema initialized.');
        connection.release();
    }
    catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
};
exports.initializeDatabase = initializeDatabase;
