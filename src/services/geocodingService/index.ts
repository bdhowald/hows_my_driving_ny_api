import {
  AddressComponent,
  AddressType,
  Client as GoogleMapsClient,
  GeocodeResponse,
} from '@googlemaps/google-maps-services-js'

import { Borough } from 'constants/boroughs'
import { DatabaseGeocode, GeocodeQueryResult } from 'types/geocoding'
import { getBoroughFromDatabaseGeocode, insertGeocodeIntoDatabase } from 'utils/databaseQueries'

const NEW_YORK = 'New York'
const NEW_YORK_GOOGLE_PARAMS = `${NEW_YORK} NY`

const instantiateGoogleMapsClient = () => new GoogleMapsClient({})

const getBoroughService = async (streetAddress: string | undefined, loggingKey: string): Promise<Borough> => {
  if (!streetAddress) {
    return Borough.NoBoroughAvailable
  }

  const streetWithoutDirections = streetAddress
    .replace(/[ENSW]\/?B/i, '')
    .trim()

  console.log(
    loggingKey,
    'Attempting to retrieve borough for lookup string',
    `'${streetWithoutDirections}'`
  )

  let potentialBorough: string | Borough | undefined

  const result: GeocodeQueryResult[] = await getBoroughFromDatabaseGeocode(
    streetWithoutDirections
  )

  if (result.length) {
    console.log(
      loggingKey,
      `Retrieved geocode from database: '${result[0].borough}' for lookup string`,
      `'${streetWithoutDirections}' from original '${streetAddress}'`
    )
    potentialBorough = result[0].borough
  } else {
    console.log(
      loggingKey,
      `No geocode found in database for lookup string`,
      `'${streetWithoutDirections}' from original '${streetAddress}'`
    )
    console.log(
      loggingKey,
      `Retrieving geocode from Google for lookup string`,
      `'${streetWithoutDirections}' from original '${streetAddress}'`
    )
    const geocodeFromGoogle: DatabaseGeocode | undefined =
      await getGoogleGeocode(streetWithoutDirections, loggingKey)

    if (!geocodeFromGoogle) {
      return Borough.NoBoroughAvailable
    }

    potentialBorough = geocodeFromGoogle.borough

    if (potentialBorough in Borough) {
      // Only insert geocode if it's for a borough.
      await insertGeocodeIntoDatabase(geocodeFromGoogle, loggingKey)
    }
  }

  if (potentialBorough in Borough) {
    return potentialBorough as Borough
  }

  return Borough.NoBoroughAvailable
}

const getGoogleGeocode = async (
  streetAddress: string,
  loggingKey: string
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

      if (!bestResponse?.address_components?.length) {
        console.log(
          loggingKey,
          'No geocode result or result has insufficient data'
        )
        return
      }

      const potentiallyNewYorkCity = bestResponse.address_components.find(
        (addressComponent: AddressComponent) =>
          addressComponent.types.indexOf(AddressType.administrative_area_level_1) !== -1
      )

      if (potentiallyNewYorkCity?.long_name !== NEW_YORK) {
        console.log(
          loggingKey,
          'Returned geocode from Google is not for New York City',
          `Returned city is '${potentiallyNewYorkCity?.long_name}'`
        )
        return
      }

      const potentialBorough = bestResponse.address_components.find(
        (addressComponent: AddressComponent) =>
          addressComponent.types.indexOf(AddressType.sublocality) !== -1
      )

      if (!potentialBorough?.long_name) {
        console.log(
          loggingKey,
          'Returned geocode from Google does not have a borough'
        )
        return
      }

      return {
        lookup_string: `${streetAddress.trim()} ${NEW_YORK_GOOGLE_PARAMS}`,
        borough: potentialBorough.long_name,
        geocoding_service: 'google',
      }
    }
    return
  } catch (error) {
    console.error(error)
    return
  }
}

export default getBoroughService
