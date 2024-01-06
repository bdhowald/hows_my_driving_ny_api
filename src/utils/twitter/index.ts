import { DateTime } from 'luxon'

import { CAMERA_THRESHOLDS } from 'constants/dangerousVehicleAbatementAct'
import { HOWS_MY_DRIVING_NY_WEBSITE_URL } from 'constants/endpoints'
import { FINE_FIELDS } from 'constants/fines'
import { US_DOLLAR_FORMAT_OBJECT } from 'constants/locale'
import {
  HOWS_MY_DRIVING_NY_USER_ID,
  STATUS_MAX_LENGTH,
} from 'constants/twitter'
import AggregateFineData from 'models/aggregateFineData'
import {
  AccountActivityApiObject,
  DirectMessageCreateAccountActivityApiObject,
  DirectMessageEvent,
  Entities,
  FavoriteEvent,
  FollowEvent,
  Media,
  TweetCreateEvent,
  TwitterDatabaseEvent,
  TwitterMediaObject,
  UserMention,
} from 'types/twitter'
import CameraData from 'types/cameraData'
import FrequencyData from 'types/frequencyData'
import { PreviousLookupAndFrequency } from 'types/query'
import { camelizeKeys } from 'utils/camelize'
import {
  insertNewTwitterEventAndMediaObjects,
  updateNonFollowerReplies,
} from 'utils/databaseQueries'

type AssembleResponseTypeArguments = {
  // The prefix string for every tweet about this summary type after the first tweet
  continuedFormatString?: string | undefined

  // The placeholder to use when a summary data type field is missing
  // e.g. 'No year available' when a violation has no datetime
  defaultDescription: string

  // The prefix string for the first tweet about this summary type
  prefixFormatString?: string | undefined

  // The summary data (e.g. years, boroughs, violation types)
  summaryDataSubset:
    | FrequencyData['boroughs']
    | FrequencyData['violationTypes']
    | FrequencyData['years']
}

export type PlateLookupTweetArguments = {
  // Totals and streak starts and ends for all camera violations, including combinations
  cameraData: CameraData

  // The datetime an existing lookup was created, if we are querying for one
  existingLookupCreatedAt: Date | undefined

  // The individual sums of fines assessed, reduced, paid, and outstanding
  fineData: AggregateFineData

  // Frequency data by borough, violation type, and year
  frequencyData: FrequencyData

  // The number of times this plate has been queried
  lookupFrequency: PreviousLookupAndFrequency['frequency']

  // The text on this license plate
  plate: string

  // The possible type(s) of this plate
  plateTypes?: string | undefined

  // Number of violations and creation date of the most recent previous lookup
  previousLookup?: PreviousLookupAndFrequency['previousLookup'] | undefined

  // The two-character abbreviation of the plate's state
  state: string

  // 8-digit alphanumeric code that uniquely identifies this lookup
  uniqueIdentifier: string
}

type RepeatLookupStringArguments = {
  // The number of new violations since the most recent previous lookup
  numNewViolations: number

  // The text on this license plate
  plate: string

  // The possible type(s) of this plate
  plateTypes?: string | undefined

  // Number of violations and creation date of a previous lookup
  previousLookup: PreviousLookupAndFrequency['previousLookup'] | undefined

  // The two-character abbreviation of the plate's state
  state: string
}

/**
 * Creates a string summarizing a vehicle's previous lookup details
 *
 * @param {RepeatLookupStringArguments} repeatLookupStringArguments
 * @returns {string}
 */
