import { DateTime } from 'luxon'

type CameraStreakData = {
  maxStreak: number
  streakEnd: string | null
  streakEndEastern: string | null
  streakEndUtc: string | null
  streakStart: string | null
  streakStartEastern: string | null
  streakStartUtc: string | null
}

export default CameraStreakData
