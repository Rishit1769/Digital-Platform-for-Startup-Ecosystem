-- ============================================================
-- 05_seed_sample_data.sql
-- Optional: demo / development sample data
-- ⚠️  DO NOT run in production!
-- ============================================================

USE `startup_ecosystem`;

-- ------------------------------------------------------------
-- Sample Users (passwords are bcrypt of 'Test@123456')
-- ------------------------------------------------------------
INSERT IGNORE INTO `users`
  (`email`, `password_hash`, `role`, `name`, `is_verified`, `is_email_verified`)
VALUES
  ('student1@demo.com', '$2b$12$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUVWXYZ01', 'student', 'Alice Student', TRUE, TRUE),
  ('student2@demo.com', '$2b$12$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUVWXYZ02', 'student', 'Bob Builder',   TRUE, TRUE),
  ('mentor1@demo.com',  '$2b$12$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUVWXYZ03', 'mentor',  'Carol Mentor',  TRUE, TRUE);

-- Sample user profiles
INSERT IGNORE INTO `user_profiles` (`user_id`, `bio`, `college`, `year_of_study`, `skills`)
SELECT id, 'Passionate about AI and startups.', 'IIT Delhi', '3rd Year', '["Python","React","Node.js"]'
FROM `users` WHERE `email` = 'student1@demo.com';

INSERT IGNORE INTO `user_profiles` (`user_id`, `bio`, `college`, `year_of_study`, `skills`)
SELECT id, 'Full-stack developer and entrepreneur.', 'IIT Bombay', '4th Year', '["TypeScript","MySQL","Docker"]'
FROM `users` WHERE `email` = 'student2@demo.com';

INSERT IGNORE INTO `user_profiles` (`user_id`, `bio`, `company`, `expertise`, `designation`, `years_of_experience`)
SELECT id, 'Serial entrepreneur and angel investor.', 'TechVentures Inc.', 'SaaS & B2B', 'CTO', 12
FROM `users` WHERE `email` = 'mentor1@demo.com';

-- Sample gamification rows
INSERT IGNORE INTO `user_gamification` (`user_id`)
SELECT id FROM `users` WHERE `email` IN ('student1@demo.com', 'student2@demo.com', 'mentor1@demo.com');

-- ------------------------------------------------------------
-- Sample Startup
-- ------------------------------------------------------------
INSERT IGNORE INTO `startups`
  (`name`, `tagline`, `description`, `domain`, `stage`, `created_by`)
SELECT
  'EduTech AI',
  'AI-powered personalized learning for every student',
  'EduTech AI leverages cutting-edge machine learning to adapt curricula in real-time, improving learning outcomes by 40%.',
  'EdTech',
  'mvp',
  u.id
FROM `users` u WHERE u.email = 'student1@demo.com'
LIMIT 1;

-- Founder as member
INSERT IGNORE INTO `startup_members` (`startup_id`, `user_id`, `role`)
SELECT s.id, u.id, 'Founder'
FROM `startups` s
JOIN `users` u ON u.email = 'student1@demo.com'
WHERE s.name = 'EduTech AI'
LIMIT 1;

-- ------------------------------------------------------------
-- Sample Open Role
-- ------------------------------------------------------------
INSERT IGNORE INTO `open_roles` (`startup_id`, `title`, `description`, `skills_required`, `posted_by`)
SELECT s.id, 'ML Engineer',
  'Looking for an ML engineer to help build our recommendation engine.',
  '["Python","TensorFlow","scikit-learn"]',
  u.id
FROM `startups` s
JOIN `users` u ON u.email = 'student1@demo.com'
WHERE s.name = 'EduTech AI'
LIMIT 1;

-- ------------------------------------------------------------
-- Sample Idea
-- ------------------------------------------------------------
INSERT IGNORE INTO `ideas` (`title`, `description`, `domain`, `posted_by`)
SELECT 'Carbon-neutral delivery network',
  'A last-mile delivery network using electric bikes and AI route optimization.',
  'GreenTech',
  id
FROM `users` WHERE `email` = 'student2@demo.com'
LIMIT 1;

-- ------------------------------------------------------------
-- Sample News
-- ------------------------------------------------------------
INSERT IGNORE INTO `news` (`title`, `content`, `category`, `admin_id`)
SELECT 'Platform Launch 🚀',
  'Welcome to the Digital Platform for Startup Ecosystem! This platform connects students, mentors, and startups to build the next generation of tech companies.',
  'announcement',
  id
FROM `users` WHERE `email` = 'admin@gmail.com'
LIMIT 1;