const createRepeatLookupString = (
  repeatLookupStringArguments: RepeatLookupStringArguments
) => {
  const { numNewViolations, plate, state, plateTypes, previousLookup } =
    repeatLookupStringArguments

  let violationsString = ''

  if (previousLookup && numNewViolations > 0) {
    // Determine when the last lookup was...
    const previousLookupDateTime = previousLookup.createdAt
    const previousLookupDateTimeInUTC = DateTime.fromJSDate(
      previousLookupDateTime,
      { zone: 'America/New_York' }
    )
    const nowInUTC = DateTime.utc()

    // If at least five minutes have passed...
    if (nowInUTC.minus({ minutes: 5 }) > previousLookupDateTimeInUTC) {
      // Add the new ticket info and previous lookup time to the string.

      const previousLookupTimeInUTCString =
        previousLookupDateTimeInUTC.toFormat('hh:mm:ss a ZZZZ')
      const previousLookupDateInUTCString =
        previousLookupDateTimeInUTC.toFormat('LLLL dd, y')

      const lastQueriedString = `This vehicle was last queried on ${previousLookupDateInUTCString} at ${previousLookupTimeInUTCString}.`
      violationsString += lastQueriedString

      const plateHashTagString = getPlateHashTagString(plate, state)
      const plateTypesString = plateTypes ? ` (types: ${plateTypes}) ` : ' '
      const fullPlateString = plateHashTagString + plateTypesString

      const newTicketsSinceString = ` Since then, ${fullPlateString}has received ${numNewViolations} new ticket${
        numNewViolations === 1 ? '' : 's'
      }.\n\n`

      violationsString += newTicketsSinceString
    }
  }

  return violationsString
}

/**
 * Gets stats for a lookup on borough, year, violation type frequency
 *
 * @param {string}      plate            - The text on this license plate
 * @param {string}      state            - The two-character abbreviation of the plate's state
 * @returns {string}
 */
const getPlateHashTagString = (plate: string, state: string) => {
  return `#${state.toUpperCase()}_${plate.toUpperCase()}`
}

/**
 * Forms a plate lookup response in multiple tweets.
 * @param {PlateLookupTweetArguments} plateLookupTweetArguments
 * @returns
 */
