export type DatabaseGeocode = {
  borough: string
  geocoder_id: number
  geocoding_service: string,
  lookup_string: string
}

export type GeocodeQueryResult = {
  borough: DatabaseGeocode['borough']
}
