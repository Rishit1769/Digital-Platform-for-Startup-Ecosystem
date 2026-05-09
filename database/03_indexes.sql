-- ============================================================
-- 03_indexes.sql
-- Full-text search & performance indexes
-- Safe to re-run (uses IF NOT EXISTS where supported)
-- ============================================================

USE `startup_ecosystem`;

-- Full-text search on user names
ALTER TABLE `users` ADD FULLTEXT INDEX IF NOT EXISTS `ft_users_name` (`name`);

-- Full-text search on user bio
ALTER TABLE `user_profiles` ADD FULLTEXT INDEX IF NOT EXISTS `ft_profiles_bio` (`bio`);

-- Performance index: startups by domain
CREATE INDEX IF NOT EXISTS `idx_startups_domain`     ON `startups` (`domain`);
-- Performance index: startups by stage
CREATE INDEX IF NOT EXISTS `idx_startups_stage`      ON `startups` (`stage`);
-- Performance index: startups by creator
CREATE INDEX IF NOT EXISTS `idx_startups_created_by` ON `startups` (`created_by`);

-- Performance index: meetings by organizer
CREATE INDEX IF NOT EXISTS `idx_meetings_organizer`  ON `meetings` (`organizer_id`);
-- Performance index: meetings by attendee
CREATE INDEX IF NOT EXISTS `idx_meetings_attendee`   ON `meetings` (`attendee_id`);
-- Performance index: meetings by startup
CREATE INDEX IF NOT EXISTS `idx_meetings_startup`    ON `meetings` (`startup_id`);

-- Performance index: otp_codes by email + type
CREATE INDEX IF NOT EXISTS `idx_otp_email_type`      ON `otp_codes` (`email`, `type`);

-- Performance index: kanban tasks by user + status
CREATE INDEX IF NOT EXISTS `idx_kanban_user_status`  ON `kanban_tasks` (`user_id`, `status`);

-- Performance index: ideas by domain
CREATE INDEX IF NOT EXISTS `idx_ideas_domain`        ON `ideas` (`domain`);

-- Performance index: news by admin
CREATE INDEX IF NOT EXISTS `idx_news_admin`          ON `news` (`admin_id`);

-- Performance index: office_hours by mentor
CREATE INDEX IF NOT EXISTS `idx_office_hours_mentor` ON `office_hours` (`mentor_id`);

-- Performance index: snapshots by date
CREATE INDEX IF NOT EXISTS `idx_snapshots_date`      ON `ecosystem_snapshots` (`snapshot_date`);
