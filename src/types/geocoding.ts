export type DatabaseGeocode = {
  borough: string
  fullName?: string
  geocoderId: number
  latitude?: number
  locationType?: string
  longitude?: number
  lookupString: string
  shortName?: string
}

export type GeocodeQueryResult = {
  borough: DatabaseGeocode['borough']
}
