// lib/store/sessions.ts
import { ResearchSession } from '@/lib/types';

// In-memory store (replace with database in production)
export const sessions: Record<string, ResearchSession> = {};