import { DateTime } from 'luxon'

import { HumanizedDescription } from 'constants/violationDescriptions'
import { violationFactory } from '__fixtures__/violations'
import CameraData from 'types/cameraData'
import { Violation } from 'types/violations'

import getCameraData from '.'

describe('getCameraData', () => {
  const now = new Date()

  const yearFromNow = new Date()
  yearFromNow.setFullYear(now.getFullYear() + 1)

  it('should parse violations to return camera violation data', () => {
    /** Bus lane violations cover those with the humanizedDescription
     * 'Bus Lane Violation' and 'Mobile Bus Violation'.
     *
     * There are nine total bus lane violations, but the max over a year
     * is five: 2023-01-01 through 2023-03-01
     */
    const busLaneCameraViolations: Violation[] = [
      violationFactory.build({
        formattedTimeEastern: '2022-01-15T00:00:00.000-05:00',
        humanizedDescription: 'Bus Lane Violation' as HumanizedDescription,
      }),
      violationFactory.build({
        formattedTimeEastern: '2023-01-01T00:00:00.000-05:00',
        humanizedDescription: 'Bus Lane Violation' as HumanizedDescription,
      }),
      violationFactory.build({
        formattedTimeEastern: '2023-02-01T00:00:00.000-05:00',
        humanizedDescription: 'Bus Lane Violation' as HumanizedDescription,
      }),
      violationFactory.build({
        formattedTimeEastern: '2023-03-01T00:00:00.000-05:00',
        humanizedDescription: 'Bus Lane Violation' as HumanizedDescription,
      }),
    ]

    const mobileBusLaneCameraViolations: Violation[] = [
      violationFactory.build({
        formattedTimeEastern: '2022-01-01T00:00:00.000-05:00',
        humanizedDescription:
          'Mobile Bus Lane Violation' as HumanizedDescription,
      }),
      violationFactory.build({
        formattedTimeEastern: '2022-01-05T00:00:00.000-05:00',
        humanizedDescription:
          'Mobile Bus Lane Violation' as HumanizedDescription,
      }),
      violationFactory.build({
        formattedTimeEastern: '2022-01-10T00:00:00.000-05:00',
        humanizedDescription:
          'Mobile Bus Lane Violation' as HumanizedDescription,
      }),
      violationFactory.build({
        formattedTimeEastern: '2023-01-07T00:00:00.000-05:00',
        humanizedDescription:
          'Mobile Bus Lane Violation' as HumanizedDescription,
      }),
      violationFactory.build({
        formattedTimeEastern: '2023-02-07T00:00:00.000-05:00',
        humanizedDescription:
          'Mobile Bus Lane Violation' as HumanizedDescription,
      }),
    ]

    // Three violations, all within 365-day rolling
    // window: 2022-01-01, 2022-01-05, 2023-01-10
    const redLightCameraViolations: Violation[] = [
      violationFactory.build({
        formattedTimeEastern: '2022-04-01T00:00:00.000-04:00',
        humanizedDescription:
          'Failure to Stop at Red Light' as HumanizedDescription,
      }),
      violationFactory.build({
        formattedTimeEastern: '2022-04-15T00:00:00.000-04:00',
        humanizedDescription:
          'Failure to Stop at Red Light' as HumanizedDescription,
      }),
      violationFactory.build({
        formattedTimeEastern: '2023-03-15T00:00:00.000-04:00',
        humanizedDescription:
          'Failure to Stop at Red Light' as HumanizedDescription,
      }),
    ]

    // Three violations, but none within a year of each other.
    const speedCameraViolations: Violation[] = [
      violationFactory.build({
        formattedTimeEastern: '2021-01-01T00:00:00.000-05:00',
        humanizedDescription:
          'School Zone Speed Camera Violation' as HumanizedDescription,
      }),
      violationFactory.build({
        formattedTimeEastern: '2022-04-15T00:00:00.000-04:00',
        humanizedDescription:
          'School Zone Speed Camera Violation' as HumanizedDescription,
      }),
      violationFactory.build({
        formattedTimeEastern: '2023-06-15T00:00:00.000-04:00',
        humanizedDescription:
          'School Zone Speed Camera Violation' as HumanizedDescription,
      }),
    ]

    const otherViolations: Violation[] = violationFactory.buildList(20, {
      humanizedDescription: 'Blocking Pedestrian Ramp' as HumanizedDescription,
    })

    const violations: Violation[] = [
      ...busLaneCameraViolations,
      ...mobileBusLaneCameraViolations,
      ...redLightCameraViolations,
      ...speedCameraViolations,
      ...otherViolations,
    ]

    const cameraData = getCameraData(violations)

    const expected: CameraData = {
      busLaneCameraViolations: {
        maxStreak: 5,
        streakEnd: '2023-03-01T00:00:00.000-05:00',
        streakEndEastern: '2023-03-01T00:00:00.000-05:00',
        streakEndUtc: '2023-03-01T05:00:00.000Z',
        streakStart: '2023-01-01T00:00:00.000-05:00',
        streakStartEastern: '2023-01-01T00:00:00.000-05:00',
        streakStartUtc: '2023-01-01T05:00:00.000Z',
        total: 9,
      },
      cameraViolations: {
        maxStreak: 4,
        streakEnd: '2023-03-15T00:00:00.000-04:00',
        streakEndEastern: '2023-03-15T00:00:00.000-04:00',
        streakEndUtc: '2023-03-15T04:00:00.000Z',
        streakStart: '2022-04-01T00:00:00.000-04:00',
        streakStartEastern: '2022-04-01T00:00:00.000-04:00',
        streakStartUtc: '2022-04-01T04:00:00.000Z',
        total: 6,
      },
      cameraViolationsWithBusLaneCameraViolations: {
        maxStreak: 9,
        streakEnd: '2023-03-15T00:00:00.000-04:00',
        streakEndEastern: '2023-03-15T00:00:00.000-04:00',
        streakEndUtc: '2023-03-15T04:00:00.000Z',
        streakStart: '2022-04-01T00:00:00.000-04:00',
        streakStartEastern: '2022-04-01T00:00:00.000-04:00',
        streakStartUtc: '2022-04-01T04:00:00.000Z',
        total: 15,
      },
      redLightCameraViolations: {
        maxStreak: 3,
        streakEnd: '2023-03-15T00:00:00.000-04:00',
        streakEndEastern: '2023-03-15T00:00:00.000-04:00',
        streakEndUtc: '2023-03-15T04:00:00.000Z',
        streakStart: '2022-04-01T00:00:00.000-04:00',
        streakStartEastern: '2022-04-01T00:00:00.000-04:00',
        streakStartUtc: '2022-04-01T04:00:00.000Z',
        total: 3,
      },
      schoolZoneSpeedCameraViolations: {
        maxStreak: 1,
        streakEnd: '2021-01-01T00:00:00.000-05:00',
        streakEndEastern: '2021-01-01T00:00:00.000-05:00',
        streakEndUtc: '2021-01-01T05:00:00.000Z',
        streakStart: '2021-01-01T00:00:00.000-05:00',
        streakStartEastern: '2021-01-01T00:00:00.000-05:00',
        streakStartUtc: '2021-01-01T05:00:00.000Z',
        total: 3,
      },
    }

    expect(cameraData).toEqual(expected)
  })

  it('should calculate camera streaks over the past year', () => {
    // All violations are one year apart, so max is one.
    const violations: Violation[] = [
      violationFactory.build({
        formattedTimeEastern: '2021-01-15T00:00:00.000-05:00',
        humanizedDescription: 'Bus Lane Violation' as HumanizedDescription,
      }),
      violationFactory.build({
        formattedTimeEastern: '2022-01-15T00:00:00.000-05:00',
        humanizedDescription: 'Bus Lane Violation' as HumanizedDescription,
      }),
      violationFactory.build({
        formattedTimeEastern: '2023-01-15T00:00:00.000-05:00',
        humanizedDescription: 'Bus Lane Violation' as HumanizedDescription,
      }),
      violationFactory.build({
        formattedTimeEastern: '2024-01-15T00:00:00.000-05:00',
        humanizedDescription: 'Bus Lane Violation' as HumanizedDescription,
      }),
      violationFactory.build({
        formattedTimeEastern: '2025-01-15T00:00:00.000-05:00',
        humanizedDescription: 'Bus Lane Violation' as HumanizedDescription,
      }),
    ]

    const cameraData = getCameraData(violations)

    const expected: CameraData = {
      busLaneCameraViolations: {
        maxStreak: 1,
        streakEnd: '2021-01-15T00:00:00.000-05:00',
        streakEndEastern: '2021-01-15T00:00:00.000-05:00',
        streakEndUtc: '2021-01-15T05:00:00.000Z',
        streakStart: '2021-01-15T00:00:00.000-05:00',
        streakStartEastern: '2021-01-15T00:00:00.000-05:00',
        streakStartUtc: '2021-01-15T05:00:00.000Z',
        total: 5,
      },
      cameraViolations: {
        maxStreak: 0,
        streakEnd: null,
        streakEndEastern: null,
        streakEndUtc: null,
        streakStart: null,
        streakStartEastern: null,
        streakStartUtc: null,
        total: 0,
      },
      cameraViolationsWithBusLaneCameraViolations: {
        maxStreak: 1,
        streakEnd: '2021-01-15T00:00:00.000-05:00',
        streakEndEastern: '2021-01-15T00:00:00.000-05:00',
        streakEndUtc: '2021-01-15T05:00:00.000Z',
        streakStart: '2021-01-15T00:00:00.000-05:00',
        streakStartEastern: '2021-01-15T00:00:00.000-05:00',
        streakStartUtc: '2021-01-15T05:00:00.000Z',
        total: 5,
      },
      redLightCameraViolations: {
        maxStreak: 0,
        streakEnd: null,
        streakEndEastern: null,
        streakEndUtc: null,
        streakStart: null,
        streakStartEastern: null,
        streakStartUtc: null,
        total: 0,
      },
      schoolZoneSpeedCameraViolations: {
        maxStreak: 0,
        streakEnd: null,
        streakEndEastern: null,
        streakEndUtc: null,
        streakStart: null,
        streakStartEastern: null,
        streakStartUtc: null,
        total: 0,
      },
    }

    expect(cameraData).toEqual(expected)
  })
})
