import { HttpStatusCode } from 'axios'

import LookupSource from 'constants/lookupSources'
import ApiLookupResult from 'types/apiLookup'

export type ExternalData = {
  existingLookupCreatedAt?: Date
  lookupSource: LookupSource
  fingerprintId?: string | undefined
  mixpanelId?: string | undefined
  uniqueIdentifier?: string
}

export type ResponseBody = {
  data?: VehicleResponse[]
  errorCode?: HttpStatusCode
  errorMessage?: string
  response_token?: string
}

export type VehicleResponse = {
  error?: string
  successfulLookup: boolean
  vehicle?: ApiLookupResult
}
