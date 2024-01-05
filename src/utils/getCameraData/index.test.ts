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
        streakEnd: DateTime.fromISO('2023-03-01T00:00:00.000-05:00'),
        streakStart: DateTime.fromISO('2023-01-01T00:00:00.000-05:00'),
        total: 9,
      },
      cameraViolations: {
        maxStreak: 4,
        streakEnd: DateTime.fromISO('2023-03-15T00:00:00.000-04:00'),
        streakStart: DateTime.fromISO('2022-04-01T00:00:00.000-04:00'),
        total: 6,
      },
      cameraViolationsWithBusLaneCameraViolations: {
        maxStreak: 9,
        streakEnd: DateTime.fromISO('2023-03-15T00:00:00.000-04:00'),
        streakStart: DateTime.fromISO('2022-04-01T00:00:00.000-04:00'),
        total: 15,
      },
      redLightCameraViolations: {
        maxStreak: 3,
        streakEnd: DateTime.fromISO('2023-03-15T00:00:00.000-04:00'),
        streakStart: DateTime.fromISO('2022-04-01T00:00:00.000-04:00'),
        total: 3,
      },
      speedCameraViolations: {
        maxStreak: 1,
        streakEnd: DateTime.fromISO('2021-01-01T00:00:00.000-05:00'),
        streakStart: DateTime.fromISO('2021-01-01T00:00:00.000-05:00'),
        total: 3,
      },
    }

    expect(cameraData).toEqual(expected)
  })
})