const formPlateLookupTweets = (
  plateLookupTweetArguments: PlateLookupTweetArguments
): (string | string[])[] => {
  // response_chunks holds tweet-length-sized parts of the response
  // to be tweeted out or appended into a single direct message.

  const {
    cameraData,
    existingLookupCreatedAt,
    frequencyData,
    fineData,
    lookupFrequency,
    plate,
    previousLookup,
    state,
    plateTypes,
    uniqueIdentifier,
  } = plateLookupTweetArguments

  const responseChunks = []
  let violationsString = ''

  // Get total violations
  const totalViolations = Object.values(frequencyData.violationTypes).reduce(
    (prev: number, next: number) => prev + next,
    0
  )

  const asOfDateTime = existingLookupCreatedAt
    ? DateTime.fromJSDate(existingLookupCreatedAt)
    : DateTime.utc()

  const asOfDateTimeInEasternTime = asOfDateTime.setZone('America/New_York')
  const asOfTime = asOfDateTimeInEasternTime.toFormat('hh:mm:ss a ZZZZ')
  const asOfDate = asOfDateTimeInEasternTime.toFormat('LLLL dd, y')
  const timePrefix = `As of ${asOfTime} on ${asOfDate}:`

  // Append time prefix to blank string to start to build tweet.
  violationsString += timePrefix

  // Append summary string.
  const plateHashTagString = getPlateHashTagString(plate, state)
  const plateTypesString = plateTypes ? ` (types: ${plateTypes}) ` : ' '
  const lookupSummaryString =
    ` ${plateHashTagString}${plateTypesString}has been ` +
    `queried ${lookupFrequency} time${lookupFrequency === 1 ? '' : 's'}.\n\n`

  violationsString += lookupSummaryString

  // If this vehicle has been queried before...
  if (previousLookup) {
    const previousNumViolations = previousLookup.numViolations
    const numNewViolations = totalViolations - previousNumViolations

    const repeatLookupStringArguments: RepeatLookupStringArguments = {
      numNewViolations,
      plate,
      state,
      plateTypes,
      previousLookup,
    }

    violationsString += createRepeatLookupString(repeatLookupStringArguments)
  }

  responseChunks.push(violationsString)

  const totalViolationsResponsePartArguments: AssembleResponseTypeArguments = {
    continuedFormatString: `Total parking and camera violation tickets for ${plateHashTagString}, cont'd:\n\n`,
    defaultDescription: 'No Violation Description Available',
    prefixFormatString: `Total parking and camera violation tickets for ${plateHashTagString}: ${totalViolations}\n\n`,
    summaryDataSubset: frequencyData.violationTypes,
  }

  responseChunks.push(
    handleResponsePartFormation(totalViolationsResponsePartArguments)
  )

  if (Object.keys(frequencyData.years).length) {
    const yearsResponsePartArguments: AssembleResponseTypeArguments = {
      continuedFormatString: `Violations by year for ${plateHashTagString}, cont'd:\n\n`,
      defaultDescription: 'No Year Available',
      prefixFormatString: `Violations by year for ${plateHashTagString}:\n\n`,
      summaryDataSubset: frequencyData.years,
    }

    responseChunks.push(handleResponsePartFormation(yearsResponsePartArguments))
  }

  if (Object.keys(frequencyData.boroughs).length) {
    const boroughsResponsePartArguments: AssembleResponseTypeArguments = {
      continuedFormatString: `Violations by borough for ${plateHashTagString}, cont'd:\n\n`,
      defaultDescription: 'No Borough Available',
      prefixFormatString: `Violations by borough for ${plateHashTagString}:\n\n`,
      summaryDataSubset: frequencyData.boroughs,
    }

    responseChunks.push(
      handleResponsePartFormation(boroughsResponsePartArguments)
    )
  }

  if (fineData && fineData.areFinesAssessed) {
    let curString = `Known fines for ${plateHashTagString}:\n\n`
    const maxCountLength = US_DOLLAR_FORMAT_OBJECT.format(
      fineData.maxAmount
    ).length

    const spacesNeeded = maxCountLength * 2 + 1

    FINE_FIELDS.forEach((fineType) => {
      const fineTypeAmount = fineData[fineType]
      const currencyString = US_DOLLAR_FORMAT_OBJECT.format(fineTypeAmount)

      const countLength = currencyString.length

      // e.g., if spaces_needed is 5, and count_length is 2, we need
      // to pad to 3.
      const leftJustifyAmount = spacesNeeded - countLength

      const humanReadableFineType = fineType
        .replace('total', '')
        .replace(/(\S)([A-Z])/g, '$1 $2')

      // formulate next string part
      const nextPart = `${currencyString.padEnd(
        leftJustifyAmount
      )}| ${humanReadableFineType.replace(/\b[a-z]/g, (firstLetterOfWord) =>
        firstLetterOfWord.toUpperCase()
      )}\n`

      // determine current string length if necessary
      const potentialResponseLength = (curString + nextPart).length

      // If violation string so far and new part are less or
      // equal than 280 characters, append to existing tweet string.
      if (potentialResponseLength <= STATUS_MAX_LENGTH) {
        curString += nextPart
      } else {
        responseChunks.push(curString)

        curString = `Known fines for ${plateHashTagString}, cont'd:\n\n`
        curString += nextPart
      }
    })

    // add to container
    responseChunks.push(curString)
  }

  if (cameraData) {
    const thresholds = Object.entries(CAMERA_THRESHOLDS) as [
      (
        | 'cameraViolations'
        | 'redLightCameraViolations'
        | 'schoolZoneSpeedCameraViolations'
      ),
      number
    ][]
    thresholds.forEach(([thresholdName, thresholdValue]) => {
      if (thresholdName === 'cameraViolations') {
        return
      }

      const thresholdData = cameraData[thresholdName]
      if (thresholdData) {
        if (
          thresholdData.maxStreak >= thresholdValue &&
          thresholdData.streakEnd &&
          thresholdData.streakStart
        ) {
          const humanReadableCameraTypeName =
            thresholdName === 'redLightCameraViolations'
              ? 'red light'
              : thresholdName === 'schoolZoneSpeedCameraViolations'
              ? 'school zone speed'
              : 'unknown camera type'

          const formattedStreakStartDate = DateTime.fromISO(
            thresholdData.streakStart
          ).toFormat('LLLL dd, y')
          const formattedStreakEndDate = DateTime.fromISO(
            thresholdData.streakEnd
          ).toFormat('LLLL dd, y')

          const dvaaString =
            'Under the Dangerous Vehicle Abatement Act, this vehicle ' +
            `could have been booted or impounded due to its ${thresholdData.maxStreak} ` +
            `${humanReadableCameraTypeName} camera violations (>= ${thresholdValue}/year) ` +
            `from ${formattedStreakStartDate} to ${formattedStreakEndDate}.\n`

          responseChunks.push(dvaaString)
        }
      }
    })
  }

  const uniqueLink = getWebsitePlateLookupLink(uniqueIdentifier)

  const websiteLinkString = `View more details at ${uniqueLink}.`
  responseChunks.push(websiteLinkString)

  return responseChunks
}

