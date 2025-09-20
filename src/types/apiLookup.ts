import { DateTime } from 'luxon'

import AggregateFineData from 'models/aggregateFineData'
import CameraData from 'types/cameraData'
import FrequencyData from 'types/frequencyData'
import { Violation } from 'types/violations'

type ApiLookupResult = {
  cameraStreakData: CameraData
  fines: AggregateFineData
  lookupDate: string | null | undefined
  lookupDateEastern: string | null | undefined
  lookupDateUtc: string | null | undefined
  plate: string
  plateTypes: string[] | undefined
  previousLookupDate: string | null | undefined
  previousLookupDateEastern: string | null | undefined
  previousLookupDateUtc: string | null | undefined
  previousViolationCount: number | undefined
  rectifiedPlate: string
  statistics: FrequencyData
  state: string
  timesQueried: number
  tweetParts: string[]
  uniqueIdentifier: string
  violations: Violation[]
  violationsCount: number
}

export default ApiLookupResult
