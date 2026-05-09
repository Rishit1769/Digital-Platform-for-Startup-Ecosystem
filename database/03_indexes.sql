-- ============================================================
-- 03_indexes.sql
-- Full-text search & performance indexes
-- ============================================================

USE `startup_ecosystem`;

-- Full-text search on user names
ALTER TABLE `users` ADD FULLTEXT INDEX `ft_users_name` (`name`);

-- Full-text search on user bio
ALTER TABLE `user_profiles` ADD FULLTEXT INDEX `ft_profiles_bio` (`bio`);

-- Performance index: startups by domain
ALTER TABLE `startups` ADD INDEX `idx_startups_domain` (`domain`);
-- Performance index: startups by stage
ALTER TABLE `startups` ADD INDEX `idx_startups_stage` (`stage`);
-- Performance index: startups by creator
ALTER TABLE `startups` ADD INDEX `idx_startups_created_by` (`created_by`);

-- Performance index: meetings by organizer
ALTER TABLE `meetings` ADD INDEX `idx_meetings_organizer` (`organizer_id`);
-- Performance index: meetings by attendee
ALTER TABLE `meetings` ADD INDEX `idx_meetings_attendee` (`attendee_id`);
-- Performance index: meetings by startup
ALTER TABLE `meetings` ADD INDEX `idx_meetings_startup` (`startup_id`);

-- Performance index: otp_codes by email + type
ALTER TABLE `otp_codes` ADD INDEX `idx_otp_email_type` (`email`, `type`);

-- Performance index: kanban tasks by user + status
ALTER TABLE `kanban_tasks` ADD INDEX `idx_kanban_user_status` (`user_id`, `status`);

-- Performance index: ideas by domain
ALTER TABLE `ideas` ADD INDEX `idx_ideas_domain` (`domain`);

-- Performance index: news by admin
ALTER TABLE `news` ADD INDEX `idx_news_admin` (`admin_id`);

-- Performance index: office_hours by mentor
ALTER TABLE `office_hours` ADD INDEX `idx_office_hours_mentor` (`mentor_id`);

-- Performance index: snapshots by date
ALTER TABLE `ecosystem_snapshots` ADD INDEX `idx_snapshots_date` (`snapshot_date`);
