import axios from 'axios'

import { Borough } from 'constants/boroughs'
import { Geocoder } from 'constants/geocoders'
import { GoogleApisAddressType } from 'constants/googleGeocoder'
import { GOOGLE_APIS_ENDPOINT } from 'constants/endpoints'
import {
  DatabaseGeocode,
  GeocodeQueryResult,
  GoogleApisAddressComponent,
  GoogleApisGeocodeResponse,
} from 'types/geocoding'
import {
  getBoroughFromDatabaseGeocode,
  insertGeocodeIntoDatabase,
} from 'utils/databaseQueries'

const BRONX_SHORT_NAME = 'Bronx'

class Mutex {
  mutex = Promise.resolve()

  lock = () =>
    new Promise((resolve) => {
      this.mutex = this.mutex.then(() => new Promise(resolve))
    })
}

const GEOCODE_MUTEX = new Mutex()

const NEW_YORK = 'New York'
const NEW_YORK_GOOGLE_PARAMS = `${NEW_YORK} NY`

const getBoroughService = async (
  streetAddress: string | undefined,
  loggingKey: string
): Promise<Borough> => {
  if (!streetAddress) {
    return Borough.NoBoroughAvailable
  }

  console.log(
    loggingKey,
    'Attempting to retrieve borough for lookup string',
    `'${streetAddress}'`
  )

  let potentialBorough: string | Borough | undefined

  console.log(
    loggingKey,
    `obtaining mutex for address search for ${streetAddress}`
  )

  // Request a lock guarding geocode search
  const unlock = (await GEOCODE_MUTEX.lock()) as () => Promise<unknown>

  console.log(
    loggingKey,
    `obtained mutex for address search for ${streetAddress}`
  )

  const boroughValues: string[] = Object.values(Borough)

  try {
    const result: GeocodeQueryResult[] = await getBoroughFromDatabaseGeocode(
      streetAddress
    )

    if (result.length) {
      console.log(
        loggingKey,
        `Retrieved geocode from database: '${result[0].borough}' for lookup string`,
        `'${streetAddress}' from original '${streetAddress}'`
      )
      potentialBorough = result[0].borough
    } else {
      console.log(
        loggingKey,
        'No geocode found in database for lookup string',
        `'${streetAddress}' from original '${streetAddress}'`
      )
      console.log(
        loggingKey,
        'Retrieving geocode from Google for lookup string',
        `'${streetAddress}' from original '${streetAddress}'`
      )
      const geocodeFromGoogle: DatabaseGeocode | undefined =
        await getGoogleGeocode(streetAddress, loggingKey)

      if (!geocodeFromGoogle) {
        console.log(
          loggingKey,
          'No borough detected from geocode for lookup string',
          `'${streetAddress}' from original '${streetAddress}'`
        )
        return Borough.NoBoroughAvailable
      }

      potentialBorough = geocodeFromGoogle.borough

      if (potentialBorough === BRONX_SHORT_NAME) {
        // Sometimes Google returns 'The Bronx' othertimes, 'Bronx'
        potentialBorough = Borough.Bronx
      }

      if (boroughValues.includes(potentialBorough)) {
        // Only insert geocode if it's for a borough.
        console.log(
          loggingKey,
          `${potentialBorough} detected from from geocode for lookup string`,
          `'${streetAddress}' from original '${streetAddress}'`
        )
        await insertGeocodeIntoDatabase(geocodeFromGoogle, loggingKey)
      } else {
        console.log(
          loggingKey,
          `${potentialBorough} detected form geocode for lookup string`,
          `'${streetAddress}' from original '${streetAddress}'`,
          `${potentialBorough} is not a borough, so skipping`
        )
      }
    }
  } finally {
    // release mutex
    unlock()

    console.log(
      loggingKey,
      `released mutex for address search for ${streetAddress}`
    )
  }

  if (boroughValues.includes(potentialBorough)) {
    return potentialBorough as Borough
  }

  return Borough.NoBoroughAvailable
}

const getGoogleGeocode = async (
  streetAddress: string,
  loggingKey: string
): Promise<DatabaseGeocode | undefined> => {
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
    const geocodeResponse: GoogleApisGeocodeResponse = await axios.get(
      GOOGLE_APIS_ENDPOINT,
      geocodingArguments
    )

    if (geocodeResponse.data.results?.length) {
      const firstStreetAddressOrIntersection =
        geocodeResponse.data.results.find(
          (result) =>
            result.types.includes(GoogleApisAddressType.StreetAddress) ||
            result.types.includes(GoogleApisAddressType.Intersection)
        )

      if (!firstStreetAddressOrIntersection?.address_components?.length) {
        console.log(
          loggingKey,
          'No geocode result or result has insufficient data'
        )
        return
      }

      const potentiallyNewYorkCity =
        firstStreetAddressOrIntersection.address_components.find(
          (addressComponent: GoogleApisAddressComponent) =>
            addressComponent.types.indexOf(
              GoogleApisAddressType.AdministrativeAreaLevel1
            ) !== -1
        )

      if (potentiallyNewYorkCity?.long_name !== NEW_YORK) {
        console.log(
          loggingKey,
          'Returned geocode from Google is not for New York City',
          `Returned city is '${potentiallyNewYorkCity?.long_name}'`
        )
        return
      }

      const potentialBorough =
        firstStreetAddressOrIntersection.address_components.find(
          (addressComponent: GoogleApisAddressComponent) =>
            addressComponent.types.indexOf(
              GoogleApisAddressType.Sublocality
            ) !== -1
        )

      if (!potentialBorough?.long_name) {
        console.log(
          loggingKey,
          'Returned geocode from Google does not have a borough'
        )
        return
      }

      const resultGeometry = firstStreetAddressOrIntersection.geometry

      const latitude = resultGeometry.location.lat
      const longitude = resultGeometry.location.lng
      const locationType = resultGeometry.location_type

      let shortName: string | undefined
      let fullName: string | undefined

      if (
        firstStreetAddressOrIntersection.types.includes(
          GoogleApisAddressType.StreetAddress
        )
      ) {
        // If street address, piece together from number and street name
        const streetNumber =
          firstStreetAddressOrIntersection.address_components.find(
            (component) =>
              component.types.includes(GoogleApisAddressType.StreetNumber)
          )
        const streetName =
          firstStreetAddressOrIntersection.address_components.find(
            (component) => component.types.includes(GoogleApisAddressType.Route)
          )

        if (streetName && streetNumber) {
          shortName = `${streetNumber.short_name} ${streetName.short_name}`
          fullName = `${streetNumber.long_name} ${streetName.long_name}`
        }
      } else if (
        firstStreetAddressOrIntersection.types.includes(
          GoogleApisAddressType.Intersection
        )
      ) {
        // If intersection, take straight from component
        const intersection =
          firstStreetAddressOrIntersection.address_components.find(
            (component) =>
              component.types.includes(GoogleApisAddressType.Intersection)
          )

        if (intersection) {
          shortName = intersection.short_name
          fullName = intersection.long_name
        }
      }

      return {
        borough: potentialBorough.long_name,
        fullName,
        geocoderId: Geocoder.Google,
        latitude,
        locationType: locationType,
        longitude,
        lookupString: `${streetAddress.trim()} ${NEW_YORK_GOOGLE_PARAMS}`,
        shortName,
      }
    }
    return
  } catch (error) {
    console.error(error)
    return
  }
}

export default getBoroughService
