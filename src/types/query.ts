export type PreviousLookupAndFrequency = {
  frequency: number
  previousLookup: PreviousLookupResult | undefined
}

export type PreviousLookupResult = {
  createdAt: Date
  numViolations: number
}
