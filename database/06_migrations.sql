-- ============================================================
-- 06_migrations.sql
-- Incremental migrations for existing databases.
-- Safe to run on a live DB — each block checks column/index
-- existence before altering, using information_schema + PREPARE.
-- ============================================================

USE `startup_ecosystem`;

-- ============================================================
-- Helper macro pattern:
--   SET @exists := (SELECT COUNT(1) FROM information_schema.COLUMNS
--                   WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='t' AND COLUMN_NAME='c');
--   SET @sql := IF(@exists=0, 'ALTER TABLE `t` ADD COLUMN `c` ...', 'SELECT 1');
--   PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
-- ============================================================

-- ---- users table additions --------------------------------

SET @e := (SELECT COUNT(1) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='phone');
SET @q := IF(@e=0, 'ALTER TABLE `users` ADD COLUMN `phone` VARCHAR(20) DEFAULT NULL', 'SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;

SET @e := (SELECT COUNT(1) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='startup_intent');
SET @q := IF(@e=0, 'ALTER TABLE `users` ADD COLUMN `startup_intent` ENUM(''has_startup'',''finding_startup'') DEFAULT NULL', 'SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;

SET @e := (SELECT COUNT(1) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='google_calendar_email');
SET @q := IF(@e=0, 'ALTER TABLE `users` ADD COLUMN `google_calendar_email` VARCHAR(255) DEFAULT NULL', 'SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;

SET @e := (SELECT COUNT(1) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='google_calendar_refresh_token');
SET @q := IF(@e=0, 'ALTER TABLE `users` ADD COLUMN `google_calendar_refresh_token` TEXT', 'SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;

SET @e := (SELECT COUNT(1) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='google_calendar_connected_at');
SET @q := IF(@e=0, 'ALTER TABLE `users` ADD COLUMN `google_calendar_connected_at` DATETIME DEFAULT NULL', 'SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;

-- Ensure oauth_provider column type is correct
ALTER TABLE `users` MODIFY COLUMN `oauth_provider` ENUM('google') DEFAULT NULL;

-- Add unique index on oauth_sub if missing
SET @e := (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND INDEX_NAME='uq_users_oauth_sub');
SET @q := IF(@e=0, 'CREATE UNIQUE INDEX `uq_users_oauth_sub` ON `users` (`oauth_sub`)', 'SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;

-- ---- user_profiles additions ------------------------------

ALTER TABLE `user_profiles` MODIFY COLUMN `avatar_url` VARCHAR(1024);

SET @e := (SELECT COUNT(1) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='user_profiles' AND COLUMN_NAME='cgpa');
SET @q := IF(@e=0, 'ALTER TABLE `user_profiles` ADD COLUMN `cgpa` DECIMAL(3,2)', 'SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;

SET @e := (SELECT COUNT(1) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='user_profiles' AND COLUMN_NAME='designation');
SET @q := IF(@e=0, 'ALTER TABLE `user_profiles` ADD COLUMN `designation` VARCHAR(255)', 'SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;

SET @e := (SELECT COUNT(1) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='user_profiles' AND COLUMN_NAME='years_of_experience');
SET @q := IF(@e=0, 'ALTER TABLE `user_profiles` ADD COLUMN `years_of_experience` INT', 'SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;

-- ---- user_gamification table (safe creation) ---------------
CREATE TABLE IF NOT EXISTS `user_gamification` (
  `user_id`       INT  PRIMARY KEY,
  `xp_points`     INT  DEFAULT 0,
  `level`         INT  DEFAULT 1,
  `badges_earned` JSON,
  `last_activity` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---- otp_codes additions ----------------------------------

SET @e := (SELECT COUNT(1) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='otp_codes' AND COLUMN_NAME='payload');
SET @q := IF(@e=0, 'ALTER TABLE `otp_codes` ADD COLUMN `payload` JSON', 'SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;

-- ---- startups additions -----------------------------------

SET @e := (SELECT COUNT(1) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='startups' AND COLUMN_NAME='funding_raised');
SET @q := IF(@e=0, 'ALTER TABLE `startups` ADD COLUMN `funding_raised` DECIMAL(15,2) DEFAULT NULL', 'SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;

ALTER TABLE `startups` MODIFY COLUMN `logo_url` VARCHAR(1024);

SET @e := (SELECT COUNT(1) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='startups' AND COLUMN_NAME='github_repo_url');
SET @q := IF(@e=0, 'ALTER TABLE `startups` ADD COLUMN `github_repo_url` VARCHAR(255)', 'SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;

SET @e := (SELECT COUNT(1) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='startups' AND COLUMN_NAME='github_repo_owner');
SET @q := IF(@e=0, 'ALTER TABLE `startups` ADD COLUMN `github_repo_owner` VARCHAR(100)', 'SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;

SET @e := (SELECT COUNT(1) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='startups' AND COLUMN_NAME='github_repo_name');
SET @q := IF(@e=0, 'ALTER TABLE `startups` ADD COLUMN `github_repo_name` VARCHAR(100)', 'SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;

SET @e := (SELECT COUNT(1) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='startups' AND COLUMN_NAME='startup_email');
SET @q := IF(@e=0, 'ALTER TABLE `startups` ADD COLUMN `startup_email` VARCHAR(255) DEFAULT NULL', 'SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;

SET @e := (SELECT COUNT(1) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='startups' AND COLUMN_NAME='logo_object_name');
SET @q := IF(@e=0, 'ALTER TABLE `startups` ADD COLUMN `logo_object_name` VARCHAR(1024) DEFAULT NULL', 'SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;

SET @e := (SELECT COUNT(1) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='startups' AND COLUMN_NAME='logo_version');
SET @q := IF(@e=0, 'ALTER TABLE `startups` ADD COLUMN `logo_version` BIGINT DEFAULT NULL', 'SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;

SET @e := (SELECT COUNT(1) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='startups' AND COLUMN_NAME='pitch_pdf_object_name');
SET @q := IF(@e=0, 'ALTER TABLE `startups` ADD COLUMN `pitch_pdf_object_name` VARCHAR(1024) DEFAULT NULL', 'SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;

-- ---- startup_upvotes additions ----------------------------

SET @e := (SELECT COUNT(1) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='startup_upvotes' AND COLUMN_NAME='created_at');
SET @q := IF(@e=0, 'ALTER TABLE `startup_upvotes` ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP', 'SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;

-- ---- meetings additions -----------------------------------

SET @e := (SELECT COUNT(1) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='meetings' AND COLUMN_NAME='confirmed_end');
SET @q := IF(@e=0, 'ALTER TABLE `meetings` ADD COLUMN `confirmed_end` DATETIME NULL', 'SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;

-- ---- news additions ---------------------------------------

SET @e := (SELECT COUNT(1) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='news' AND COLUMN_NAME='image_url');
SET @q := IF(@e=0, 'ALTER TABLE `news` ADD COLUMN `image_url` VARCHAR(1024) DEFAULT NULL', 'SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;

-- ---- kanban_tasks (safe creation) -------------------------
CREATE TABLE IF NOT EXISTS `kanban_tasks` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`     INT          NOT NULL,
  `title`       VARCHAR(255) NOT NULL,
  `description` TEXT         DEFAULT NULL,
  `status`      ENUM('todo','in_progress','review','done','blocked') NOT NULL DEFAULT 'todo',
  `priority`    ENUM('low','medium','high','urgent')                 NOT NULL DEFAULT 'medium',
  `due_date`    DATE         DEFAULT NULL,
  `created_at`  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---- featured_works (safe creation) -----------------------
CREATE TABLE IF NOT EXISTS `featured_works` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `startup_id`     INT          NOT NULL,
  `headline`       VARCHAR(255),
  `summary`        TEXT,
  `hero_image_url` VARCHAR(1024),
  `cta_label`      VARCHAR(100),
  `cta_url`        VARCHAR(1024),
  `display_order`  INT DEFAULT 0,
  `is_active`      BOOLEAN DEFAULT TRUE,
  `created_by`     INT,
  `created_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---- Full-text indexes ------------------------------------

SET @e := (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND INDEX_NAME='ft_users_name');
SET @q := IF(@e=0, 'ALTER TABLE `users` ADD FULLTEXT INDEX `ft_users_name` (`name`)', 'SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;

SET @e := (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='user_profiles' AND INDEX_NAME='ft_profiles_bio');
SET @q := IF(@e=0, 'ALTER TABLE `user_profiles` ADD FULLTEXT INDEX `ft_profiles_bio` (`bio`)', 'SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;
