import { Client as GoogleMapsClient } from '@googlemaps/google-maps-services-js'
import { getBoroughFromDatabaseGeocode } from 'utils/databaseQueries'

import getBoroughService from '.'

jest.mock('@googlemaps/google-maps-services-js')
jest.mock('services/databaseService')
jest.mock('utils/databaseQueries')

describe('getBoroughService', () => {
  beforeEach(() => {
    ;(getBoroughFromDatabaseGeocode as jest.Mock).mockReset()
    ;(GoogleMapsClient as jest.Mock).mockReset()
  })

  const address = '123 Fake Street'
  const loggingKey = '[summons_number=1234567890][vehicle=NY:ABC1234]'

  it("should return 'No Borough Available' if no address is given", async () => {
    expect(await getBoroughService(undefined, loggingKey)).toBe(
      'No Borough Available'
    )

    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(0)
  })

  it('should search the database for a geocode and return the result if so', async () => {
    const boroughFromDatabase = {
      borough: 'Brooklyn',
    }

    ;(getBoroughFromDatabaseGeocode as jest.Mock).mockResolvedValueOnce([
      boroughFromDatabase,
    ])

    expect(await getBoroughService(address, loggingKey)).toBe(
      boroughFromDatabase.borough
    )

    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(1)
  })

  describe('location types', () => {
    it('should handle intersection locations', async () => {
      const googleMapsGeocodeResponse = {
        data: {
          results: [
            {
              address_components: [
                {
                  long_name: 'Victory Boulevard & Clove Road',
                  short_name: 'Victory Blvd & Clove Rd',
                  types: ['intersection'],
                },
                {
                  long_name: 'Sunnyside',
                  short_name: 'Sunnyside',
                  types: ['neighborhood', 'political'],
                },
                {
                  long_name: 'Staten Island',
                  short_name: 'Staten Island',
                  types: ['political', 'sublocality', 'sublocality_level_1'],
                },
                {
                  long_name: 'Richmond County',
                  short_name: 'Richmond County',
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
                  long_name: '10301',
                  short_name: '10301',
                  types: ['postal_code'],
                },
              ],
              geometry: {
                location: {
                  lat: 40.6164004,
                  lng: -74.1035744,
                },
                location_type: 'GEOMETRIC_CENTER',
              },
              types: ['intersection'],
            },
          ],
        },
      }

      const googleMapsClient = {
        geocode: jest.fn(() => googleMapsGeocodeResponse),
      }

      ;(GoogleMapsClient as jest.Mock).mockReturnValueOnce(googleMapsClient)
      ;(getBoroughFromDatabaseGeocode as jest.Mock).mockResolvedValueOnce([])

      expect(await getBoroughService(address, loggingKey)).toBe('Staten Island')

      expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(
        1
      )
      expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledWith(
        address
      )

      expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledTimes(1)
      expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledWith({})
    })

    it('should handle street address locations', async () => {
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
                  long_name: 'Brooklyn',
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
              geometry: {
                location: {
                  lat: 40.6905415,
                  lng: -73.9925555,
                },
                location_type: 'ROOFTOP',
              },
              types: ['premise', 'street_address'],
            },
          ],
        },
      }

      const googleMapsClient = {
        geocode: jest.fn(() => googleMapsGeocodeResponse),
      }

      ;(GoogleMapsClient as jest.Mock).mockReturnValueOnce(googleMapsClient)
      ;(getBoroughFromDatabaseGeocode as jest.Mock).mockResolvedValueOnce([])

      expect(await getBoroughService(address, loggingKey)).toBe('Brooklyn')

      expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(
        1
      )
      expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledWith(
        address
      )

      expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledTimes(1)
      expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledWith({})
    })

    it('should not return a borough from a location that is not a street address or intersection', async () => {
      const googleMapsGeocodeResponse = {
        data: {
          results: [
            {
              address_components: [
                {
                  long_name: 'Clove Rd/Victory Blvd',
                  short_name: 'Clove Rd/Victory Blvd',
                  types: [
                    'establishment',
                    'point_of_interest',
                    'transit_station',
                  ],
                },
                {
                  long_name: 'Sunnyside',
                  short_name: 'Sunnyside',
                  types: ['neighborhood', 'political'],
                },
                {
                  long_name: 'Staten Island',
                  short_name: 'Staten Island',
                  types: ['political', 'sublocality', 'sublocality_level_1'],
                },
                {
                  long_name: 'Richmond County',
                  short_name: 'Richmond County',
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
              ],
              geometry: {
                location: {
                  lat: 40.616596,
                  lng: -74.103516,
                },
                location_type: 'GEOMETRIC_CENTER',
              },
              types: ['establishment', 'point_of_interest', 'transit_station'],
            },
          ],
        },
      }

      const googleMapsClient = {
        geocode: jest.fn(() => googleMapsGeocodeResponse),
      }

      ;(GoogleMapsClient as jest.Mock).mockReturnValueOnce(googleMapsClient)
      ;(getBoroughFromDatabaseGeocode as jest.Mock).mockResolvedValueOnce([])

      expect(await getBoroughService(address, loggingKey)).toBe(
        'No Borough Available'
      )

      expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(
        1
      )
      expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledWith(
        address
      )

      expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledTimes(1)
      expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledWith({})
    })
  })

  it('should only query Google once for an address if a repeat call is satisifed by the database', async () => {
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
            geometry: {
              location: {
                lat: 40.6905415,
                lng: -73.9925555,
              },
              location_type: 'ROOFTOP',
            },
            types: ['premise', 'street_address'],
          },
        ],
      },
    }

    const googleMapsClient = {
      geocode: jest.fn(() => googleMapsGeocodeResponse),
    }

    ;(GoogleMapsClient as jest.Mock).mockReturnValueOnce(googleMapsClient)
    ;(getBoroughFromDatabaseGeocode as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ borough: 'Brooklyn' }])

    // Call twice
    expect(await getBoroughService(address, loggingKey)).toBe(brooklyn)
    expect(await getBoroughService(address, loggingKey)).toBe(brooklyn)

    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(2)
    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledWith(
      address
    )

    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledTimes(1)
    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledWith({})
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
            geometry: {
              location: {
                lat: 40.6905415,
                lng: -73.9925555,
              },
              location_type: 'ROOFTOP',
            },
            types: ['premise', 'street_address'],
          },
        ],
      },
    }

    const googleMapsClient = {
      geocode: jest.fn(() => googleMapsGeocodeResponse),
    }

    ;(GoogleMapsClient as jest.Mock).mockReturnValueOnce(googleMapsClient)
    ;(getBoroughFromDatabaseGeocode as jest.Mock).mockResolvedValueOnce([])

    expect(await getBoroughService(address, loggingKey)).toBe(brooklyn)

    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(1)
    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledWith(
      address
    )

    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledTimes(1)
    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledWith({})
  })

  it('should return the first borough queried from Google as long as New York as the city is detected', async () => {
    const brooklyn = 'Brooklyn'
    const bronx = 'The Bronx'

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
            geometry: {
              location: {
                lat: 40.6905415,
                lng: -73.9925555,
              },
              location_type: 'ROOFTOP',
            },
            types: ['premise', 'street_address'],
          },
          {
            address_components: [
              {
                long_name: 'West 17th Street',
                short_name: 'W 17th St',
                types: ['route'],
              },
              {
                long_name: 'Manhattan',
                short_name: 'Manhattan',
                types: ['political', 'sublocality', 'sublocality_level_1'],
              },
              {
                long_name: 'New York',
                short_name: 'New York',
                types: ['locality', 'political'],
              },
              {
                long_name: 'New York County',
                short_name: 'New York County',
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
                long_name: '10011',
                short_name: '10011',
                types: ['postal_code'],
              },
              {
                long_name: '5001',
                short_name: '5001',
                types: ['postal_code_suffix'],
              },
            ],
            geometry: {
              location: { lat: 40.7424317, lng: -74.0026285 },
              location_type: 'ROOFTOP',
            },
            types: ['premise', 'street_address'],
          },
        ],
      },
    }

    const googleMapsClient = {
      geocode: jest.fn(() => googleMapsGeocodeResponse),
    }

    ;(GoogleMapsClient as jest.Mock).mockReturnValueOnce(googleMapsClient)
    ;(getBoroughFromDatabaseGeocode as jest.Mock).mockResolvedValueOnce([])

    expect(await getBoroughService(address, loggingKey)).toBe(brooklyn)

    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(1)
    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledWith(
      address
    )

    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledTimes(1)
    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledWith({})
  })

  it("should return 'Staten Island' if the retrieved geocode from the database is for Staten Island", async () => {
    const boroughFromDatabase = {
      borough: 'Staten Island',
    }

    ;(getBoroughFromDatabaseGeocode as jest.Mock).mockResolvedValueOnce([
      boroughFromDatabase,
    ])

    expect(await getBoroughService(address, loggingKey)).toBe(
      boroughFromDatabase.borough
    )

    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(1)
  })

  it("should return 'No Borough Available' if the returned 'borough' is not a real borough", async () => {
    const googleMapsGeocodeResponse = {
      data: {
        results: [
          {
            address_components: [
              {
                long_name: 'New York',
                short_name: 'NY',
                types: ['administrative_area_level_1', 'political'],
              },
              {
                long_name: 'Strong Island',
                short_name: 'Long Island',
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

    ;(GoogleMapsClient as jest.Mock).mockReturnValueOnce(googleMapsClient)
    ;(getBoroughFromDatabaseGeocode as jest.Mock).mockResolvedValueOnce([])

    expect(await getBoroughService(address, loggingKey)).toBe(
      'No Borough Available'
    )

    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(1)
    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledWith(
      address
    )

    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledTimes(1)
    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledWith({})
  })

  it("should return 'No Borough Available' if no Google result has borough-level data", async () => {
    const googleMapsGeocodeResponse = {
      data: {
        results: [
          {
            address_components: [
              {
                long_name: 'New York',
                short_name: 'NY',
                types: ['administrative_area_level_1', 'political'],
              },
            ],
          },
        ],
      },
    }

    const googleMapsClient = {
      geocode: jest.fn(() => googleMapsGeocodeResponse),
    }

    ;(GoogleMapsClient as jest.Mock).mockReturnValueOnce(googleMapsClient)
    ;(getBoroughFromDatabaseGeocode as jest.Mock).mockResolvedValueOnce([])

    expect(await getBoroughService(address, loggingKey)).toBe(
      'No Borough Available'
    )

    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(1)
    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledWith(
      address
    )

    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledTimes(1)
    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledWith({})
  })

  it("should return 'No Borough Available' if no Google result is a borough", async () => {
    const googleMapsGeocodeResponse = {
      data: {
        results: [
          {
            address_components: [
              {
                long_name: 'Not a Borough',
                short_name: 'Not a Borough',
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

    ;(GoogleMapsClient as jest.Mock).mockReturnValueOnce(googleMapsClient)
    ;(getBoroughFromDatabaseGeocode as jest.Mock).mockResolvedValueOnce([])

    expect(await getBoroughService(address, loggingKey)).toBe(
      'No Borough Available'
    )

    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(1)
    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledWith(
      address
    )

    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledTimes(1)
    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledWith({})
  })

  it("should return 'No Borough Available' if the Google result has no address data", async () => {
    const googleMapsGeocodeResponse = {
      data: {
        results: [
          {
            address_components: [],
          },
        ],
      },
    }

    const googleMapsClient = {
      geocode: jest.fn(() => googleMapsGeocodeResponse),
    }

    ;(GoogleMapsClient as jest.Mock).mockReturnValueOnce(googleMapsClient)
    ;(getBoroughFromDatabaseGeocode as jest.Mock).mockResolvedValueOnce([])

    expect(await getBoroughService(address, loggingKey)).toBe(
      'No Borough Available'
    )

    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(1)
    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledWith(
      address
    )

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

    ;(GoogleMapsClient as jest.Mock).mockReturnValueOnce(googleMapsClient)
    ;(getBoroughFromDatabaseGeocode as jest.Mock).mockResolvedValueOnce([])

    expect(await getBoroughService(address, loggingKey)).toBe(
      'No Borough Available'
    )

    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(1)
    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledWith(
      address
    )

    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledTimes(1)
    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledWith({})
  })

  it("should return 'No Borough Available' if the Google request errors", async () => {
    const consoleErrorSpy = jest.spyOn(global.console, 'error')

    const errorMessage = new Error('something broke')

    const googleMapsClient = {
      geocode: jest.fn(() => {
        throw errorMessage
      }),
    }

    ;(GoogleMapsClient as jest.Mock).mockReturnValueOnce(googleMapsClient)
    ;(getBoroughFromDatabaseGeocode as jest.Mock).mockResolvedValueOnce([])

    expect(await getBoroughService(address, loggingKey)).toBe(
      'No Borough Available'
    )

    expect(consoleErrorSpy).toHaveBeenCalledWith(errorMessage)

    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(1)
    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledWith(
      address
    )

    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledTimes(1)
    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledWith({})
  })
})
