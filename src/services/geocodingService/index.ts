import {
  AddressComponent,
  AddressType,
  Client as GoogleMapsClient,
  GeocodeResponse,
} from '@googlemaps/google-maps-services-js'
import { Connection, MysqlError } from 'mysql'

import { Borough } from 'constants/boroughs'
import {
  closeConnectionHandler,
  instantiateConnection,
} from 'services/databaseService'

type DatabaseGeocode = {
  borough: string
  geocoding_service: string
  lookup_string: string
}

type GeocodeQueryResult = DatabaseGeocode & { id: number }

const NEW_YORK_GOOGLE_PARAMS = 'New York NY'

const instantiateGoogleMapsClient = () => new GoogleMapsClient({})

export default async (streetAddress: string | undefined): Promise<Borough> => {
  if (!streetAddress) {
    return Borough.NoBoroughAvailable
  }
  const streetWithoutDirections = streetAddress
    .replace(/[ENSW]\/?B/i, '')
    .trim()

  let potentialBorough: string | Borough | undefined

  const databaseConnection = instantiateConnection()

  const results: GeocodeQueryResult[] = await getGeocodeFromDatabase(
    databaseConnection,
    streetWithoutDirections
  )

  if (results.length) {
    potentialBorough = results[0].borough
  } else {
    const geocodeFromGoogle: DatabaseGeocode | undefined =
      await getGoogleGeocode(streetWithoutDirections)

    if (!geocodeFromGoogle) {
      return Borough.NoBoroughAvailable
    }

    potentialBorough = geocodeFromGoogle.borough

    await insertGeocodeIntoDatabase(databaseConnection, geocodeFromGoogle)
  }

  // Close database connection
  databaseConnection.end(closeConnectionHandler)

  if (potentialBorough in Borough) {
    return potentialBorough as Borough
  }

  return Borough.NoBoroughAvailable
}

const getGeocodeFromDatabase = async (
  connection: Connection,
  streetAddress: string
): Promise<GeocodeQueryResult[]> => {
  const geocodeSQLString =
    'select borough from geocodes WHERE lookup_string = ?'

  return new Promise((resolve, reject) => {
    const callback = (
      error: MysqlError | null,
      results?: GeocodeQueryResult[]
    ) => {
      if (error) {
        reject(error)
      }
      if (results) {
        resolve(results)
      }
    }

    const valuesString = [`${streetAddress} ${NEW_YORK_GOOGLE_PARAMS}`]

    return connection.query(geocodeSQLString, valuesString, callback)
  })
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

      if (potentialBorough && potentialBorough.long_name in Borough) {
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

const insertGeocodeIntoDatabase = async (
  connection: Connection,
  geocode: DatabaseGeocode
) => {
  connection.query('insert into geocodes set ?', geocode, (error) => {
    if (error) throw error
  })
}
