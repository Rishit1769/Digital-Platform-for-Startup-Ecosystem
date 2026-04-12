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
