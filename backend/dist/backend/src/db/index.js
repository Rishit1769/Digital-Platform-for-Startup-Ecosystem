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
        oauth_provider ENUM('google') DEFAULT NULL,
        oauth_sub VARCHAR(255) UNIQUE,
        google_calendar_email VARCHAR(255) DEFAULT NULL,
        google_calendar_refresh_token TEXT,
        google_calendar_connected_at DATETIME DEFAULT NULL,
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
        payload JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Add payload column to existing otp_codes tables
        await connection.query(`
      ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS payload JSON
    `).catch(() => { });
        await connection.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id INT PRIMARY KEY,
        bio TEXT,
        avatar_url VARCHAR(1024),
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
            await connection.query('ALTER TABLE user_profiles MODIFY COLUMN avatar_url VARCHAR(1024)');
        }
        catch (e) { }
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
        // Add FULLTEXT indexes safely
        try {
            await connection.query('ALTER TABLE users ADD FULLTEXT(name)');
        }
        catch (e) { }
        try {
            await connection.query('ALTER TABLE user_profiles ADD FULLTEXT(bio)');
        }
        catch (e) { }
        await connection.query(`
      CREATE TABLE IF NOT EXISTS trends_cache (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cache_key VARCHAR(255) NOT NULL UNIQUE,
        data JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        await connection.query(`
      CREATE TABLE IF NOT EXISTS startups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        tagline VARCHAR(255),
        description TEXT,
        domain VARCHAR(100),
        stage ENUM('idea','mvp','growth','funded') DEFAULT 'idea',
        funding_raised DECIMAL(15,2) DEFAULT NULL,
        logo_url VARCHAR(1024),
        github_url VARCHAR(255),
        github_repo_url VARCHAR(255),
        github_repo_owner VARCHAR(100),
        github_repo_name VARCHAR(100),
        logo_object_name VARCHAR(1024) DEFAULT NULL,
        logo_version BIGINT DEFAULT NULL,
        pitch_pdf_object_name VARCHAR(1024) DEFAULT NULL,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        await connection.query(`
      CREATE TABLE IF NOT EXISTS featured_works (
        id INT AUTO_INCREMENT PRIMARY KEY,
        startup_id INT NOT NULL,
        headline VARCHAR(255),
        summary TEXT,
        hero_image_url VARCHAR(1024),
        cta_label VARCHAR(100),
        cta_url VARCHAR(1024),
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
        // Safe alter tables if already seeded
        try {
            await connection.query('ALTER TABLE startups ADD COLUMN funding_raised DECIMAL(15,2) DEFAULT NULL');
        }
        catch (e) { }
        try {
            await connection.query('ALTER TABLE startups MODIFY COLUMN logo_url VARCHAR(1024)');
        }
        catch (e) { }
        try {
            await connection.query('ALTER TABLE startups ADD COLUMN github_repo_url VARCHAR(255)');
        }
        catch (e) { }
        try {
            await connection.query('ALTER TABLE startups ADD COLUMN github_repo_owner VARCHAR(100)');
        }
        catch (e) { }
        try {
            await connection.query('ALTER TABLE startups ADD COLUMN github_repo_name VARCHAR(100)');
        }
        catch (e) { }
        try {
            await connection.query('ALTER TABLE startups ADD COLUMN startup_email VARCHAR(255) DEFAULT NULL');
        }
        catch (e) { }
        try {
            await connection.query('ALTER TABLE startups ADD COLUMN logo_object_name VARCHAR(1024) DEFAULT NULL');
        }
        catch (e) { }
        try {
            await connection.query('ALTER TABLE startups ADD COLUMN logo_version BIGINT DEFAULT NULL');
        }
        catch (e) { }
        try {
            await connection.query('ALTER TABLE startups ADD COLUMN pitch_pdf_object_name VARCHAR(1024) DEFAULT NULL');
        }
        catch (e) { }
        await connection.query(`
      CREATE TABLE IF NOT EXISTS github_cache (
        id INT PRIMARY KEY AUTO_INCREMENT,
        startup_id INT UNIQUE NOT NULL,
        commit_count_week INT DEFAULT 0,
        commit_count_month INT DEFAULT 0,
        last_push_at DATETIME,
        open_issues INT DEFAULT 0,
        stars INT DEFAULT 0,
        forks INT DEFAULT 0,
        contributors JSON,
        languages JSON,
        cached_at DATETIME,
        FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE
      )
    `);
        await connection.query(`
      CREATE TABLE IF NOT EXISTS startup_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        startup_id INT NOT NULL,
        user_id INT NOT NULL,
        role VARCHAR(100),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (startup_id, user_id)
      )
    `);
        await connection.query(`
      CREATE TABLE IF NOT EXISTS barter_listings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        startup_id INT NOT NULL,
        offer_text TEXT NOT NULL,
        need_text TEXT NOT NULL,
        details TEXT,
        status ENUM('open','closed') DEFAULT 'open',
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        await connection.query(`
      CREATE TABLE IF NOT EXISTS startup_mentor_access_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        startup_id INT NOT NULL,
        student_id INT NOT NULL,
        mentor_id INT NOT NULL,
        message TEXT,
        status ENUM('pending','approved','rejected') DEFAULT 'pending',
        reviewed_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        await connection.query(`
      CREATE TABLE IF NOT EXISTS open_roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        startup_id INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        skills_required JSON,
        posted_by INT NOT NULL,
        is_filled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE,
        FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        await connection.query(`
      CREATE TABLE IF NOT EXISTS pitch_decks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        startup_id INT NOT NULL,
        content JSON NOT NULL,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        version INT DEFAULT 1,
        FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE
      )
    `);
        await connection.query(`
      CREATE TABLE IF NOT EXISTS role_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        open_role_id INT NOT NULL,
        applicant_id INT NOT NULL,
        message TEXT,
        status ENUM('pending','accepted','rejected') DEFAULT 'pending',
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (open_role_id) REFERENCES open_roles(id) ON DELETE CASCADE,
        FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        await connection.query(`
      CREATE TABLE IF NOT EXISTS ideas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        domain VARCHAR(100),
        posted_by INT NOT NULL,
        upvotes INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        await connection.query(`
      CREATE TABLE IF NOT EXISTS idea_feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        idea_id INT NOT NULL,
        user_id INT NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        await connection.query(`
      CREATE TABLE IF NOT EXISTS peer_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        startup_id INT NOT NULL,
        reviewer_id INT NOT NULL,
        reviewee_id INT NOT NULL,
        rating INT NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        await connection.query(`
      CREATE TABLE IF NOT EXISTS startup_upvotes (
        startup_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (startup_id, user_id),
        FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        try {
            await connection.query('ALTER TABLE startup_upvotes ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        }
        catch (e) { }
        await connection.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        organizer_id INT NOT NULL,
        attendee_id INT NOT NULL,
        startup_id INT NULL,
        status ENUM('pending','confirmed','rejected','cancelled','completed') DEFAULT 'pending',
        proposed_slots JSON NOT NULL,
        confirmed_slot DATETIME NULL,
        confirmed_end DATETIME NULL,
        meeting_link VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (attendee_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE SET NULL
      )
    `);
        await connection.query(`
      CREATE TABLE IF NOT EXISTS office_hours (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mentor_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        day_of_week ENUM('Mon','Tue','Wed','Thu','Fri','Sat','Sun') NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        max_bookings INT DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        await connection.query(`
      CREATE TABLE IF NOT EXISTS office_hour_bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        office_hour_id INT NOT NULL,
        student_id INT NOT NULL,
        booked_date DATE NOT NULL,
        status ENUM('pending','confirmed','cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (office_hour_id) REFERENCES office_hours(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(office_hour_id, booked_date, student_id)
      )
    `);
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
        await connection.query(`
      CREATE TABLE IF NOT EXISTS startup_milestones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        startup_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        stage ENUM('idea','prototype','mvp','beta','launch','funded') NOT NULL,
        completed_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE
      )
    `);
        await connection.query(`
      CREATE TABLE IF NOT EXISTS ecosystem_snapshots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        snapshot_date DATE NOT NULL UNIQUE,
        total_users INT NOT NULL DEFAULT 0,
        total_startups INT NOT NULL DEFAULT 0,
        total_meetings INT NOT NULL DEFAULT 0,
        total_ideas INT NOT NULL DEFAULT 0,
        total_connections INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        await connection.query(`
      CREATE TABLE IF NOT EXISTS news (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(100) DEFAULT 'general',
        admin_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        // Add new user fields safely
        try {
            await connection.query("ALTER TABLE users ADD COLUMN phone VARCHAR(20)");
        }
        catch (e) { }
        try {
            await connection.query("ALTER TABLE users ADD COLUMN startup_intent ENUM('has_startup','finding_startup') DEFAULT NULL");
        }
        catch (e) { }
        try {
            await connection.query("ALTER TABLE users ADD COLUMN oauth_provider ENUM('google') DEFAULT NULL");
        }
        catch (e) { }
        try {
            await connection.query("ALTER TABLE users ADD COLUMN oauth_sub VARCHAR(255)");
        }
        catch (e) { }
        try {
            await connection.query('ALTER TABLE users ADD UNIQUE INDEX uq_users_oauth_sub (oauth_sub)');
        }
        catch (e) { }
        try {
            await connection.query('ALTER TABLE users ADD COLUMN google_calendar_email VARCHAR(255) DEFAULT NULL');
        }
        catch (e) { }
        try {
            await connection.query('ALTER TABLE users ADD COLUMN google_calendar_refresh_token TEXT');
        }
        catch (e) { }
        try {
            await connection.query('ALTER TABLE users ADD COLUMN google_calendar_connected_at DATETIME DEFAULT NULL');
        }
        catch (e) { }
        try {
            await connection.query("ALTER TABLE news ADD COLUMN image_url VARCHAR(1024) DEFAULT NULL");
        }
        catch (e) { }
        try {
            await connection.query('ALTER TABLE meetings ADD COLUMN confirmed_end DATETIME NULL');
        }
        catch (e) { }
        // Kanban tasks table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS kanban_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT NULL,
        status ENUM('todo','in_progress','review','done','blocked') NOT NULL DEFAULT 'todo',
        priority ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
        due_date DATE DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
