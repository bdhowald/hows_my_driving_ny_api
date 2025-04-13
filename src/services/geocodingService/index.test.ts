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

  it("should return 'No Borough Available' if no address is given", async () => {
    expect(await getBoroughService(undefined)).toBe('No Borough Available')

    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(0)
  })

  it('should search the database for a geocode and return the result if so', async () => {
    const boroughFromDatabase = {
      borough: 'Brooklyn',
    }

    ;(getBoroughFromDatabaseGeocode as jest.Mock).mockResolvedValueOnce([boroughFromDatabase])

    expect(await getBoroughService(address)).toBe(boroughFromDatabase.borough)

    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(1)
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

    ;(GoogleMapsClient as jest.Mock).mockReturnValueOnce(googleMapsClient)
    ;(getBoroughFromDatabaseGeocode as jest.Mock).mockResolvedValueOnce([])

    expect(await getBoroughService(address)).toBe(brooklyn)

    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(1)
    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledWith(address)

    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledTimes(1)
    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledWith({})
  })

  it('should return the first borough queried from Google as long as New York as the city is detected', async () => {
    const brooklyn = 'Brooklyn'
    const bronx = 'Bronx'

    const googleMapsGeocodeResponse = {
      data: {
        results: [
          {
            address_components: [
              {
                long_name: 'New York',
                short_name: 'NY',
                types: [ 'administrative_area_level_1', 'political' ]
              },
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
                long_name: 'New York',
                short_name: 'NY',
                types: [ 'administrative_area_level_1', 'political' ]
              },
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

    ;(GoogleMapsClient as jest.Mock).mockReturnValueOnce(googleMapsClient)
    ;(getBoroughFromDatabaseGeocode as jest.Mock).mockResolvedValueOnce([])

    expect(await getBoroughService(address)).toBe(brooklyn)

    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(1)
    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledWith(address)

    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledTimes(1)
    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledWith({})
  })

  it("should return 'No Borough Available' if the returned 'borough' is not a real borough", async () => {
    const brooklyn = 'Brooklyn'
    const bronx = 'Bronx'

    const googleMapsGeocodeResponse = {
      data: {
        results: [
          {
            address_components: [
              {
                long_name: 'New York',
                short_name: 'NY',
                types: [ 'administrative_area_level_1', 'political' ]
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

    expect(await getBoroughService(address)).toBe('No Borough Available')

    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(1)
    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledWith(address)

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
                types: [ 'administrative_area_level_1', 'political' ]
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

    expect(await getBoroughService(address)).toBe('No Borough Available')

    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(1)
    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledWith(address)

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

    expect(await getBoroughService(address)).toBe('No Borough Available')

    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(1)
    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledWith(address)

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

    expect(await getBoroughService(address)).toBe('No Borough Available')

    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(1)
    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledWith(address)

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

    expect(await getBoroughService(address)).toBe('No Borough Available')

    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(1)
    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledWith(address)

    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledTimes(1)
    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledWith({})
  })

  it("should return 'No Borough Available' if the Google request errors", async () => {
    const consoleErrorSpy = jest.spyOn(global.console, 'error')

    const errorMessage = new Error('something broke')

    const googleMapsClient = {
      geocode: jest.fn(() => { throw errorMessage}),
    }

    ;(GoogleMapsClient as jest.Mock).mockReturnValueOnce(googleMapsClient)
    ;(getBoroughFromDatabaseGeocode as jest.Mock).mockResolvedValueOnce([])

    expect(await getBoroughService(address)).toBe('No Borough Available')

    expect(consoleErrorSpy).toHaveBeenCalledWith(errorMessage)

    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledTimes(1)
    expect(getBoroughFromDatabaseGeocode as jest.Mock).toHaveBeenCalledWith(address)

    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledTimes(1)
    expect(GoogleMapsClient as jest.Mock).toHaveBeenCalledWith({})
  })
})
