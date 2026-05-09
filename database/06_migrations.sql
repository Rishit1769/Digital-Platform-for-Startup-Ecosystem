-- ============================================================
-- 06_migrations.sql
-- Incremental ALTER TABLE migrations for existing databases
-- Safe to run on a live database that was set up with an
-- earlier version of the schema.
-- Each block is wrapped in a safe error-ignoring pattern.
-- ============================================================

USE `startup_ecosystem`;

-- ---- users table additions --------------------------------
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `phone`          VARCHAR(20)  DEFAULT NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `startup_intent` ENUM('has_startup','finding_startup') DEFAULT NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `google_calendar_email`         VARCHAR(255) DEFAULT NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `google_calendar_refresh_token` TEXT;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `google_calendar_connected_at`  DATETIME     DEFAULT NULL;

-- Ensure oauth_sub unique index (safe)
ALTER TABLE `users` MODIFY COLUMN `oauth_provider` ENUM('google') DEFAULT NULL;
ALTER TABLE `users` MODIFY COLUMN `avatar_url`     VARCHAR(1024);

-- Add unique index on oauth_sub if missing
CREATE UNIQUE INDEX IF NOT EXISTS `uq_users_oauth_sub` ON `users` (`oauth_sub`);

-- ---- user_profiles additions ------------------------------
ALTER TABLE `user_profiles` MODIFY COLUMN `avatar_url`          VARCHAR(1024);
ALTER TABLE `user_profiles` ADD COLUMN IF NOT EXISTS `cgpa`               DECIMAL(3,2);
ALTER TABLE `user_profiles` ADD COLUMN IF NOT EXISTS `designation`        VARCHAR(255);
ALTER TABLE `user_profiles` ADD COLUMN IF NOT EXISTS `years_of_experience` INT;

-- ---- user_gamification table (new table safe creation) ----
CREATE TABLE IF NOT EXISTS `user_gamification` (
  `user_id`       INT  PRIMARY KEY,
  `xp_points`     INT  DEFAULT 0,
  `level`         INT  DEFAULT 1,
  `badges_earned` JSON,
  `last_activity` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---- otp_codes additions ----------------------------------
ALTER TABLE `otp_codes` ADD COLUMN IF NOT EXISTS `payload` JSON;

-- ---- startups additions -----------------------------------
ALTER TABLE `startups` ADD COLUMN IF NOT EXISTS `funding_raised`        DECIMAL(15,2) DEFAULT NULL;
ALTER TABLE `startups` MODIFY COLUMN             `logo_url`             VARCHAR(1024);
ALTER TABLE `startups` ADD COLUMN IF NOT EXISTS `github_repo_url`       VARCHAR(255);
ALTER TABLE `startups` ADD COLUMN IF NOT EXISTS `github_repo_owner`     VARCHAR(100);
ALTER TABLE `startups` ADD COLUMN IF NOT EXISTS `github_repo_name`      VARCHAR(100);
ALTER TABLE `startups` ADD COLUMN IF NOT EXISTS `startup_email`         VARCHAR(255) DEFAULT NULL;
ALTER TABLE `startups` ADD COLUMN IF NOT EXISTS `logo_object_name`      VARCHAR(1024) DEFAULT NULL;
ALTER TABLE `startups` ADD COLUMN IF NOT EXISTS `logo_version`          BIGINT DEFAULT NULL;
ALTER TABLE `startups` ADD COLUMN IF NOT EXISTS `pitch_pdf_object_name` VARCHAR(1024) DEFAULT NULL;

-- ---- startup_upvotes additions ----------------------------
ALTER TABLE `startup_upvotes` ADD COLUMN IF NOT EXISTS `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ---- meetings additions -----------------------------------
ALTER TABLE `meetings` ADD COLUMN IF NOT EXISTS `confirmed_end` DATETIME NULL;

-- ---- news additions ---------------------------------------
ALTER TABLE `news` ADD COLUMN IF NOT EXISTS `image_url` VARCHAR(1024) DEFAULT NULL;

-- ---- kanban_tasks (new table safe creation) ---------------
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

-- ---- featured_works (new table safe creation) -------------
CREATE TABLE IF NOT EXISTS `featured_works` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `startup_id`    INT          NOT NULL,
  `headline`      VARCHAR(255),
  `summary`       TEXT,
  `hero_image_url` VARCHAR(1024),
  `cta_label`     VARCHAR(100),
  `cta_url`       VARCHAR(1024),
  `display_order` INT DEFAULT 0,
  `is_active`     BOOLEAN DEFAULT TRUE,
  `created_by`    INT,
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---- Full-text indexes ------------------------------------
ALTER TABLE `users`         ADD FULLTEXT INDEX `ft_users_name`  (`name`);
ALTER TABLE `user_profiles` ADD FULLTEXT INDEX `ft_profiles_bio` (`bio`);
