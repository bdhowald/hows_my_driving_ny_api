import {
  AddressComponent,
  AddressType,
  Client as GoogleMapsClient,
  GeocodeResponse,
} from '@googlemaps/google-maps-services-js'

import { Borough } from 'constants/boroughs'
import { DatabaseGeocode, GeocodeQueryResult } from 'types/geocoding'
import { getBoroughFromDatabaseGeocode, insertGeocodeIntoDatabase } from 'utils/databaseQueries'

const NEW_YORK_GOOGLE_PARAMS = 'New York NY'

const instantiateGoogleMapsClient = () => new GoogleMapsClient({})

const getBoroughService = async (streetAddress: string | undefined): Promise<Borough> => {
  if (!streetAddress) {
    return Borough.NoBoroughAvailable
  }
  const streetWithoutDirections = streetAddress
    .replace(/[ENSW]\/?B/i, '')
    .trim()

  let potentialBorough: string | Borough | undefined

  const result: GeocodeQueryResult[] = await getBoroughFromDatabaseGeocode(
    streetWithoutDirections
  )

  if (result.length) {
    potentialBorough = result[0].borough
  } else {
    const geocodeFromGoogle: DatabaseGeocode | undefined =
      await getGoogleGeocode(streetWithoutDirections)

    if (!geocodeFromGoogle) {
      return Borough.NoBoroughAvailable
    }

    potentialBorough = geocodeFromGoogle.borough

    await insertGeocodeIntoDatabase(geocodeFromGoogle)
  }

  if (potentialBorough in Borough) {
    return potentialBorough as Borough
  }

  return Borough.NoBoroughAvailable
}

const getGoogleGeocode = async (
  streetAddress: string
): Promise<DatabaseGeocode | undefined> => {
  const googleMapsClient = instantiateGoogleMapsClient()

  const geocodingArguments = {
    params: {
      key: process.env.GOOGLE_PLACES_API_KEY ?? '',
      address: `${streetAddress} ${NEW_YORK_GOOGLE_PARAMS}`,
      components: {
        country: 'U.S.',
        locality: 'New York',
      },
    },
  }

  try {
    const geocodeResponse: GeocodeResponse = await googleMapsClient.geocode(
      geocodingArguments
    )

    if (geocodeResponse.data.results?.length) {
      const bestResponse = geocodeResponse.data.results[0]
      const potentialBorough = bestResponse.address_components.find(
        (addressComponent: AddressComponent) =>
          addressComponent.types.indexOf(AddressType.sublocality) !== -1
      )

      if (potentialBorough) {
        return {
          lookup_string: `${streetAddress.trim()} ${NEW_YORK_GOOGLE_PARAMS}`,
          borough: potentialBorough.long_name,
          geocoding_service: 'google',
        }
      }
    }
    return
  } catch (error) {
    console.error(error)
    return
  }
}

export default getBoroughService
