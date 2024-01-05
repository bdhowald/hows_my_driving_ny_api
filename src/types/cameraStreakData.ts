import { DateTime } from 'luxon'

type CameraStreakData = {
  maxStreak: number
  streakEnd: DateTime | null
  streakStart: DateTime | null
}

export default CameraStreakData
