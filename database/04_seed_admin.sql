-- ============================================================
-- 04_seed_admin.sql
-- Seeds the default admin user.
-- Password: rishit@159753  (bcrypt hash precomputed)
-- ⚠️  Change credentials IMMEDIATELY after first login.
-- ============================================================

USE `startup_ecosystem`;

-- Insert admin user (upsert-safe)
INSERT INTO `users`
  (`email`, `password_hash`, `role`, `name`, `is_verified`, `is_email_verified`)
VALUES
  (
    'admin@gmail.com',
    -- bcrypt hash of 'rishit@159753' with 12 rounds
    '$2b$12$QWOHKVr4P.LVr1hT7HfTpOzqH7RRXJ.AEXiT0w8M3Tnd.6e5eDSCi',
    'admin',
    'Admin',
    TRUE,
    TRUE
  )
ON DUPLICATE KEY UPDATE
  `role`              = 'admin',
  `is_verified`       = TRUE,
  `is_email_verified` = TRUE;

-- Ensure a user_profiles row exists for the admin
INSERT INTO `user_profiles` (`user_id`)
SELECT `id` FROM `users` WHERE `email` = 'admin@gmail.com'
ON DUPLICATE KEY UPDATE `user_id` = `user_id`;

-- Ensure a gamification row exists for the admin
INSERT INTO `user_gamification` (`user_id`)
SELECT `id` FROM `users` WHERE `email` = 'admin@gmail.com'
ON DUPLICATE KEY UPDATE `user_id` = `user_id`;
