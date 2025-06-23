// Centralized Mock Data for Bloom AI Dashboard
// Single source of truth for all mock data across the application

import bloomAiThumbnail from "@/assets/bloom-ai-thumbnail.png"
import type { StaticImageData } from "next/image"

// ===== SHARED CONSTANTS =====

// Core metrics that appear across multiple datasets
export const SHARED_METRICS = {
  totalMessages: 847,
  positiveActions: 597,
  activeUsers: 42,
  averageSentiment: 34.7,
  safetyScore: 94.2,
  positivityRate: 83.5
} as const

// Common time periods for consistent data
export const TIME_PERIODS = {
  HOURS_24: Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')),
  DAYS_7: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  WEEKS_4: ['Week 1', 'Week 2', 'Week 3', 'Week 4']
} as const

// ===== SHARED TYPE DEFINITIONS =====

export type TrendDirection = "up" | "down"

export interface TrendData {
  trend: TrendDirection
  change: number
}

// ===== BASE INTERFACES =====

export interface BaseActionData {
  positiveActions: number
  negativeActions: number
  totalActions: number
  activeUsers: number
}

export interface BaseSentimentData {
  averageSentiment: number
  messageCount: number
  positiveCount: number
  neutralCount: number
  negativeCount: number
}

export interface TimeData {
  hour?: string
  day?: string
  date?: string
  week?: string
  weekNumber?: number
}

export enum UserRole {
  PLAYER = "PLAYER",
  VIP = "VIP", 
  MODERATOR = "MODERATOR",
  ADMIN = "ADMIN"
}

export enum UserStatus {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE"
}

export interface RobloxExperience {
  id: number
  title: string
  description: string
  isActive: boolean
  safetyScore: number
  lastUpdated: string
  playerCount: number
  thumbnail: string | StaticImageData
}

// ===== MOCK METRICS =====

export interface MockMetrics {
  totalMessages: number
  activeUsers: number
  safetyScore: number
  avgResponseTime: number
}

export interface MockTrends {
  totalMessages: TrendData
  activeUsers: TrendData
  safetyScore: TrendData
  avgResponseTime: TrendData
}

// ===== MOCK DATA =====

export const mockMetrics: MockMetrics = {
  totalMessages: 847,
  activeUsers: 42,
  safetyScore: 94.2,
  avgResponseTime: 45
}

export const mockTrends: MockTrends = {
  totalMessages: { trend: "up", change: 12 },
  activeUsers: { trend: "up", change: 8 },
  safetyScore: { trend: "up", change: 2.1 },
  avgResponseTime: { trend: "down", change: 15 }
}

export const mockMessageVolumeData = [
  { hour: "00", approved: 12, flagged: 2, violations: 1 },
  { hour: "01", approved: 8, flagged: 1, violations: 0 },
  { hour: "02", approved: 5, flagged: 0, violations: 0 },
  { hour: "03", approved: 3, flagged: 0, violations: 0 },
  { hour: "04", approved: 4, flagged: 1, violations: 0 },
  { hour: "05", approved: 7, flagged: 1, violations: 0 },
  { hour: "06", approved: 15, flagged: 2, violations: 1 },
  { hour: "07", approved: 28, flagged: 3, violations: 1 },
  { hour: "08", approved: 45, flagged: 4, violations: 2 },
  { hour: "09", approved: 52, flagged: 5, violations: 2 },
  { hour: "10", approved: 48, flagged: 4, violations: 1 },
  { hour: "11", approved: 41, flagged: 3, violations: 1 },
  { hour: "12", approved: 38, flagged: 3, violations: 1 },
  { hour: "13", approved: 44, flagged: 4, violations: 2 },
  { hour: "14", approved: 51, flagged: 5, violations: 2 },
  { hour: "15", approved: 58, flagged: 6, violations: 3 },
  { hour: "16", approved: 62, flagged: 7, violations: 3 },
  { hour: "17", approved: 55, flagged: 6, violations: 2 },
  { hour: "18", approved: 49, flagged: 5, violations: 2 },
  { hour: "19", approved: 42, flagged: 4, violations: 1 },
  { hour: "20", approved: 35, flagged: 3, violations: 1 },
  { hour: "21", approved: 28, flagged: 2, violations: 1 },
  { hour: "22", approved: 22, flagged: 2, violations: 0 },
  { hour: "23", approved: 16, flagged: 1, violations: 0 }
]

export const mockExperiences: RobloxExperience[] = [
  {
    id: 1,
    title: "Bloom",
    description: "A safe community space for young gamers to learn, create, and make friends. Features educational mini-games and positive interactions that are rewarded.",
    isActive: true,
    safetyScore: 96.5,
    lastUpdated: "2024-01-15T10:30:00Z",
    playerCount: 12500,
    thumbnail: bloomAiThumbnail
  },
] 