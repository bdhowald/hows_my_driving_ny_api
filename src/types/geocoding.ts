import { AxiosResponse } from 'axios'

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

export interface GoogleApisAddressComponent {
  long_name: string
  short_name: string
  types: string[]
}

interface GoogleApisGeocodeGeometry {
  location: LatLngLiteral
  location_type: GoogleApisGeocodeGeometryLocationType
  viewport: GoogleApisGeocodeGeometryBounds
  bounds?: GoogleApisGeocodeGeometryBounds
}

interface GoogleApisGeocodeGeometryBounds {
  northeast: LatLngLiteral
  southwest: LatLngLiteral
}

enum GoogleApisGeocodeGeometryLocationType {
  Approximate = 'APPROXIMATE',
  GeometricCenter = 'GEOMETRIC_CENTER',
  RangeInterpolated = 'RANGE_INTERPOLATED',
  Rooftop = 'ROOFTOP',
}

export interface GoogleApisGeocodeResponse extends AxiosResponse {
  data: GoogleApisGeocodeResponseData
}

interface GoogleApisGeocodeResponseData {
  status: GoogleApisGeocodeResponseStatus
  results: GoogleApisGeocodeResult[]
  error_message?: string
}

enum GoogleApisGeocodeResponseStatus {
  InvalidRequest = 'INVALID_REQUEST',
  Ok = 'OK',
  OverQueryLimit = 'OVER_QUERY_LIMIT',
  RequestDenied = 'REQUEST_DENIED',
  UnknownError = 'UNKNOWN_ERROR',
  ZeroResults = 'ZERO_RESULTS',
}

export interface GoogleApisGeocodeResult {
  address_components: GoogleApisAddressComponent[]
  formatted_address: string
  geometry: GoogleApisGeocodeGeometry
  place_id: string
  types: string[]
  plus_code?: GoogleApisGeocodeResultPlusCode
  partial_match?: boolean
}

interface GoogleApisGeocodeResultPlusCode {
  compound_code: string
  global_code: string
}

interface LatLngLiteral {
  lat: number
  lng: number
}
