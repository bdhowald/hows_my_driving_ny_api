import AggregateFineData from 'models/aggregateFineData'
import CameraData from 'types/cameraData'
import FrequencyData from 'types/frequencyData'
import { Violation } from 'types/violations'

type ApiLookupResult = {
  cameraStreakData: CameraData
  fines: AggregateFineData
  lookupDate: Date
  plate: string
  plateTypes: string[] | undefined
  previousLookupDate: Date | undefined
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
