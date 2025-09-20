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
  error_message?: string
  response_token?: string
}

export type ExistingLookupResponse = {
  body?: ResponseBody
  etag?: string
  status_code: HttpStatusCode
}

export type VehicleResponse = {
  error?: string
  statusCode: HttpStatusCode
  successfulLookup: boolean
  vehicle?: ApiLookupResult
}
