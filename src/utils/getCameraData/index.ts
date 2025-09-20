import { DateTime } from 'luxon'

import { NEW_YORK_TIME_ZONE, UTC_TIME_ZONE } from 'constants/locale'
import CameraData from 'types/cameraData'
import CameraStreakData from 'types/cameraStreakData'
import { Violation } from 'types/violations'
import { isPresent } from 'utils/typePredicates'

const BUS_LANE_VIOLATION = 'Bus Lane Violation'
const FAILURE_TO_STOP_AT_RED_LIGHT = 'Failure to Stop at Red Light'
const MOBILE_BUS_LANE_VIOLATION = 'Mobile Bus Lane Violation'
const SCHOOL_ZONE_SPEED_CAMERA_VIOLATION = 'School Zone Speed Camera Violation'

const findMaxCameraViolationsStreak = (
  violationTimes: Array<string | null | undefined>
): CameraStreakData => {
  let maxStreak = 0
  let streakEndDateTime: DateTime | null = null
  let streakStartDateTime: DateTime | null = null

  const dateTimes = violationTimes
    .filter(isPresent)
    .map((violationTime) => DateTime.fromISO(violationTime, { zone: NEW_YORK_TIME_ZONE }))

  dateTimes.forEach((dateTime) => {
    const yearMinusOneDayLater = dateTime.set({ year: dateTime.year + 1, day: -1 })

    const yearLongTickets = dateTimes.filter(
      (otherDate) => otherDate >= dateTime && otherDate < yearMinusOneDayLater
    )

    const sortedYearLongTickets: DateTime[] = yearLongTickets.sort((a, b) => {
      if (a > b) {
        return 1
      }
      if (b > a) {
        return -1
      }
      return 0
    })

    const thisStreak = yearLongTickets.length

    if (thisStreak > maxStreak) {
      maxStreak = thisStreak
      streakEndDateTime = sortedYearLongTickets[yearLongTickets.length - 1]
      streakStartDateTime = sortedYearLongTickets[0]
    }
  })

  // Typescript gets confused
  const streakEndInEastern = streakEndDateTime ? (streakEndDateTime as DateTime).toISO() : null
  const streakEndInUtc = streakEndDateTime ? (streakEndDateTime as DateTime).setZone(UTC_TIME_ZONE).toISO() : null
  const streakStartInEastern = streakStartDateTime ? (streakStartDateTime as DateTime).toISO() : null
  const streakStartInUtc = streakStartDateTime ? (streakStartDateTime as DateTime).setZone(UTC_TIME_ZONE).toISO() : null

  return {
    maxStreak,
    streakEnd: streakEndInEastern,
    streakEndEastern: streakEndInEastern,
    streakEndUtc: streakEndInUtc,
    streakStart: streakStartInEastern,
    streakStartEastern: streakStartInEastern,
    streakStartUtc: streakStartInUtc,
  }
}

const getCameraData = (violations: Violation[]): CameraData => {
  const busLaneCameraViolations = violations.filter(
    (violation) =>
      violation.humanizedDescription === BUS_LANE_VIOLATION ||
      violation.humanizedDescription === MOBILE_BUS_LANE_VIOLATION
  )
  const cameraViolations = violations.filter(
    (violation) =>
      violation.humanizedDescription === SCHOOL_ZONE_SPEED_CAMERA_VIOLATION ||
      violation.humanizedDescription === FAILURE_TO_STOP_AT_RED_LIGHT
  )
  const cameraViolationsWithBusCameraViolations = violations.filter(
    (violation) => {
      return [
        BUS_LANE_VIOLATION,
        FAILURE_TO_STOP_AT_RED_LIGHT,
        MOBILE_BUS_LANE_VIOLATION,
        SCHOOL_ZONE_SPEED_CAMERA_VIOLATION,
      ].includes(violation.humanizedDescription)
    }
  )
  const redLightCameraViolations = violations.filter(
    (violation) =>
      violation.humanizedDescription === FAILURE_TO_STOP_AT_RED_LIGHT
  )
  const speedCameraViolations = violations.filter(
    (violation) =>
      violation.humanizedDescription === SCHOOL_ZONE_SPEED_CAMERA_VIOLATION
  )

  const busLaneCameraStreakData = {
    ...findMaxCameraViolationsStreak(
      busLaneCameraViolations.map((violation) => violation.formattedTimeEastern)
    ),
    total: busLaneCameraViolations.length,
  }
  const mixedCameraStreakData = {
    ...findMaxCameraViolationsStreak(
      cameraViolations.map((violation) => violation.formattedTimeEastern)
    ),
    total: cameraViolations.length,
  }
  const mixedCameraWithBusLaneCameraStreakData = {
    ...findMaxCameraViolationsStreak(
      cameraViolationsWithBusCameraViolations.map(
        (violation) => violation.formattedTimeEastern
      )
    ),
    total: cameraViolationsWithBusCameraViolations.length,
  }
  const redLightCameraStreakData = {
    ...findMaxCameraViolationsStreak(
      redLightCameraViolations.map(
        (violation) => violation.formattedTimeEastern
      )
    ),
    total: redLightCameraViolations.length,
  }
  const speedCameraStreakData = {
    ...findMaxCameraViolationsStreak(
      speedCameraViolations.map((violation) => violation.formattedTimeEastern)
    ),
    total: speedCameraViolations.length,
  }

  return {
    busLaneCameraViolations: busLaneCameraStreakData,
    cameraViolations: mixedCameraStreakData,
    cameraViolationsWithBusLaneCameraViolations:
      mixedCameraWithBusLaneCameraStreakData,
    redLightCameraViolations: redLightCameraStreakData,
    schoolZoneSpeedCameraViolations: speedCameraStreakData,
  }
}

export default getCameraData
