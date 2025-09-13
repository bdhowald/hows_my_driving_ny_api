export type DatabaseGeocode = {
  borough: string
  geocoder_id: number
  lookup_string: string
}

export type GeocodeQueryResult = {
  borough: DatabaseGeocode['borough']
}
