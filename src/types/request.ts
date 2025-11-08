import { HttpStatusCode } from 'axios'

import LookupSource from 'constants/lookupSources'
import LookupType from 'constants/lookupTypes'
import ApiLookupResult from 'types/apiLookup'


export type ExternalData = {
  existingLookupCreatedAt?: Date
  fingerprintId?: string | undefined
  lookupSource: LookupSource
  lookupType: LookupType
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
