import { Client as GoogleMapsClient } from '@googlemaps/google-maps-services-js'
import { instantiateConnection } from 'services/databaseService'

import getBoroughService from '.'

jest.mock('@googlemaps/google-maps-services-js')
jest.mock('services/databaseService')

describe('getBoroughService', () => {
  beforeEach(() => {
    ;(instantiateConnection as jest.Mock).mockReset()
    ;(GoogleMapsClient as jest.Mock).mockReset()
  })

  const address = '123 Fake Street'

  it("should return 'No Borough Available' if no address is given", async () => {
    expect(await getBoroughService(undefined)).toBe('No Borough Available')

    expect(instantiateConnection as jest.Mock).toHaveBeenCalledTimes(0)
  })

  it('should search the database for a geocode and return the result if so', async () => {
    const geocodeFromDatabase = {
      borough: 'Brooklyn',
      geocoding_service: 'google',
      lookup_string: '99 Schermerhorn Street New York NY',
    }

    const databaseConnection = {
      end: jest.fn(),
      query: jest.fn((_, __, callback) =>
        callback(null, [geocodeFromDatabase])
      ),
    }

    ;(instantiateConnection as jest.Mock).mockReturnValueOnce(
      databaseConnection
    )

    expect(await getBoroughService(address)).toBe(geocodeFromDatabase.borough)

    expect(instantiateConnection as jest.Mock).toHaveBeenCalledTimes(1)
  })

  it('should query Google for the borough if no database geocode and return one if it finds one', async () => {
    const brooklyn = 'Brooklyn'
    const googleMapsGeocodeResponse = {
      data: {
        results: [
          {
            address_components: [
              {
                long_name: '99',
                short_name: '99',
                types: ['street_number'],
              },
              {
                long_name: 'Schermerhorn Street',
                short_name: 'Schermerhorn St',
                types: ['route'],
              },
              {
                long_name: 'Downtown Brooklyn',
                short_name: 'Downtown Brooklyn',
                types: ['neighborhood', 'political'],
              },
              {
                long_name: brooklyn,
                short_name: 'Brooklyn',
                types: ['political', 'sublocality', 'sublocality_level_1'],
              },
              {
                long_name: 'Kings County',
                short_name: 'Kings County',
                types: ['administrative_area_level_2', 'political'],
              },
              {
                long_name: 'New York',
                short_name: 'NY',
                types: ['administrative_area_level_1', 'political'],
              },
              {
                long_name: 'United States',
                short_name: 'US',
                types: ['country', 'political'],
              },
              {
                long_name: '11201',
                short_name: '11201',
                types: ['postal_code'],
              },
            ],
          },
        ],
      },
    }

    const googleMapsClient = {
      geocode: jest.fn(() => googleMapsGeocodeResponse),
    }

    const databaseConnection = {
      end: jest.fn(),
      query: jest.fn((_, __, callback) => callback(null, [])),
    }

    ;(instantiateConnection as jest.Mock).mockReturnValueOnce(
      databaseConnection
    )
    ;(GoogleMapsClient as jest.Mock).mockReturnValueOnce(googleMapsClient)

    expect(await getBoroughService(address)).toBe(brooklyn)

    expect(instantiateConnection as jest.Mock).toHaveBeenCalledTimes(1)
    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledTimes(1)

    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledWith({})
  })

  it('should return the first borough queried from Google', async () => {
    const brooklyn = 'Brooklyn'
    const bronx = 'Bronx'

    const googleMapsGeocodeResponse = {
      data: {
        results: [
          {
            address_components: [
              {
                long_name: brooklyn,
                short_name: 'Brooklyn',
                types: ['political', 'sublocality', 'sublocality_level_1'],
              },
            ],
          },
          {
            address_components: [
              {
                long_name: bronx,
                short_name: 'Bronx',
                types: ['political', 'sublocality', 'sublocality_level_1'],
              },
            ],
          },
        ],
      },
    }

    const googleMapsClient = {
      geocode: jest.fn(() => googleMapsGeocodeResponse),
    }

    const databaseConnection = {
      end: jest.fn(),
      query: jest.fn((_, __, callback) => callback(null, [])),
    }

    ;(instantiateConnection as jest.Mock).mockReturnValueOnce(
      databaseConnection
    )
    ;(GoogleMapsClient as jest.Mock).mockReturnValueOnce(googleMapsClient)

    expect(await getBoroughService(address)).toBe(brooklyn)

    expect(instantiateConnection as jest.Mock).toHaveBeenCalledTimes(1)
    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledTimes(1)

    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledWith({})
  })

  it("should return 'No Borough Available' if no borough is found by Google", async () => {
    const googleMapsGeocodeResponse = {
      data: {
        results: [],
      },
    }

    const googleMapsClient = {
      geocode: jest.fn(() => googleMapsGeocodeResponse),
    }

    const databaseConnection = {
      end: jest.fn(),
      query: jest.fn((_, __, callback) => callback(null, [])),
    }

    ;(instantiateConnection as jest.Mock).mockReturnValueOnce(
      databaseConnection
    )
    ;(GoogleMapsClient as jest.Mock).mockReturnValueOnce(googleMapsClient)

    expect(await getBoroughService(address)).toBe('No Borough Available')

    expect(instantiateConnection as jest.Mock).toHaveBeenCalledTimes(1)
    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledTimes(1)

    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledWith({})
  })
})
