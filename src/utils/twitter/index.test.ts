import { DateTime } from 'luxon'

import AggregateFineData from 'models/aggregateFineData'
import { instantiateConnection } from 'services/databaseService'

import formPlateLookupTweets, {
  handleTwitterAccountActivityApiEvents, PlateLookupTweetArguments
} from '.'

jest.mock('services/databaseService')

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
          schoolZoneSpeedCameraViolations: {
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
            streakEnd: '2022-08-19T08:39:00.000-04:00',
            streakStart: '2021-09-01T09:21:00.000-04:00',
            total: 142,
          },
          cameraViolations: {
            maxStreak: 65,
            streakEnd: '2021-12-23T10:22:00.000-05:00',
            streakStart: '2020-12-29T10:44:00.000-05:00',
            total: 127,
          },
          cameraViolationsWithBusLaneCameraViolations: {
            maxStreak: 101,
            streakEnd: '2022-01-12T12:52:00.000-05:00',
            streakStart: '2021-01-14T09:43:00.000-05:00',
            total: 269,
          },
          redLightCameraViolations: {
            maxStreak: 4,
            streakEnd: '2022-01-27T11:32:00.000-05:00',
            streakStart: '2021-03-24T13:25:00.000-04:00',
            total: 5,
          },
          schoolZoneSpeedCameraViolations: {
            maxStreak: 62,
            streakEnd: '2021-12-23T10:22:00.000-05:00',
            streakStart: '2020-12-29T10:44:00.000-05:00',
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

  describe('handleTwitterAccountActivityApiEvents', () => {
    it('should handle a direct message create Account Activity object', () => {
      const databaseConnection = {
        end: jest.fn(),
        query: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      const insertId = '12345'

      databaseConnection.query.mockImplementationOnce((_, __, callback) =>
        callback(null, { insertId })
      )

      const directMessageCreateAccountActivityApiObject = {
        for_user_id: '536123456783222211',
        direct_message_events: [
          {
            type: 'message_create',
            id: '1664302173159661234',
            created_timestamp: '1685635531234',
            message_create: {
              message_data: {
                attachment: {
                  media: {
                    media_url_https: 'https://pbs.twimg.com/media/FxgrtW2WAAMZUUm.jpg',
                    type: 'photo',
                  }
                },
                entities: {
                  hashtags: [],
                  symbols: [],
                  urls: [],
                  user_mentions: [],
                },
                text: 'Ny:jrm1490',
              },
              sender_id: '12345678',
              target:{
                recipient_id: '976593574732222465',
              },
            },
          }
        ],
        apps: {
          '1234567': {
            id: '14966629',
            name: "How's My Driving NY",
            url: 'https://howsmydrivingny.nyc'
          }
        },
        users: {
          '12345678': {
            id: '8765432',
            created_timestamp: '1251295177000',
            name: 'ACCOUNT',
            screen_name: 'ScreenName',
            location: 'NYC',
            description: "Me fail English? That's unpossible.",
            protected: false,
            verified: false,
            followers_count: 336,
            friends_count: 1416,
            statuses_count: 11718,
            profile_image_url: 'http://pbs.twimg.com/profile_images/1090661139611074562/OmjkOg2t_normal.jpg',
            profile_image_url_https: 'https://pbs.twimg.com/profile_images/1090661139611074562/OmjkOg2t_normal.jpg'
          },
          '11223344': {
            id: '39487532',
            created_timestamp: '1521673027264',
            name: "How's My Driving NY",
            screen_name: 'HowsMyDrivingNY',
            location: 'New York, NY',
            description: "I look up traffic violations from @NYCDoITT's #opendata.\n" +
              '\n' +
              "I'm a bot, but for non-plate inquiries, please contact @bdhowald.\n" +
              '\n' +
              'https://t.co/S0yIuvwOa3',
            url: 'https://t.co/bZcXYVzBod',
            protected: false,
            verified: false,
            followers_count: 7072,
            friends_count: 8,
            statuses_count: 180556,
            profile_image_url: 'http://pbs.twimg.com/profile_images/977216445938585605/gjUlx3tr_normal.jpg',
            profile_image_url_https: 'https://pbs.twimg.com/profile_images/977216445938585605/gjUlx3tr_normal.jpg'
          }
        }
      }

      const directMessageEvent = directMessageCreateAccountActivityApiObject.direct_message_events[0]

      type SenderId = keyof typeof directMessageCreateAccountActivityApiObject.users

      const senderId = directMessageEvent.message_create.sender_id as SenderId
      const sender = directMessageCreateAccountActivityApiObject.users[senderId]

      const expectedTwitterEvent = {
        created_at: BigInt(directMessageEvent.created_timestamp),
        event_id: BigInt(directMessageEvent.id),
        event_text: directMessageEvent.message_create.message_data.text,
        event_type: 'direct_message',
        location: undefined,
        responded_to: false,
        user_handle: sender.screen_name,
        user_id: BigInt(sender.id),
      }

      const expectedTwitterMediaObject = {
        twitter_event_id: insertId,
        type: directMessageEvent.message_create.message_data.attachment.media.type,
        url: directMessageEvent.message_create.message_data.attachment.media.media_url_https,
      }

      handleTwitterAccountActivityApiEvents(
        JSON.stringify(directMessageCreateAccountActivityApiObject)
      )

      expect(databaseConnection.query).toHaveBeenCalledTimes(2)

      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        1,
        'insert into twitter_events set ?',
        expectedTwitterEvent,
        expect.anything(),
      )
      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        2,
        'insert into twitter_media_objects set ?',
        [expectedTwitterMediaObject],
        expect.anything(),
      )
    })

    it('should handle a favorite event Account Activity object', () => {
      const databaseConnection = {
        end: jest.fn(),
        query: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      const favoriteEventAccountActivityApiObject = {
        for_user_id: '976593574732222465',
        favorite_events: [
          {
            id: '2934ed1afd27e23248b0f9a5a49dadf2',
            created_at: 'Sun Jun 04 18:19:56 +0000 2023',
            timestamp_ms: 1685902796418,
            favorited_status: {
              id_str: '123456789012',
            },
            user: {
              id_str: '210987654321',
            },
          }
        ]
      }

      handleTwitterAccountActivityApiEvents(
        JSON.stringify(favoriteEventAccountActivityApiObject)
      )

      expect(databaseConnection.query).toHaveBeenCalledWith(
        'select CAST( in_reply_to_message_id as CHAR(20) ) as in_reply_to_message_id ' +
        'from non_follower_replies where user_id = ? and favorited = false and event_id = ?;',
        [
          BigInt(favoriteEventAccountActivityApiObject.favorite_events[0].user.id_str),
          BigInt(favoriteEventAccountActivityApiObject.favorite_events[0].favorited_status.id_str),
        ],
        expect.anything(),
      )
    })

    it('should handle a follow event Activity API object', () => {
      const databaseConnection = {
        end: jest.fn(),
        query: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      const followEventAccountActivityApiObject = {
        for_user_id: '976593574732222465',
        follow_events: [
          {
            created_timestamp: '1685902796418',
            source: {
              id: '210987654321',
            },
            target: {
              id: '976593574732222465',
            },
            type: 'follow',
          }
        ]
      }

      handleTwitterAccountActivityApiEvents(
        JSON.stringify(followEventAccountActivityApiObject)
      )

      expect(databaseConnection.query).toHaveBeenCalledWith(
        'select CAST( in_reply_to_message_id as CHAR(20) ) as in_reply_to_message_id ' +
        'from non_follower_replies where user_id = ? and favorited = false;',
        [
          BigInt(followEventAccountActivityApiObject.follow_events[0].source.id),
        ],
        expect.anything(),
      )
    })

    it('should handle a tweet create event Account Activity object with an extended tweet field', () => {
      const databaseConnection = {
        end: jest.fn(),
        query: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      const insertId = '12345'

      databaseConnection.query.mockImplementationOnce((_, __, callback) =>
        callback(null, { insertId })
      )

      const tweetCreateEventCreateAccountActivityApiObject = {
        tweet_create_events: [
          {
            extended_tweet: {
              entities: {
                hashtags: [],
                urls: [],
                user_mentions:[
                  {
                    id:4867386993,
                    id_str: "4867386993",
                    indices: [0,13],
                    name: "placard corruption",
                    screen_name: 'placardabuse',
                  },
                  {
                    id: 2842148794,
                    id_str: "2842148794",
                    indices:[14,28],
                    name: "NYCourts",
                    screen_name: "NYSCourtsNews",
                  }
                ],
                symbols: [],
              },
              extended_entities: {
                media: [
                  {
                    id: '1532000116223221800',
                    id_str: "1532000116223221761",
                    indices: [
                      250,
                      273
                    ],
                    media_url: "http://pbs.twimg.com/media/FULB_SNXoAEMl0R.jpg",
                    media_url_https: "https://pbs.twimg.com/media/FULB_SNXoAEMl0R.jpg",
                    url: "https://t.co/HlLwRXQyIY",
                    display_url: "pic.twitter.com/HlLwRXQyIY",
                    expanded_url: "https://twitter.com/sqddxjQ48j/status/1532000121793167360/photo/1",
                    type: "photo",
                    sizes: {
                      medium: {
                        w: 900,
                        h: 1200,
                        resize: "fit"
                      },
                      thumb: {
                        w: 150,
                        h: 150,
                        resize: "crop"
                      },
                      small: {
                        w: 510,
                        h: 680,
                        resize: "fit"
                      },
                      large: {
                        w: 1536,
                        h: 2048,
                        resize: "fit"
                      }
                    }
                  }
                ],
              },
              full_text: '@placardabuse @NYSCourtsNews One installed on actual Camry Hybrids of this vintage.',
            },
            id_str: "12345678276030615556",
            in_reply_to_status_id_str: '1665471049385885697',
            timestamp_ms: '1685895318942',
            user: {
              id_str: "11223344276030615556",
              screen_name: 'ScreenName',
            }
          },
        ],
        user_has_blocked: false,
      }

      const tweetCreateEvent = tweetCreateEventCreateAccountActivityApiObject.tweet_create_events[0]

      const expectedTwitterEvent = {
        created_at: BigInt(tweetCreateEvent.timestamp_ms),
        event_id: BigInt(tweetCreateEvent.id_str),
        event_text: tweetCreateEvent.extended_tweet.full_text,
        event_type: 'status',
        in_reply_to_message_id: BigInt(tweetCreateEvent.in_reply_to_status_id_str),
        location: undefined,
        responded_to: false,
        user_handle: tweetCreateEvent.user.screen_name,
        user_id: BigInt(tweetCreateEvent.user.id_str),
        user_mention_ids: tweetCreateEvent.extended_tweet.entities.user_mentions.map(
          (userMention) => userMention.id_str
        ).join(' '),
        user_mentions: tweetCreateEvent.extended_tweet.entities.user_mentions.map(
          (userMention) => userMention.screen_name
        ).join(' '),
      }

      const expectedTwitterMediaObject = {
        twitter_event_id: insertId,
        type: tweetCreateEvent.extended_tweet.extended_entities.media[0].type,
        url: tweetCreateEvent.extended_tweet.extended_entities.media[0].media_url_https,
      }

      handleTwitterAccountActivityApiEvents(
        JSON.stringify(tweetCreateEventCreateAccountActivityApiObject)
      )

      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        1,
        'insert into twitter_events set ?',
        expectedTwitterEvent,
        expect.anything(),
      )
      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        2,
        'insert into twitter_media_objects set ?',
        [expectedTwitterMediaObject],
        expect.anything(),
      )
    })

    it('should handle a tweet create event Account Activity object with an extended tweet field, but no photos', () => {
      const databaseConnection = {
        end: jest.fn(),
        query: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      const insertId = '12345'

      databaseConnection.query.mockImplementationOnce((_, __, callback) =>
        callback(null, { insertId })
      )

      const tweetCreateEventCreateAccountActivityApiObject = {
        tweet_create_events: [
          {
            extended_tweet: {
              entities: {
                hashtags: [],
                urls: [],
                user_mentions:[
                  {
                    id:4867386993,
                    id_str: "4867386993",
                    indices: [0,13],
                    name: "placard corruption",
                    screen_name: 'placardabuse',
                  },
                  {
                    id: 2842148794,
                    id_str: "2842148794",
                    indices:[14,28],
                    name: "NYCourts",
                    screen_name: "NYSCourtsNews",
                  }
                ],
                symbols: [],
              },
              full_text: '@placardabuse @NYSCourtsNews One installed on actual Camry Hybrids of this vintage.',
            },
            id_str: "12345678276030615556",
            in_reply_to_status_id_str: '1665471049385885697',
            timestamp_ms: '1685895318942',
            user: {
              id_str: "11223344276030615556",
              screen_name: 'ScreenName',
            }
          },
        ],
        user_has_blocked: false,
      }

      const tweetCreateEvent = tweetCreateEventCreateAccountActivityApiObject.tweet_create_events[0]

      const expectedTwitterEvent = {
        created_at: BigInt(tweetCreateEvent.timestamp_ms),
        event_id: BigInt(tweetCreateEvent.id_str),
        event_text: tweetCreateEvent.extended_tweet.full_text,
        event_type: 'status',
        in_reply_to_message_id: BigInt(tweetCreateEvent.in_reply_to_status_id_str),
        location: undefined,
        responded_to: false,
        user_handle: tweetCreateEvent.user.screen_name,
        user_id: BigInt(tweetCreateEvent.user.id_str),
        user_mention_ids: tweetCreateEvent.extended_tweet.entities.user_mentions.map(
          (userMention) => userMention.id_str
        ).join(' '),
        user_mentions: tweetCreateEvent.extended_tweet.entities.user_mentions.map(
          (userMention) => userMention.screen_name
        ).join(' '),
      }

      handleTwitterAccountActivityApiEvents(
        JSON.stringify(tweetCreateEventCreateAccountActivityApiObject)
      )

      expect(databaseConnection.query).toHaveBeenCalledWith(
        'insert into twitter_events set ?',
        expectedTwitterEvent,
        expect.anything(),
      )
    })

    it('should handle a tweet create event Account Activity object with no extended tweet field', () => {
      const databaseConnection = {
        end: jest.fn(),
        query: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      const insertId = '12345'

      databaseConnection.query.mockImplementationOnce((_, __, callback) =>
        callback(null, { insertId })
      )

      const tweetCreateEventCreateAccountActivityApiObject = {
        tweet_create_events: [
          {
            entities: {
              hashtags: [],
              urls: [],
              user_mentions: [
                {
                  id: '976593574732222500',
                  id_str: "976593574732222465",
                  indices: [12,28],
                  name: "How's My Driving NY",
                  screen_name: "HowsMyDrivingNY",
                }
              ],
              symbols: [],
            },
            extended_entities: {
              media: [
                {
                  id: '1532000116223221800',
                  id_str: "1532000116223221761",
                  indices: [
                    250,
                    273
                  ],
                  media_url: "http://pbs.twimg.com/media/FULB_SNXoAEMl0R.jpg",
                  media_url_https: "https://pbs.twimg.com/media/FULB_SNXoAEMl0R.jpg",
                  url: "https://t.co/HlLwRXQyIY",
                  display_url: "pic.twitter.com/HlLwRXQyIY",
                  expanded_url: "https://twitter.com/sqddxjQ48j/status/1532000121793167360/photo/1",
                  type: "photo",
                  sizes: {
                    medium: {
                      w: 900,
                      h: 1200,
                      resize: "fit"
                    },
                    thumb: {
                      w: 150,
                      h: 150,
                      resize: "crop"
                    },
                    small: {
                      w: 510,
                      h: 680,
                      resize: "fit"
                    },
                    large: {
                      w: 1536,
                      h: 2048,
                      resize: "fit"
                    }
                  }
                }
              ],
            },
            text: 'NY:LAYLOW1 @HowsMyDrivingNY https://t.co/GEEHV6kL3L',
            id_str: "12345678276030615556",
            in_reply_to_status_id_str: '1665471049385885697',
            timestamp_ms: '1685895318942',
            user: {
              id_str: "11223344276030615556",
              screen_name: 'ScreenName',
            }
          },
        ],
        user_has_blocked: false,
      }

      const tweetCreateEvent = tweetCreateEventCreateAccountActivityApiObject.tweet_create_events[0]

      const expectedTwitterEvent = {
        created_at: BigInt(tweetCreateEvent.timestamp_ms),
        event_id: BigInt(tweetCreateEvent.id_str),
        event_text: tweetCreateEvent.text,
        event_type: 'status',
        in_reply_to_message_id: BigInt(tweetCreateEvent.in_reply_to_status_id_str),
        location: undefined,
        responded_to: false,
        user_handle: tweetCreateEvent.user.screen_name,
        user_id: BigInt(tweetCreateEvent.user.id_str),
        user_mention_ids: tweetCreateEvent.entities.user_mentions.map(
          (userMention) => userMention.id_str
        ).join(' '),
        user_mentions: tweetCreateEvent.entities.user_mentions.map(
          (userMention) => userMention.screen_name
        ).join(' '),
      }

      const expectedTwitterMediaObject = {
        twitter_event_id: insertId,
        type: tweetCreateEvent.extended_entities.media[0].type,
        url: tweetCreateEvent.extended_entities.media[0].media_url_https,
      }

      handleTwitterAccountActivityApiEvents(
        JSON.stringify(tweetCreateEventCreateAccountActivityApiObject)
      )

      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        1,
        'insert into twitter_events set ?',
        expectedTwitterEvent,
        expect.anything(),
      )
      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        2,
        'insert into twitter_media_objects set ?',
        [expectedTwitterMediaObject],
        expect.anything(),
      )
    })

    it('should handle a tweet create event Account Activity object with no user mentions', () => {
      const databaseConnection = {
        end: jest.fn(),
        query: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      const insertId = '12345'

      databaseConnection.query.mockImplementationOnce((_, __, callback) =>
        callback(null, { insertId })
      )

      const tweetCreateEventCreateAccountActivityApiObject = {
        tweet_create_events: [
          {
            entities: {
              hashtags: [],
              urls: [],
              user_mentions: [],
              symbols: [],
            },
            extended_entities: {},
            text: 'NY:LAYLOW1',
            id_str: "12345678276030615556",
            in_reply_to_status_id_str: '1665471049385885697',
            timestamp_ms: '1685895318942',
            user: {
              id_str: "11223344276030615556",
              screen_name: 'ScreenName',
            }
          },
        ],
        user_has_blocked: false,
      }

      const tweetCreateEvent = tweetCreateEventCreateAccountActivityApiObject.tweet_create_events[0]

      const expectedTwitterEvent = {
        created_at: BigInt(tweetCreateEvent.timestamp_ms),
        event_id: BigInt(tweetCreateEvent.id_str),
        event_text: tweetCreateEvent.text,
        event_type: 'status',
        in_reply_to_message_id: BigInt(tweetCreateEvent.in_reply_to_status_id_str),
        location: undefined,
        responded_to: false,
        user_handle: tweetCreateEvent.user.screen_name,
        user_id: BigInt(tweetCreateEvent.user.id_str),
        user_mention_ids: undefined,
        user_mentions: undefined,
      }

      handleTwitterAccountActivityApiEvents(
        JSON.stringify(tweetCreateEventCreateAccountActivityApiObject)
      )

      expect(databaseConnection.query).toHaveBeenCalledWith(
        'insert into twitter_events set ?',
        expectedTwitterEvent,
        expect.anything(),
      )
    })

    it('should log, but otherwise ignore an event it does not know how to handle', () => {
      const databaseConnection = {
        end: jest.fn(),
        query: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      const directMessageMarkReadEventAccountActivityApiObject = {
        direct_message_mark_read_events: [],
        for_user_id: '976593574732222465',
      }

      handleTwitterAccountActivityApiEvents(
        JSON.stringify(directMessageMarkReadEventAccountActivityApiObject)
      )

      expect(databaseConnection.query).not.toHaveBeenCalled()
    })
  })
})
