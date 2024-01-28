export type DatabaseGeocode = {
  borough: string
  geocoding_service: string
  lookup_string: string
}

export type GeocodeQueryResult = {
  borough: DatabaseGeocode['borough']
}
