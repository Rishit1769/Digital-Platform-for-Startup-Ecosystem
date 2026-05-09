-- ============================================================
-- 03_indexes.sql
-- Full-text search & performance indexes
-- Run only on a FRESH database (after 02_schema.sql).
-- For upgrades on existing databases use 06_migrations.sql.
-- ============================================================

USE `startup_ecosystem`;

-- Full-text search on user names (skip if already exists)
SET @exists := (
  SELECT COUNT(1) FROM information_schema.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name   = 'users'
    AND index_name   = 'ft_users_name'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE `users` ADD FULLTEXT INDEX `ft_users_name` (`name`)',
  'SELECT ''ft_users_name already exists, skipping'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Full-text search on user bio
SET @exists := (
  SELECT COUNT(1) FROM information_schema.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name   = 'user_profiles'
    AND index_name   = 'ft_profiles_bio'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE `user_profiles` ADD FULLTEXT INDEX `ft_profiles_bio` (`bio`)',
  'SELECT ''ft_profiles_bio already exists, skipping'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Performance index: startups by domain
SET @exists := (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE table_schema = DATABASE() AND table_name = 'startups' AND index_name = 'idx_startups_domain');
SET @sql := IF(@exists = 0, 'ALTER TABLE `startups` ADD INDEX `idx_startups_domain` (`domain`)', 'SELECT ''skip'' AS s');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Performance index: startups by stage
SET @exists := (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE table_schema = DATABASE() AND table_name = 'startups' AND index_name = 'idx_startups_stage');
SET @sql := IF(@exists = 0, 'ALTER TABLE `startups` ADD INDEX `idx_startups_stage` (`stage`)', 'SELECT ''skip'' AS s');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Performance index: startups by creator
SET @exists := (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE table_schema = DATABASE() AND table_name = 'startups' AND index_name = 'idx_startups_created_by');
SET @sql := IF(@exists = 0, 'ALTER TABLE `startups` ADD INDEX `idx_startups_created_by` (`created_by`)', 'SELECT ''skip'' AS s');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Performance index: meetings by organizer
SET @exists := (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE table_schema = DATABASE() AND table_name = 'meetings' AND index_name = 'idx_meetings_organizer');
SET @sql := IF(@exists = 0, 'ALTER TABLE `meetings` ADD INDEX `idx_meetings_organizer` (`organizer_id`)', 'SELECT ''skip'' AS s');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Performance index: meetings by attendee
SET @exists := (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE table_schema = DATABASE() AND table_name = 'meetings' AND index_name = 'idx_meetings_attendee');
SET @sql := IF(@exists = 0, 'ALTER TABLE `meetings` ADD INDEX `idx_meetings_attendee` (`attendee_id`)', 'SELECT ''skip'' AS s');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Performance index: meetings by startup
SET @exists := (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE table_schema = DATABASE() AND table_name = 'meetings' AND index_name = 'idx_meetings_startup');
SET @sql := IF(@exists = 0, 'ALTER TABLE `meetings` ADD INDEX `idx_meetings_startup` (`startup_id`)', 'SELECT ''skip'' AS s');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Performance index: otp_codes by email + type
SET @exists := (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE table_schema = DATABASE() AND table_name = 'otp_codes' AND index_name = 'idx_otp_email_type');
SET @sql := IF(@exists = 0, 'ALTER TABLE `otp_codes` ADD INDEX `idx_otp_email_type` (`email`, `type`)', 'SELECT ''skip'' AS s');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Performance index: kanban tasks by user + status
SET @exists := (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE table_schema = DATABASE() AND table_name = 'kanban_tasks' AND index_name = 'idx_kanban_user_status');
SET @sql := IF(@exists = 0, 'ALTER TABLE `kanban_tasks` ADD INDEX `idx_kanban_user_status` (`user_id`, `status`)', 'SELECT ''skip'' AS s');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Performance index: ideas by domain
SET @exists := (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE table_schema = DATABASE() AND table_name = 'ideas' AND index_name = 'idx_ideas_domain');
SET @sql := IF(@exists = 0, 'ALTER TABLE `ideas` ADD INDEX `idx_ideas_domain` (`domain`)', 'SELECT ''skip'' AS s');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Performance index: news by admin
SET @exists := (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE table_schema = DATABASE() AND table_name = 'news' AND index_name = 'idx_news_admin');
SET @sql := IF(@exists = 0, 'ALTER TABLE `news` ADD INDEX `idx_news_admin` (`admin_id`)', 'SELECT ''skip'' AS s');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Performance index: office_hours by mentor
SET @exists := (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE table_schema = DATABASE() AND table_name = 'office_hours' AND index_name = 'idx_office_hours_mentor');
SET @sql := IF(@exists = 0, 'ALTER TABLE `office_hours` ADD INDEX `idx_office_hours_mentor` (`mentor_id`)', 'SELECT ''skip'' AS s');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Performance index: snapshots by date
SET @exists := (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE table_schema = DATABASE() AND table_name = 'ecosystem_snapshots' AND index_name = 'idx_snapshots_date');
SET @sql := IF(@exists = 0, 'ALTER TABLE `ecosystem_snapshots` ADD INDEX `idx_snapshots_date` (`snapshot_date`)', 'SELECT ''skip'' AS s');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