/**
 * Return the key with the most violations in a collection
 *
 * @param {FrequencyData['violationTypes']} collection - an object with any keys, where the values are always
 *                                                       a number of violations pertaining to that key
 */
const getCollectionKeyWithMostViolations = (
  collection:
    | FrequencyData['boroughs']
    | FrequencyData['violationTypes']
    | FrequencyData['years']
): string | undefined => {
  const objectEntries = Object.entries(collection)
  let keyWithMostViolations: string | undefined
  let violationsMax = 0

  objectEntries.forEach(([key, violationCountForKey]) => {
    if (violationCountForKey > violationsMax) {
      violationsMax = violationCountForKey
      keyWithMostViolations = key
    }
  })

  return keyWithMostViolations
}

/**
 * Returns unique link to howsmydrivingny.nyc website for lookup
 *
 * @param {string} uniqueIdentifier - 8-digit alphanumeric code that uniquely identifies this lookup
 */
const getWebsitePlateLookupLink = (uniqueIdentifier: string) =>
  `${HOWS_MY_DRIVING_NY_WEBSITE_URL}/${uniqueIdentifier}`

/**
 * Parse direct message event and save event and media to database
 *
 * @param {DirectMessageEvent} directMessageEvent
 */
const handleDirectMessageEvent = (
  directMessageEvent: DirectMessageEvent,
  users: DirectMessageCreateAccountActivityApiObject['users']
) => {
  if (directMessageEvent.type == 'message_create') {
    const messageCreateData = directMessageEvent.messageCreate
    let photoUrl: string | undefined

    const senderId = messageCreateData.senderId
    const sender = users[senderId]

    if (messageCreateData.messageData) {
      const messageData = messageCreateData.messageData

      if (messageData.attachment?.media?.type === 'photo') {
        photoUrl = messageData.attachment.media.mediaUrlHttps
      }
    }

    if (
      sender &&
      directMessageEvent.messageCreate.target.recipientId ===
        HOWS_MY_DRIVING_NY_USER_ID
    ) {
      const twitterDatabaseEvent: TwitterDatabaseEvent = {
        createdAt: BigInt(directMessageEvent.createdTimestamp),
        eventType: 'direct_message',
        eventId: BigInt(directMessageEvent.id),
        eventText: messageCreateData.messageData.text,
        location: undefined,
        respondedTo: false,
        userHandle: sender.screenName,
        userId: BigInt(sender.id),
      }

      const mediaObjects: TwitterMediaObject[] | undefined = photoUrl
        ? [
            {
              type: 'photo',
              url: photoUrl,
            },
          ]
        : undefined

      insertNewTwitterEventAndMediaObjects(twitterDatabaseEvent, mediaObjects)
    }
  }
}

/**
 * Parse favorite event and update the relevant twitter event
 *
 * @param {FavoriteEvent} favoriteEvent
 */
const handleFavoriteEvent = (favoriteEvent: FavoriteEvent) => {
  const favoritedStatusId = BigInt(favoriteEvent.favoritedStatus.idStr)
  const userId = BigInt(favoriteEvent.user.idStr)

  updateNonFollowerReplies(userId, favoritedStatusId)
}

/**
 * Parse follow event and update the relevant twitter event
 *
 * @param {FollowEvent} followEvent
 */
