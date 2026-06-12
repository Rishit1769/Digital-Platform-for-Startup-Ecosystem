-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `oauth_provider` ENUM('google') NULL,
    `oauth_sub` VARCHAR(255) NULL,
    `google_calendar_email` VARCHAR(255) NULL,
    `google_calendar_refresh_token` TEXT NULL,
    `google_calendar_connected_at` DATETIME(3) NULL,
    `role` ENUM('student', 'mentor', 'admin') NOT NULL DEFAULT 'student',
    `name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `startup_intent` ENUM('has_startup', 'finding_startup') NULL,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `is_email_verified` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_oauth_sub_key`(`oauth_sub`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_profiles` (
    `user_id` INTEGER NOT NULL,
    `bio` TEXT NULL,
    `avatar_url` VARCHAR(1024) NULL,
    `skills` JSON NULL,
    `interests` JSON NULL,
    `preferred_domains` JSON NULL,
    `github_url` VARCHAR(255) NULL,
    `linkedin_url` VARCHAR(255) NULL,
    `college` VARCHAR(255) NULL,
    `year_of_study` VARCHAR(50) NULL,
    `cgpa` DECIMAL(3, 2) NULL,
    `company` VARCHAR(255) NULL,
    `expertise` VARCHAR(255) NULL,
    `designation` VARCHAR(255) NULL,
    `years_of_experience` INTEGER NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_gamification` (
    `user_id` INTEGER NOT NULL,
    `xp_points` INTEGER NOT NULL DEFAULT 0,
    `level` INTEGER NOT NULL DEFAULT 1,
    `badges_earned` JSON NULL,
    `last_activity` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `xp_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `event_type` VARCHAR(50) NOT NULL,
    `xp_awarded` INTEGER NOT NULL,
    `description` VARCHAR(255) NULL,
    `reference_id` INTEGER NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `xp_events_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `otp_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `type` ENUM('register', 'forgot_password') NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `is_used` BOOLEAN NOT NULL DEFAULT false,
    `payload` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trends_cache` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cache_key` VARCHAR(255) NOT NULL,
    `data` JSON NOT NULL,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `trends_cache_cache_key_key`(`cache_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `startups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `tagline` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `domain` VARCHAR(100) NULL,
    `stage` ENUM('idea', 'mvp', 'growth', 'funded') NOT NULL DEFAULT 'idea',
    `funding_raised` DECIMAL(15, 2) NULL,
    `logo_url` VARCHAR(1024) NULL,
    `logo_object_name` VARCHAR(1024) NULL,
    `logo_version` BIGINT NULL,
    `pitch_pdf_object_name` VARCHAR(1024) NULL,
    `github_url` VARCHAR(255) NULL,
    `github_repo_url` VARCHAR(255) NULL,
    `github_repo_owner` VARCHAR(100) NULL,
    `github_repo_name` VARCHAR(100) NULL,
    `startup_email` VARCHAR(255) NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `startup_members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `startup_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `role` VARCHAR(100) NULL,
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `startup_members_startup_id_user_id_key`(`startup_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `startup_mentor_access_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `startup_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,
    `mentor_id` INTEGER NOT NULL,
    `message` TEXT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `reviewed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `startup_milestones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `startup_id` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `stage` ENUM('idea', 'prototype', 'mvp', 'beta', 'launch', 'funded') NOT NULL,
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `startup_upvotes` (
    `startup_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`startup_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `open_roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `startup_id` INTEGER NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `skills_required` JSON NULL,
    `posted_by` INTEGER NOT NULL,
    `is_filled` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_applications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `open_role_id` INTEGER NOT NULL,
    `applicant_id` INTEGER NOT NULL,
    `message` TEXT NULL,
    `status` ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
    `applied_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pitch_decks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `startup_id` INTEGER NOT NULL,
    `content` JSON NOT NULL,
    `generated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `version` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barter_listings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `startup_id` INTEGER NOT NULL,
    `offer_text` TEXT NOT NULL,
    `need_text` TEXT NOT NULL,
    `details` TEXT NULL,
    `status` ENUM('open', 'closed') NOT NULL DEFAULT 'open',
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barter_applications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `listing_id` INTEGER NOT NULL,
    `applicant_id` INTEGER NOT NULL,
    `message` TEXT NULL,
    `status` ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `barter_applications_listing_id_applicant_id_key`(`listing_id`, `applicant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ideas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `domain` VARCHAR(100) NULL,
    `posted_by` INTEGER NOT NULL,
    `upvotes` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `idea_feedback` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `idea_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `comment` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `peer_reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `startup_id` INTEGER NOT NULL,
    `reviewer_id` INTEGER NOT NULL,
    `reviewee_id` INTEGER NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meetings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `organizer_id` INTEGER NOT NULL,
    `attendee_id` INTEGER NOT NULL,
    `startup_id` INTEGER NULL,
    `status` ENUM('pending', 'confirmed', 'rejected', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
    `proposed_slots` JSON NOT NULL,
    `confirmed_slot` DATETIME(3) NULL,
    `confirmed_end` DATETIME(3) NULL,
    `meeting_link` VARCHAR(255) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `office_hours` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mentor_id` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `day_of_week` ENUM('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun') NOT NULL,
    `start_time` VARCHAR(8) NOT NULL,
    `end_time` VARCHAR(8) NOT NULL,
    `max_bookings` INTEGER NOT NULL DEFAULT 1,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `office_hour_bookings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `office_hour_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,
    `booked_date` DATE NOT NULL,
    `status` ENUM('pending', 'confirmed', 'cancelled') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `office_hour_bookings_office_hour_id_booked_date_student_id_key`(`office_hour_id`, `booked_date`, `student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification_badges` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `badge_type` VARCHAR(100) NOT NULL,
    `granted_by` INTEGER NULL,
    `granted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `featured_works` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `startup_id` INTEGER NOT NULL,
    `headline` VARCHAR(255) NULL,
    `summary` TEXT NULL,
    `hero_image_url` VARCHAR(1024) NULL,
    `cta_label` VARCHAR(100) NULL,
    `cta_url` VARCHAR(1024) NULL,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kanban_tasks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('todo', 'in_progress', 'review', 'done', 'blocked') NOT NULL DEFAULT 'todo',
    `priority` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
    `due_date` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ecosystem_snapshots` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `snapshot_date` DATE NOT NULL,
    `total_users` INTEGER NOT NULL DEFAULT 0,
    `total_startups` INTEGER NOT NULL DEFAULT 0,
    `total_meetings` INTEGER NOT NULL DEFAULT 0,
    `total_ideas` INTEGER NOT NULL DEFAULT 0,
    `total_connections` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ecosystem_snapshots_snapshot_date_key`(`snapshot_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `news` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `category` VARCHAR(100) NOT NULL DEFAULT 'general',
    `image_url` VARCHAR(1024) NULL,
    `admin_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `github_cache` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `startup_id` INTEGER NOT NULL,
    `commit_count_week` INTEGER NOT NULL DEFAULT 0,
    `commit_count_month` INTEGER NOT NULL DEFAULT 0,
    `last_push_at` DATETIME(3) NULL,
    `open_issues` INTEGER NOT NULL DEFAULT 0,
    `stars` INTEGER NOT NULL DEFAULT 0,
    `forks` INTEGER NOT NULL DEFAULT 0,
    `contributors` JSON NULL,
    `languages` JSON NULL,
    `cached_at` DATETIME(3) NULL,

    UNIQUE INDEX `github_cache_startup_id_key`(`startup_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `public_mentor_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `mentor_name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `session_date` DATE NULL,
    `session_time` VARCHAR(50) NULL,
    `meet_link` VARCHAR(500) NOT NULL,
    `max_participants` INTEGER NOT NULL DEFAULT 100,
    `joined_count` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_gamification` ADD CONSTRAINT `user_gamification_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `xp_events` ADD CONSTRAINT `xp_events_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `startups` ADD CONSTRAINT `startups_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `startup_members` ADD CONSTRAINT `startup_members_startup_id_fkey` FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `startup_members` ADD CONSTRAINT `startup_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `startup_mentor_access_requests` ADD CONSTRAINT `startup_mentor_access_requests_startup_id_fkey` FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `startup_mentor_access_requests` ADD CONSTRAINT `startup_mentor_access_requests_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `startup_mentor_access_requests` ADD CONSTRAINT `startup_mentor_access_requests_mentor_id_fkey` FOREIGN KEY (`mentor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `startup_milestones` ADD CONSTRAINT `startup_milestones_startup_id_fkey` FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `startup_upvotes` ADD CONSTRAINT `startup_upvotes_startup_id_fkey` FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `startup_upvotes` ADD CONSTRAINT `startup_upvotes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `open_roles` ADD CONSTRAINT `open_roles_startup_id_fkey` FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `open_roles` ADD CONSTRAINT `open_roles_posted_by_fkey` FOREIGN KEY (`posted_by`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_applications` ADD CONSTRAINT `role_applications_open_role_id_fkey` FOREIGN KEY (`open_role_id`) REFERENCES `open_roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_applications` ADD CONSTRAINT `role_applications_applicant_id_fkey` FOREIGN KEY (`applicant_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pitch_decks` ADD CONSTRAINT `pitch_decks_startup_id_fkey` FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barter_listings` ADD CONSTRAINT `barter_listings_startup_id_fkey` FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barter_listings` ADD CONSTRAINT `barter_listings_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barter_applications` ADD CONSTRAINT `barter_applications_listing_id_fkey` FOREIGN KEY (`listing_id`) REFERENCES `barter_listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barter_applications` ADD CONSTRAINT `barter_applications_applicant_id_fkey` FOREIGN KEY (`applicant_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ideas` ADD CONSTRAINT `ideas_posted_by_fkey` FOREIGN KEY (`posted_by`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `idea_feedback` ADD CONSTRAINT `idea_feedback_idea_id_fkey` FOREIGN KEY (`idea_id`) REFERENCES `ideas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `idea_feedback` ADD CONSTRAINT `idea_feedback_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peer_reviews` ADD CONSTRAINT `peer_reviews_startup_id_fkey` FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peer_reviews` ADD CONSTRAINT `peer_reviews_reviewer_id_fkey` FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peer_reviews` ADD CONSTRAINT `peer_reviews_reviewee_id_fkey` FOREIGN KEY (`reviewee_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_organizer_id_fkey` FOREIGN KEY (`organizer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_attendee_id_fkey` FOREIGN KEY (`attendee_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_startup_id_fkey` FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `office_hours` ADD CONSTRAINT `office_hours_mentor_id_fkey` FOREIGN KEY (`mentor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `office_hour_bookings` ADD CONSTRAINT `office_hour_bookings_office_hour_id_fkey` FOREIGN KEY (`office_hour_id`) REFERENCES `office_hours`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `office_hour_bookings` ADD CONSTRAINT `office_hour_bookings_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `verification_badges` ADD CONSTRAINT `verification_badges_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `verification_badges` ADD CONSTRAINT `verification_badges_granted_by_fkey` FOREIGN KEY (`granted_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `featured_works` ADD CONSTRAINT `featured_works_startup_id_fkey` FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `featured_works` ADD CONSTRAINT `featured_works_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kanban_tasks` ADD CONSTRAINT `kanban_tasks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `news` ADD CONSTRAINT `news_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `github_cache` ADD CONSTRAINT `github_cache_startup_id_fkey` FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `public_mentor_sessions` ADD CONSTRAINT `public_mentor_sessions_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
