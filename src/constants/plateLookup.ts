import LookupSource from 'constants/lookupSources'

type PlateLookup = {
  bootEligibleUnderRdaaThreshold: boolean
  bootEligibleUnderDvaaThreshold: boolean,
  busLaneCameraViolations: number
  countTowardsFrequency: boolean
  createdAt: Date
  externalUsername: null
  fingerprintId: string | undefined
  lookupSource: LookupSource
  messageId: null
  mixpanelId: string | undefined
  numTickets: number
  observed: null
  plate: string
  plateTypes: string | null
  respondedTo: boolean
  redLightCameraViolations: number
  speedCameraViolations: number
  state: string
  uniqueIdentifier: string
}

export default PlateLookup