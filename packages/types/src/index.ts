/**
 * Shared TypeScript types for Jobswyft
 *
 * This package contains type definitions shared across:
 * - apps/web (Dashboard)
 * - apps/extension (Chrome Extension)
 */

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// Auth Types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'past_due' | 'cancelled';
  preferred_ai_provider: 'claude' | 'gpt';
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

export interface LoginResponse {
  oauth_url: string;
}

// Error Codes
export type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'INVALID_TOKEN'
  | 'CREDIT_EXHAUSTED'
  | 'RESUME_LIMIT_REACHED'
  | 'RESUME_NOT_FOUND'
  | 'JOB_NOT_FOUND'
  | 'SCAN_FAILED'
  | 'AI_GENERATION_FAILED'
  | 'AI_PROVIDER_UNAVAILABLE'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED';