const handleFollowEvent = (followEvent: FollowEvent) => {
  const userId = BigInt(followEvent.source.id)

  updateNonFollowerReplies(userId)
}

/**
 * Creates tweets by parsing response text into chunks that fall below the maxt tweet length.
 *
 * @param {AssembleResponseTypeArguments} assembleResponseTypeArguments
 * @returns
 */
const handleResponsePartFormation = (
  assembleResponseTypeArguments: AssembleResponseTypeArguments
): string[] => {
  const {
    defaultDescription,
    continuedFormatString,
    prefixFormatString,
    summaryDataSubset,
  } = assembleResponseTypeArguments
  // collect the responses
  const responseContainer: string[] = []

  // # Initialize current string to prefix
  let curString = ''

  if (prefixFormatString) {
    curString += prefixFormatString
  }

  const keyWithMostViolations:
    | keyof FrequencyData['boroughs']
    | keyof FrequencyData['violationTypes']
    | keyof FrequencyData['years']
    | undefined = getCollectionKeyWithMostViolations(summaryDataSubset)

  const maxCountLength =
    keyWithMostViolations && keyWithMostViolations in summaryDataSubset
      ? summaryDataSubset[
          keyWithMostViolations as keyof typeof summaryDataSubset
        ]
      : 0
  // const maxCountLength = len(str(max(item[count] for item in collection)))
  const spacesNeeded = maxCountLength.toString().length * 2 + 1

  const objectEntries: [string, number][] = Object.entries(summaryDataSubset)

  // Grab item
  objectEntries.forEach(([key, violationCountForKey]) => {
    // Titleize for readability.
    const description =
      key.replace(/\b[a-z]/g, (firstLetterOfWord) =>
        firstLetterOfWord.toUpperCase()
      ) || defaultDescription

    const countLength = violationCountForKey.toString().length

    // # e.g., if spacesNeeded is 5, and countLength is 2,
    // we need to pad to 3.
    const leftJustifyAmount = spacesNeeded - countLength

    // formulate next string part
    const nextPart = `${violationCountForKey
      .toString()
      .padEnd(leftJustifyAmount)}| ${description}\n`

    // #etermine current string length
    const potentialResponseLength = (curString + nextPart).length

    // If violation string so far and new part are less or
    // equal than 280 characters, append to existing tweet string.
    if (potentialResponseLength <= STATUS_MAX_LENGTH) {
      curString += nextPart
    } else {
      responseContainer.push(curString)
      if (continuedFormatString) {
        curString = continuedFormatString
      }
      curString += nextPart
    }
  })

  // If we finish the list with a non-empty string,
  // append that string to response parts
  if (curString.length !== 0) {
    // Append ready string into parts for response.
    responseContainer.push(curString)
  }

  // Return parts
  return responseContainer
}

/**
 * Parse tweet create event and save event and media to database
 *
 * @param {TweetCreateEvent} tweetCreateEvent
 */
