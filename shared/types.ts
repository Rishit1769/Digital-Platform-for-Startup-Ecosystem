export type Role = 'student' | 'mentor' | 'admin';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  is_verified: boolean;
  is_email_verified: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PitchDeckCriterion {
  score: number;
  summary: string;
  strengths: string[];
  risks: string[];
}

export interface PitchDeckAnalysis {
  clarity: PitchDeckCriterion;
  market_size: PitchDeckCriterion;
  value_proposition: PitchDeckCriterion;
  overall_summary: string;
}

export interface PitchOutlineSlide {
  slide_number: number;
  title: string;
  objective: string;
  bullets: string[];
}

export interface MilestoneSuggestion {
  title: string;
  description: string;
  stage: 'idea' | 'prototype' | 'mvp' | 'beta' | 'launch' | 'funded';
}

export interface StartupHealth {
  pulse_score: number;
  commits_last_7_days: number;
  meetings_last_7_days: number;
  success_score?: number;
}

export interface BarterListing {
  id: number;
  startup_id: number;
  offer_text: string;
  need_text: string;
  details?: string | null;
  status: 'open' | 'closed';
  created_by: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface BarterMatch {
  my_listing_id: number;
  matching_listing_id: number;
  startup_id: number;
  startup_name: string;
  startup_logo_url?: string | null;
  offer_text: string;
  need_text: string;
  matched_terms: string[];
  match_score: number;
}

export interface MentorAccessRequestNotification {
  request_id: number;
  startup_id: number;
  startup_name: string;
  student_id: number;
  message?: string | null;
}

export interface MemberInviteNotification {
  startup_id: number;
  startup_name: string;
  role: string;
  message: string;
}
