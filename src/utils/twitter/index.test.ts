import { DateTime } from 'luxon'

import AggregateFineData from 'models/aggregateFineData'
import CameraData from 'types/cameraData'

import formPlateLookupTweets, { PlateLookupTweetArguments } from '.'

describe('twitter', () => {
  describe('formPlateLookupTweets', () => {
    it('should form the response parts for a never-queried vehicle with no violations', () => {
      jest.useFakeTimers()

      const now = new Date()
      const nowAsLuxonDate = DateTime.fromJSDate(now)
      const timeString = nowAsLuxonDate.toFormat('hh:mm:ss a ZZZZ')
      const dateString = nowAsLuxonDate.toFormat('LLLL dd, y')

      const plateLookupTweetArguments: PlateLookupTweetArguments = {
        cameraData: {
          busLaneCameraViolations: {
            maxStreak: 0,
            streakEnd: null,
            streakStart: null,
            total: 0,
          },
          cameraViolations: {
            maxStreak: 0,
            streakEnd: null,
            streakStart: null,
            total: 0,
          },
          cameraViolationsWithBusLaneCameraViolations: {
            maxStreak: 0,
            streakEnd: null,
            streakStart: null,
            total: 0,
          },
          redLightCameraViolations: {
            maxStreak: 0,
            streakEnd: null,
            streakStart: null,
            total: 0,
          },
          speedCameraViolations: {
            maxStreak: 0,
            streakEnd: null,
            streakStart: null,
            total: 0,
          },
        },
        existingLookupCreatedAt: undefined,
        fineData: new AggregateFineData({
          totalFined: 0,
          totalInJudgment: 0,
          totalOutstanding: 0,
          totalPaid: 0,
          totalReduced: 0,
        }),
        frequencyData: {
          boroughs: {},
          violationTypes: {},
          years: {},
        },
        lookupFrequency: 0,
        plate: 'ABC1234',
        plateTypes:
          'AGR,ARG,AYG,BOB,CMH,FPW,GSM,HAM,HIS,JWV,MCL,NLM,ORG,PAS,PHS,PPH,RGL,SOS,SPO,SRF,WUG',
        previousLookup: undefined,
        state: 'NY',
        uniqueIdentifier: 'a1b2c3d4',
      }

      const result = formPlateLookupTweets(plateLookupTweetArguments)

      const expected = [
        `As of ${timeString} on ${dateString}: #NY_ABC1234 (types: AGR,ARG,AYG,BOB,CMH,FPW,GSM,HAM,HIS,JWV,MCL,NLM,ORG,PAS,PHS,PPH,RGL,SOS,SPO,SRF,WUG) has been queried 0 times.\n\n`,
        ['Total parking and camera violation tickets for #NY_ABC1234: 0\n\n'],
        'View more details at https://howsmydrivingny.nyc/a1b2c3d4.',
      ]

      expect(result).toEqual(expected)

      jest.useRealTimers()
    })

    it('should form the response parts for a previously-queried vehicle with violations', () => {
      jest.useFakeTimers()

      const january1Of2023 = new Date(2023, 0, 1, 12, 34, 56)
      const january1Of2023AsLuxonDate = DateTime.fromJSDate(january1Of2023, {
        zone: 'America/New_York',
      })
      const january1Of2023TimeString =
        january1Of2023AsLuxonDate.toFormat('hh:mm:ss a ZZZZ')
      const january1Of2023DateString =
        january1Of2023AsLuxonDate.toFormat('LLLL dd, y')

      const now = new Date()
      const nowAsLuxonDate = DateTime.fromJSDate(now, {
        zone: 'America/New_York',
      })
      const nowTimeString = nowAsLuxonDate.toFormat('hh:mm:ss a ZZZZ')
      const nowDateString = nowAsLuxonDate.toFormat('LLLL dd, y')

      const plateLookupTweetArguments: PlateLookupTweetArguments = {
        cameraData: {
          busLaneCameraViolations: {
            maxStreak: 64,
            streakEnd: DateTime.fromISO('2022-08-19T08:39:00.000-04:00'),
            streakStart: DateTime.fromISO('2021-09-01T09:21:00.000-04:00'),
            total: 142,
          },
          cameraViolations: {
            maxStreak: 65,
            streakEnd: DateTime.fromISO('2021-12-23T10:22:00.000-05:00'),
            streakStart: DateTime.fromISO('2020-12-29T10:44:00.000-05:00'),
            total: 127,
          },
          cameraViolationsWithBusLaneCameraViolations: {
            maxStreak: 101,
            streakEnd: DateTime.fromISO('2022-01-12T12:52:00.000-05:00'),
            streakStart: DateTime.fromISO('2021-01-14T09:43:00.000-05:00'),
            total: 269,
          },
          redLightCameraViolations: {
            maxStreak: 4,
            streakEnd: DateTime.fromISO('2022-01-27T11:32:00.000-05:00'),
            streakStart: DateTime.fromISO('2021-03-24T13:25:00.000-04:00'),
            total: 5,
          },
          speedCameraViolations: {
            maxStreak: 62,
            streakEnd: DateTime.fromISO('2021-12-23T10:22:00.000-05:00'),
            streakStart: DateTime.fromISO('2020-12-29T10:44:00.000-05:00'),
            total: 122,
          },
        },
        existingLookupCreatedAt: undefined,
        fineData: new AggregateFineData({
          totalFined: 73726.54999999999,
          totalInJudgment: 115,
          totalOutstanding: 71715.48000000001,
          totalPaid: 1896.0699999999993,
          totalReduced: 0,
        }),
        frequencyData: {
          boroughs: {
            Bronx: 5,
            Brooklyn: 18,
            Manhattan: 536,
            Queens: 8,
          },
          violationTypes: {
            'Bus Lane Violation': 138,
            'School Zone Speed Camera Violation': 122,
            'No Standing - Day/Time Limits': 87,
            'Failure to Display Meter Receipt': 44,
            'No Standing - Except Truck Loading/Unloading': 41,
            'Double Parking - Midtown Commercial Zone': 12,
            'Fire Hydrant': 12,
            'Inspection Sticker Expired or Missing': 12,
            'No Standing - Bus Stop': 12,
            'Registration Sticker Expired or Missing': 10,
            'Double Parking': 8,
            'No Parking - Street Cleaning': 7,
            'No Stopping - Day/Time Limits': 7,
            'Blocking Bike Lane': 6,
            'No Parking - Day/Time Limits': 6,
            'Failure to Stop at Red Light': 5,
            'Blocking Crosswalk': 4,
            'Front or Back Plate Missing': 4,
            'Mobile Bus Lane Violation': 4,
            'No Parking - Except Authorized Vehicles': 4,
            'No Standing - Safety Zone': 4,
            'No Standing - Bus Lane': 3,
            'No Standing - Consul or Diplomat': 3,
            'Parked on Sidewalk': 3,
            'No Parking - Except Hotel Loading': 2,
            'Commercial Plates on Unaltered Vehicle': 1,
            'Inspection Sticker Mutilated or Counterfeit': 1,
            'Nighttime Parking on Residential Street - Commercial Vehicle': 1,
            'No Angle Parking': 1,
            'No Standing - Taxi Stand': 1,
            'No Stopping - Traffic Lane': 1,
            'Registration Sticker Mutilated or Counterfeit': 1,
          },
          years: {
            '2019': 56,
            '2020': 132,
            '2021': 187,
            '2022': 115,
            '2023': 77,
          },
        },
        lookupFrequency: 2,
        plate: 'ABC1234',
        plateTypes:
          'AGR,ARG,AYG,BOB,CMH,FPW,GSM,HAM,HIS,JWV,MCL,NLM,ORG,PAS,PHS,PPH,RGL,SOS,SPO,SRF,WUG',
        previousLookup: {
          createdAt: january1Of2023,
          numViolations: 123,
        },
        state: 'NY',
        uniqueIdentifier: 'a1b2c3d4',
      }

      const result = formPlateLookupTweets(plateLookupTweetArguments)

      const expected = [
        `As of ${nowTimeString} on ${nowDateString}: #NY_ABC1234 (types: AGR,ARG,AYG,BOB,CMH,FPW,GSM,HAM,HIS,JWV,MCL,NLM,ORG,PAS,PHS,PPH,RGL,SOS,SPO,SRF,WUG) has been queried 2 times.\n\n` +
          `This vehicle was last queried on ${january1Of2023DateString} at ${january1Of2023TimeString}. ` +
          `Since then, #NY_ABC1234 (types: AGR,ARG,AYG,BOB,CMH,FPW,GSM,HAM,HIS,JWV,MCL,NLM,ORG,PAS,PHS,PPH,RGL,SOS,SPO,SRF,WUG) has received 444 new tickets.\n\n`,
        [
          'Total parking and camera violation tickets for #NY_ABC1234: 567\n\n' +
            '138 | Bus Lane Violation\n' +
            '122 | School Zone Speed Camera Violation\n' +
            '87   | No Standing - Day/Time Limits\n' +
            '44   | Failure To Display Meter Receipt\n' +
            '41   | No Standing - Except Truck Loading/Unloading\n',

          "Total parking and camera violation tickets for #NY_ABC1234, cont'd:\n\n" +
            '12   | Double Parking - Midtown Commercial Zone\n' +
            '12   | Fire Hydrant\n' +
            '12   | Inspection Sticker Expired Or Missing\n' +
            '12   | No Standing - Bus Stop\n' +
            '10   | Registration Sticker Expired Or Missing\n',

          "Total parking and camera violation tickets for #NY_ABC1234, cont'd:\n\n" +
            '8     | Double Parking\n' +
            '7     | No Parking - Street Cleaning\n' +
            '7     | No Stopping - Day/Time Limits\n' +
            '6     | Blocking Bike Lane\n' +
            '6     | No Parking - Day/Time Limits\n' +
            '5     | Failure To Stop At Red Light\n',

          "Total parking and camera violation tickets for #NY_ABC1234, cont'd:\n\n" +
            '4     | Blocking Crosswalk\n' +
            '4     | Front Or Back Plate Missing\n' +
            '4     | Mobile Bus Lane Violation\n' +
            '4     | No Parking - Except Authorized Vehicles\n' +
            '4     | No Standing - Safety Zone\n' +
            '3     | No Standing - Bus Lane\n',

          "Total parking and camera violation tickets for #NY_ABC1234, cont'd:\n\n" +
            '3     | No Standing - Consul Or Diplomat\n' +
            '3     | Parked On Sidewalk\n' +
            '2     | No Parking - Except Hotel Loading\n' +
            '1     | Commercial Plates On Unaltered Vehicle\n' +
            '1     | Inspection Sticker Mutilated Or Counterfeit\n',

          "Total parking and camera violation tickets for #NY_ABC1234, cont'd:\n\n" +
            '1     | Nighttime Parking On Residential Street - Commercial Vehicle\n' +
            '1     | No Angle Parking\n' +
            '1     | No Standing - Taxi Stand\n' +
            '1     | No Stopping - Traffic Lane\n',

          "Total parking and camera violation tickets for #NY_ABC1234, cont'd:\n\n" +
            '1     | Registration Sticker Mutilated Or Counterfeit\n',
        ],
        [
          'Violations by year for #NY_ABC1234:\n\n' +
            '56   | 2019\n' +
            '132 | 2020\n' +
            '187 | 2021\n' +
            '115 | 2022\n' +
            '77   | 2023\n',
        ],
        [
          'Violations by borough for #NY_ABC1234:\n\n' +
            '5     | Bronx\n' +
            '18   | Brooklyn\n' +
            '536 | Manhattan\n' +
            '8     | Queens\n',
        ],
        'Known fines for #NY_ABC1234:\n\n' +
          '$73,726.55 | Fined\n' +
          '$0.00           | Reduced\n' +
          '$1,896.07   | Paid\n' +
          '$71,715.48 | Outstanding\n' +
          '$115.00       | In Judgment\n',

        'Under the Dangerous Vehicle Abatement Act, this vehicle could have been booted or ' +
          'impounded due to its 62 school zone speed camera violations (>= 15/year) from ' +
          'December 29, 2020 to December 23, 2021.\n',

        'View more details at https://howsmydrivingny.nyc/a1b2c3d4.',
      ]

      expect(result).toEqual(expected)

      jest.useRealTimers()
    })
  })
})