const handleTweetCreateEvent = (tweetCreateEvent: TweetCreateEvent) => {
  if (!tweetCreateEvent.retweetedStatus && tweetCreateEvent.user?.screenName) {
    let text: string | undefined
    let userMentionIds: string | undefined
    let userMentions: string | undefined
    let photoUrls: string[] | undefined

    if (tweetCreateEvent.extendedTweet) {
      const extendedTweet = tweetCreateEvent.extendedTweet

      text = extendedTweet.fullText

      const userMentionData = parseEntitiesForUserMentionData(
        extendedTweet.entities,
        extendedTweet.fullText
      )

      userMentionIds = userMentionData?.userMentionIds
      userMentions = userMentionData?.userMentions

      photoUrls = parseExtendedEntitiesForMediaUrls(
        extendedTweet.extendedEntities
      )
    } else {
      text = tweetCreateEvent.text

      const userMentionData = parseEntitiesForUserMentionData(
        tweetCreateEvent.entities,
        tweetCreateEvent.text
      )

      userMentionIds = userMentionData?.userMentionIds
      userMentions = userMentionData?.userMentions

      if (tweetCreateEvent.extendedTweet) {
        const extendedEntities = tweetCreateEvent.extendedEntities
        photoUrls = parseExtendedEntitiesForMediaUrls(extendedEntities)
      }
    }

    const twitterDatabaseEvent: TwitterDatabaseEvent = {
      createdAt: BigInt(tweetCreateEvent.timestampMs),
      eventType: 'status',
      eventId: BigInt(tweetCreateEvent.idStr),
      eventText: text.substring(text.length - STATUS_MAX_LENGTH * 2),
      inReplyToMessageId: tweetCreateEvent.inReplyToStatusIdStr
        ? BigInt(tweetCreateEvent.inReplyToStatusIdStr)
        : undefined,
      location: tweetCreateEvent.place?.fullName,
      respondedTo: false,
      userHandle: tweetCreateEvent.user.screenName,
      userId: BigInt(tweetCreateEvent.user.idStr),
      userMentions: userMentions?.substring(
        userMentions.length - STATUS_MAX_LENGTH * 2
      ),
      userMentionIds,
    }

    const mediaObjects: TwitterMediaObject[] | undefined = photoUrls?.map(
      (photoUrl) => ({
        type: 'photo',
        url: photoUrl,
      })
    )

    insertNewTwitterEventAndMediaObjects(twitterDatabaseEvent, mediaObjects)
  }
}

/**
 * Handle Twitter Account Activity API objects
 *
 * @param {string} accountActivityApiEventBody - json string of Twitter Account Activity API object
 */
export const handleTwitterAccountActivityApiEvents = async (
  accountActivityApiEventBody: string
): Promise<void> => {
  const accountActivityApiObject = JSON.parse(accountActivityApiEventBody)

  const camelizedJson = camelizeKeys(
    accountActivityApiObject
  ) as unknown as AccountActivityApiObject

  if ('directMessageEvents' in camelizedJson) {
    camelizedJson.directMessageEvents.forEach(
      (directMessageEvent: DirectMessageEvent) => {
        handleDirectMessageEvent(directMessageEvent, camelizedJson.users)
      }
    )
    return
  }

  if ('favoriteEvents' in camelizedJson) {
    camelizedJson.favoriteEvents.forEach((favoriteEvent: FavoriteEvent) => {
      handleFavoriteEvent(favoriteEvent)
    })
    return
  }

  if ('followEvents' in camelizedJson) {
    camelizedJson.followEvents.forEach((followEvent: FollowEvent) => {
      handleFollowEvent(followEvent)
    })
    return
  }

  if ('tweetCreateEvents' in camelizedJson) {
    camelizedJson.tweetCreateEvents.forEach(
      (tweetCreateEvent: TweetCreateEvent) => {
        handleTweetCreateEvent(tweetCreateEvent)
      }
    )
    return
  }

  console.log(
    `Not sure how to process the following event: ${JSON.stringify(
      camelizedJson
    )}`
  )
  return
}

const parseEntitiesForUserMentionData = (
  entities: Entities,
  tweetText: string
): { userMentionIds: string; userMentions: string } | undefined => {
  if (entities.userMentions) {
    const userMentionIds = entities.userMentions
      .map((mention: UserMention) => mention.idStr)
      .join(' ')
      .trim()

    const userMentions = entities.userMentions
      .map((mention: UserMention) =>
        tweetText?.includes(mention.screenName) ? mention.screenName : ''
      )
      .join(' ')
      .trim()

    return {
      userMentionIds,
      userMentions,
    }
  }
  return undefined
}

const parseExtendedEntitiesForMediaUrls = (
  extendedEntities: { media: Media[] } | undefined
): string[] | undefined => {
  if (!extendedEntities) {
    return undefined
  }

  if (extendedEntities.media) {
    const mediaObjects = extendedEntities.media

    const urls = mediaObjects
      .map((mediaObject) =>
        mediaObject.type === 'photo' ? mediaObject.mediaUrlHttps : undefined
      )
      .filter((url): url is string => url !== undefined)

    return urls
  }
  return []
}

export default formPlateLookupTweets
