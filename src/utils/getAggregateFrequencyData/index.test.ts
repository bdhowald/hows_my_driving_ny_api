import { violationFactory } from '__fixtures__/violations'
import { Borough } from 'constants/boroughs'
import { HumanizedDescription } from 'constants/violationDescriptions'
import FrequencyData from 'types/frequencyData'
import { Violation } from 'types/violations'

import getAggregateFrequencyData from '.'

describe('getAggregateFineDataForVehicle', () => {
  describe('aggregate borough, year, and violation type data...', () => {
    it('...with blank maps if no violations', () => {
      const frequencyData = getAggregateFrequencyData([])

      const expected: FrequencyData = {
        boroughs: {},
        violationTypes: {},
        years: {},
      }

      expect(frequencyData).toEqual(expected)
    })
  })

  it('...with populated maps according to the violations', () => {
    const violations: Violation[] = [
      violationFactory.build({
        formattedTimeEastern: '2019-01-01T00:00:00.000-05:00',
        humanizedDescription: HumanizedDescription.BusLaneViolation,
        violationCounty: Borough.Brooklyn,
      }),
      violationFactory.build({
        formattedTimeEastern: '2023-01-01T00:00:00.000-05:00',
        humanizedDescription: HumanizedDescription.NoStandingBusStop,
        violationCounty: Borough.Manhattan,
      }),
      violationFactory.build({
        formattedTimeEastern: '2022-01-01T00:00:00.000-05:00',
        humanizedDescription: HumanizedDescription.BlockingBikeLane,
        violationCounty: Borough.Brooklyn,
      }),
      violationFactory.build({
        formattedTimeEastern: '2023-01-01T00:00:00.000-05:00',
        humanizedDescription: HumanizedDescription.DoubleParking,
        violationCounty: Borough.Manhattan,
      }),
      violationFactory.build({
        formattedTimeEastern: '2020-01-01T00:00:00.000-05:00',
        humanizedDescription: HumanizedDescription.DoubleParking,
        violationCounty: Borough.StatenIsland,
      }),
      violationFactory.build({
        formattedTimeEastern: '2022-01-01T00:00:00.000-05:00',
        humanizedDescription: HumanizedDescription.DoubleParking,
        violationCounty: Borough.Brooklyn,
      }),
      violationFactory.build({
        formattedTimeEastern: '2016-01-01T00:00:00.000-05:00',
        humanizedDescription: HumanizedDescription.BlockingCrosswalk,
        violationCounty: Borough.Brooklyn,
      }),
      violationFactory.build({
        formattedTimeEastern: '2022-01-01T00:00:00.000-05:00',
        humanizedDescription: HumanizedDescription.MisuseOfParkingPermit,
        violationCounty: Borough.StatenIsland,
      }),
      violationFactory.build({
        formattedTimeEastern: '2021-01-01T00:00:00.000-05:00',
        humanizedDescription:
          HumanizedDescription.SchoolZoneSpeedCameraViolation,
        violationCounty: Borough.Brooklyn,
      }),
      violationFactory.build({
        formattedTimeEastern: '2018-01-01T00:00:00.000-05:00',
        humanizedDescription:
          HumanizedDescription.RegistrationStickerExpiredOrMissing,
        violationCounty: Borough.Queens,
      }),
      violationFactory.build({
        formattedTimeEastern: '2018-01-01T00:00:00.000-05:00',
        humanizedDescription: HumanizedDescription.CoveredPlate,
        violationCounty: Borough.Manhattan,
      }),
      violationFactory.build({
        formattedTimeEastern: '2018-01-01T00:00:00.000-05:00',
        humanizedDescription:
          HumanizedDescription.SchoolZoneSpeedCameraViolation,
        violationCounty: Borough.Queens,
      }),
      violationFactory.build({
        formattedTimeEastern: '2019-01-01T00:00:00.000-05:00',
        humanizedDescription: HumanizedDescription.NoParkingStreetCleaning,
        violationCounty: Borough.Brooklyn,
      }),
      violationFactory.build({
        formattedTimeEastern: '2021-01-01T00:00:00.000-05:00',
        humanizedDescription: HumanizedDescription.BusLaneViolation,
        violationCounty: Borough.Manhattan,
      }),
      violationFactory.build({
        formattedTimeEastern: '2021-01-01T00:00:00.000-05:00',
        humanizedDescription:
          HumanizedDescription.SchoolZoneSpeedCameraViolation,
        violationCounty: Borough.Brooklyn,
      }),
      violationFactory.build({
        formattedTimeEastern: '2022-01-01T00:00:00.000-05:00',
        humanizedDescription: HumanizedDescription.BusLaneViolation,
        violationCounty: Borough.Queens,
      }),
      violationFactory.build({
        formattedTimeEastern: '2020-01-01T00:00:00.000-05:00',
        humanizedDescription:
          HumanizedDescription.SchoolZoneSpeedCameraViolation,
        violationCounty: Borough.StatenIsland,
      }),
      violationFactory.build({
        formattedTimeEastern: '2017-01-01T00:00:00.000-05:00',
        humanizedDescription: HumanizedDescription.FailureToDisplayMeterReceipt,
        violationCounty: Borough.Bronx,
      }),
      violationFactory.build({
        formattedTimeEastern: '2023-01-01T00:00:00.000-05:00',
        humanizedDescription: HumanizedDescription.NoParkingStreetCleaning,
        violationCounty: Borough.Bronx,
      }),
      violationFactory.build({
        formattedTimeEastern: '2023-01-01T00:00:00.000-05:00',
        humanizedDescription: HumanizedDescription.FrontOrBackPlateMissing,
        violationCounty: Borough.Brooklyn,
      }),
    ]

    const frequencyData = getAggregateFrequencyData(violations)

    const expected: FrequencyData = {
      boroughs: {
        the_bronx: 2,
        brooklyn: 8,
        manhattan: 4,
        queens: 3,
        staten_island: 3,
      },
      violationTypes: {
        'Blocking Bike Lane': 1,
        'Blocking Crosswalk': 1,
        'Bus Lane Violation': 3,
        'Covered Plate': 1,
        'Double Parking': 3,
        'Failure to Display Meter Receipt': 1,
        'Front or Back Plate Missing': 1,
        'Misuse of Parking Permit': 1,
        'No Parking - Street Cleaning': 2,
        'No Standing - Bus Stop': 1,
        'Registration Sticker Expired or Missing': 1,
        'School Zone Speed Camera Violation': 4,
      },
      years: {
        '2016': 1,
        '2017': 1,
        '2018': 3,
        '2019': 2,
        '2020': 2,
        '2021': 3,
        '2022': 4,
        '2023': 4,
      },
    }

    expect(frequencyData).toEqual(expected)
  })

  it('should handle missing years, boroughs or violation types', () => {
    const numViolations = 20
    const violations: Violation[] = violationFactory.buildList(numViolations, {
      formattedTimeEastern: undefined,
      humanizedDescription: undefined,
      violationCounty: Borough.NoBoroughAvailable,
    })

    const frequencyData = getAggregateFrequencyData(violations)

    const expected: FrequencyData = {
      boroughs: { no_borough_available: numViolations },
      violationTypes: { 'No Violation Description Available': numViolations },
      years: { 'No Year Available': numViolations },
    }

    expect(frequencyData).toEqual(expected)
  })
})
