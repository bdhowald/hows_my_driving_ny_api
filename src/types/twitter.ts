export type AccountActivityApiObject =
  | DirectMessageCreateAccountActivityApiObject
  | FavoriteAccountActivityApiObject
  | FollowAccountActivityApiObject
  | TweetCreateAccountActivityApiObject

type DerivedLocation = {
  country: string
  countryCode: string
  fullName: string
  geo: {
    coordinates: [number, number]
    type: string
  }
  locality: string
  region: string
  subregion: string
}

export type DirectMessageEvent = {
  createdTimestamp: string
  id: string
  messageCreate: {
    messageData: {
      attachment?: {
        media: MediaAttachment
      }
      entities: {
        hashtags: {
          indices: [number, number]
          text: string
        }[]
        urls: Url
        userMentions: UserMention[]
        symbols: SymbolObject[]
      }
      text: string
    }
    senderId: string
    sourceAppId: string
    target: {
      recipientId: string
    }
  }
  type: string
}

export type DirectMessageCreateAccountActivityApiObject = {
  apps: {
    [key: string]: {
      id: string
      name: string
      url: string
    }
  }
  directMessageEvents: DirectMessageEvent[]
  forUserId: string
  users: {
    [key: string]: {
      createdTimestamp: string
      description: string
      followersCount: number
      friendsCount: number
      id: string
      location: string
      name: string
      profileImageUrl: string
      profileImageUrlHttps: string
      protected: boolean
      screenName: string
      statusesCount: number
      url: string
      verified: boolean
    }
  }
}

export type Entities = {
  hashtags: {
    indices: [number, number]
    text: string
  }[]
  media?: [Media]
  polls: Poll[]
  urls: Url
  userMentions: UserMention[]
  symbols: SymbolObject[]
}

type FavoriteAccountActivityApiObject = {
  forUserId: string
  favoriteEvents: FavoriteEvent[]
}

export type FavoriteEvent = {
  createdAt: string
  favoritedStatus: Tweet
  id: string
  timestampMs: string
  user: User
}

type FollowAccountActivityApiObject = {
  forUserId: string
  followEvents: FollowEvent[]
}

export type FollowEvent = {
  createdTimestamp: string
  target: User
  source: User
  type: 'follow'
}

export type Media = {
  additionalMediaInfo: {
    description: string
    embeddable: boolean
    monetizable: boolean
    title: string
  }
  displayUrl: string
  expandedUrl: string
  id: number
  idStr: string
  indices: [number, number]
  mediaUrl: string
  mediaUrlHttps: string
  sizes: {
    large: MediaSize
    medium: MediaSize
    small: MediaSize
    thumb: MediaSize
  }
  sourceStatusId?: number
  sourceStatusIdStr?: string
  type: string
  url: string
  videoInfo?: {
    aspectRatio: [number, number]
    durationMillis: number
    variants: VideoVariant[]
  }
}

export type MediaAttachment = {
  mediaUrlHttps: string
  type: string
}

type MediaSize = {
  h: number
  resize: string
  w: number
}

type Place = {
  attributes: Object | null
  boundingBox: {
    coordinates: [[[number, number][]]]
    type: string
  }
  country: string
  countryCode: string
  fullName: string
  id: string
  name: string
  placeType: string
  url: string
}

type Poll = {
  durationMinutes: number
  endDatetime: string
  options: {
    position: number
    text: string
  }[]
}

type SymbolObject = {
  indices: [number, number]
  text: string
}

type Tweet = {
  coordinates: {
    coordinates: [number, number]
    type: string
  } | null
  createdAt: string
  currentUserRetweet?: {
    id: number
    idStr: string
  }
  displayTextRange?: [number, number]
  entities: Entities
  extendedEntities?: {
    media: Media[]
  }
  extendedTweet?: {
    displayTextRange: [number, number]
    entities: Entities
    extendedEntities?: {
      media: Media[]
    }
    fullText: string
  }
  favoriteCount?: number
  favorited: boolean
  filterLevel: string
  id: number
  idStr: string
  inReplyToScreenname: string | null
  inReplyToStatusId: string | null
  inReplyToStatusIdStr: string | null
  inReplyToUserId: string | null
  inReplyToUserIdStr: string | null
  isQuoteStatus: boolean
  lang: string
  matchingRules?: {
    id: number
    idStr: string
    tag: string
  }[]
  place: Place | null
  possiblySensitive?: boolean | null
  quoteCount?: number
  quotedStatus?: Tweet
  quotedStatusId?: number
  quotedStatusIdStr?: string
  replyCount: number
  retweeted: boolean
  retweetCount: number
  retweetedStatus?: Tweet
  scopes?: { [key: string]: any }
  source: string
  text: string
  truncated: boolean
  user: User
  withheldCopyright?: boolean
  withheldInCountries?: string[]
  withheldScope?: string
}

type TweetCreateAccountActivityApiObject = {
  forUserId: string
  tweetCreateEvents: TweetCreateEvent[]
}

export type TweetCreateEvent = Tweet & {
  timestampMs: string
}

export type TwitterDatabaseEvent = {
  createdAt: BigInt
  eventType: 'direct_message' | 'status'
  eventId: BigInt
  eventText: string
  id?: number
  inReplyToMessageId?: BigInt | undefined
  location: string | undefined
  respondedTo: boolean
  userHandle: string
  userId: BigInt
  userMentionIds?: string | undefined
  userMentions?: string | undefined
}

export type TwitterMediaObject = {
  id?: number
  twitterEventId?: string
  type: string
  url: string
}

type Url = {
  displayUrl: string
  expandedUrl: string
  indices: [number, number]
  unwound?: {
    description: string
    status: string
    title: string
    url: string
  }
  url: string
}

type User = {
  createdAt: string
  derived?: {
    locations: DerivedLocation[]
  }
  entities?: {
    url: {
      urls: [
        {
          displayUrl: string
          expandedUrl: string
          indices: [number, number]
          url: string
        }
      ]
    }
  }
  defaultProfile: boolean
  defaultProfileImage: boolean
  description: string | null
  favouritesCount: number
  followersCount: number
  friendsCount: number
  id: number
  idStr: string
  listedCount: number
  location: string | null
  name: string
  profileBannerUrl: string
  profileImageUrlHttps: string
  protected: boolean
  screenName: string
  statusesCount: number
  url: string | null
  verified: boolean
  withheldInCountries?: string[]
  withheldScope?: string
}

export type UserMention = {
  id: number
  idStr: string
  indices: [number, number]
  name: string
  screenName: string
}

type VideoVariant = {
  bitrate: number
  contentType: string
  url: string
}
