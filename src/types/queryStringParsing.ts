type ParsedQueryStringForApiLookup =
  | { error: string }
  | { potentialVehicles: string[] }

export default ParsedQueryStringForApiLookup