import QueryParser from '.'

describe('QueryParser', () => {
  describe('findFilterFields', () => {
    it("should return filter fields when 'fields' is present in query string", () => {
      const searchParams = new URLSearchParams(
        'plate=ABC1234:NY&fields=violations'
      )
      const queryParser = new QueryParser(searchParams)

      const expected = { violations: {} }

      const result = queryParser.findFilterFields()

      expect(result).toEqual(expected)
    })

    it("should return filter fields when 'fields' is an object with nested fields", () => {
      const searchParams = new URLSearchParams(
        'plate=ABC1234:NY&fields=violations(violation_code)'
      )
      const queryParser = new QueryParser(searchParams)

      const expected = { violations: { violation_code: {} } }

      const result = queryParser.findFilterFields()

      expect(result).toEqual(expected)
    })

    it("should return filter fields when 'fields' is an object with nested fields, even if nested fields are empty", () => {
      const searchParams = new URLSearchParams(
        'plate=ABC1234:NY&fields=violations()'
      )
      const queryParser = new QueryParser(searchParams)

      const expected = { violations: {} }

      const result = queryParser.findFilterFields()

      expect(result).toEqual(expected)
    })

    it("should return filter fields when 'fields' has multiple entries", () => {
      const searchParams = new URLSearchParams(
        'plate=ABC1234:NY&fields=violations(violation_code)&fields=times_queried&fields=unique_identifier'
      )
      const queryParser = new QueryParser(searchParams)

      const expected = { times_queried: {}, unique_identifier: {}, violations: { violation_code: {} } }

      const result = queryParser.findFilterFields()

      expect(result).toEqual(expected)
    })

    it("should return filter fields when 'fields' uses array-type query params", () => {
      const searchParams = new URLSearchParams(
        'plate=ABC1234:NY&fields[]=violations(violation_code)&fields[]=times_queried&fields[]=unique_identifier'
      )
      const queryParser = new QueryParser(searchParams)

      const expected = { times_queried: {}, unique_identifier: {}, violations: { violation_code: {} } }

      const result = queryParser.findFilterFields()

      expect(result).toEqual(expected)
    })

    it("should return filter fields when 'fields' uses comma-separated query params", () => {
      const searchParams = new URLSearchParams(
        'plate=ABC1234:NY&fields=violations(violation_code),times_queried,unique_identifier'
      )
      const queryParser = new QueryParser(searchParams)

      const expected = { times_queried: {}, unique_identifier: {}, violations: { violation_code: {} } }

      const result = queryParser.findFilterFields()

      expect(result).toEqual(expected)
    })

    it("should ignore individual filter fields when field cannot be understood", () => {
      const searchParams = new URLSearchParams(
        'plate=ABC1234:NY&fields=violations(.*.),times_queried,unique_identifier'
      )
      const queryParser = new QueryParser(searchParams)

      const expected = { times_queried: {}, unique_identifier: {} }

      const result = queryParser.findFilterFields()

      expect(result).toEqual(expected)
    })

    it("should return empty filter fields when 'fields' is missing from query string", () => {
      const searchParams = new URLSearchParams('plate=ABC1234:NY')
      const queryParser = new QueryParser(searchParams)

      const expected = {}

      const result = queryParser.findFilterFields()

      expect(result).toEqual(expected)
    })
  })

  describe('getAnalyticsData', () => {
    it('should return analytics fields from the query string if they exist', () => {
      const analyticsData = {
        fingerprintId: 'fingerprint',
        lookupSource: 'web_client',
        mixpanelId: 'abcdefgh12345678',
      }
      const searchParams = new URLSearchParams(analyticsData)
      const queryParser = new QueryParser(searchParams)

      const expected = analyticsData

      const result = queryParser.getAnalyticsData()

      expect(result).toEqual(expected)
    })

    it('should return undefined analytics fields from the query string if they do not exist', () => {
      const searchParams = new URLSearchParams({})
      const queryParser = new QueryParser(searchParams)

      const expected = {
        fingerprintId: undefined,
        lookupSource: undefined,
        mixpanelId: undefined,
      }

      const result = queryParser.getAnalyticsData()

      expect(result).toEqual(expected)
    })
  })

  describe('getPotentialVehicles', () => {
    describe('using legacy params', () => {
      it('should detect potential vehicles without plate types', () => {
        const searchParams = new URLSearchParams('plate_id=ABC1234&state=NY')
        const queryParser = new QueryParser(searchParams)

        const expected = {
          potentialVehicles: ['ABC1234:NY'],
        }

        const result = queryParser.getPotentialVehicles()

        expect(result).toEqual(expected)
      })

      it('should detect potential vehicles with plate types', () => {
        const searchParams = new URLSearchParams(
          'plate_id=ABC1234&state=NY&plate_types=PAS,COM'
        )
        const queryParser = new QueryParser(searchParams)

        const expected = {
          potentialVehicles: ['ABC1234:NY:PAS,COM'],
        }

        const result = queryParser.getPotentialVehicles()

        expect(result).toEqual(expected)
      })

      it('should detect potential vehicles with lower case values', () => {
        const searchParams = new URLSearchParams('plate_id=abc1234&state=ny')
        const queryParser = new QueryParser(searchParams)

        const expected = {
          potentialVehicles: ['abc1234:ny'],
        }

        const result = queryParser.getPotentialVehicles()

        expect(result).toEqual(expected)
      })

      it('should detect potential vehicles in either parameter order without plate types', () => {
        const searchParams = new URLSearchParams('state=NY&plate_id=ABC1234')
        const queryParser = new QueryParser(searchParams)

        const expected = {
          potentialVehicles: ['ABC1234:NY'],
        }

        const result = queryParser.getPotentialVehicles()

        expect(result).toEqual(expected)
      })

      it('should detect potential vehicles in either parameter order with plate types', () => {
        const searchParams = new URLSearchParams(
          'state=NY&plate_types=COM,PAS&plate_id=ABC1234'
        )
        const queryParser = new QueryParser(searchParams)

        const expected = {
          potentialVehicles: ['ABC1234:NY:COM,PAS'],
        }

        const result = queryParser.getPotentialVehicles()

        expect(result).toEqual(expected)
      })

      it('should return an error on multiple plate lookups', () => {
        const searchParams = new URLSearchParams(
          'plate_id=ABC1234&state=NY&plate_id=XYZ6789&state=NY'
        )
        const queryParser = new QueryParser(searchParams)

        const expected = {
          error:
            "To query multiple vehicles, use 'plate=<PLATE>:<STATE>', " +
            "ex: 'api.howsmydrivingny.nyc/api/v1?plate=abc1234:ny&plate=1234abc:nj'",
        }

        const result = queryParser.getPotentialVehicles()

        expect(result).toEqual(expected)
      })

      it('should return an error on multiple lookups when only state param appears twice', () => {
        const searchParams = new URLSearchParams(
          'plate_id=ABC1234&state=NY&state=CA'
        )
        const queryParser = new QueryParser(searchParams)

        const expected = {
          error:
            "To query multiple vehicles, use 'plate=<PLATE>:<STATE>', " +
            "ex: 'api.howsmydrivingny.nyc/api/v1?plate=abc1234:ny&plate=1234abc:nj'",
        }

        const result = queryParser.getPotentialVehicles()

        expect(result).toEqual(expected)
      })

      it('should return an error when given a plate without a state', () => {
        const searchParams = new URLSearchParams('plate_id=ABC1234')
        const queryParser = new QueryParser(searchParams)

        const expected = {
          error:
            "Missing state: use either 'plate=<PLATE>:<STATE>', ex: " +
            "'api.howsmydrivingny.nyc/api/v1?plate=abc1234:ny&plate=1234abc:nj', " +
            "or 'plate=<PLATE>&state=<STATE>', ex: " +
            "'api.howsmydrivingny.nyc/api/v1?plate=abc1234&state=ny'",
        }

        const result = queryParser.getPotentialVehicles()

        expect(result).toEqual(expected)
      })

      it('should return an error when given a state without a plate', () => {
        const searchParams = new URLSearchParams('state=NY')
        const queryParser = new QueryParser(searchParams)

        const expected = {
          error:
            "Missing plate: use either 'plate=<PLATE>:<STATE>', ex: " +
            "'api.howsmydrivingny.nyc/api/v1?plate=abc1234:ny&plate=1234abc:nj', " +
            "or 'plate=<PLATE>&state=<STATE>', ex: " +
            "'api.howsmydrivingny.nyc/api/v1?plate=abc1234&state=ny'",
        }

        const result = queryParser.getPotentialVehicles()

        expect(result).toEqual(expected)
      })
    })

    describe('using current-style params', () => {
      it('should detect potential vehicles without plate types', () => {
        const searchParams = new URLSearchParams('plate=ABC1234:NY')
        const queryParser = new QueryParser(searchParams)

        const expected = {
          potentialVehicles: ['ABC1234:NY'],
        }

        const result = queryParser.getPotentialVehicles()

        expect(result).toEqual(expected)
      })

      it('should detect potential vehicles with plate types', () => {
        const searchParams = new URLSearchParams('plate=ABC1234:NY:PAS,COM')
        const queryParser = new QueryParser(searchParams)

        const expected = {
          potentialVehicles: ['ABC1234:NY:PAS,COM'],
        }

        const result = queryParser.getPotentialVehicles()

        expect(result).toEqual(expected)
      })

      it('should detect potential vehicles with lower case values', () => {
        const searchParams = new URLSearchParams('plate=abc1234:ny')
        const queryParser = new QueryParser(searchParams)

        const expected = {
          potentialVehicles: ['abc1234:ny'],
        }

        const result = queryParser.getPotentialVehicles()

        expect(result).toEqual(expected)
      })

      it('should detect potential vehicles in any parameter order without plate types', () => {
        const searchParams = new URLSearchParams('plate=NY:ABC1234')
        const queryParser = new QueryParser(searchParams)

        const expected = {
          potentialVehicles: ['NY:ABC1234'],
        }

        const result = queryParser.getPotentialVehicles()

        expect(result).toEqual(expected)
      })

      it('should detect potential vehicles in any parameter order with plate types', () => {
        const searchParams = new URLSearchParams('plate=NY:COM,PAS:ABC1234')
        const queryParser = new QueryParser(searchParams)

        const expected = {
          potentialVehicles: ['NY:COM,PAS:ABC1234'],
        }

        const result = queryParser.getPotentialVehicles()

        expect(result).toEqual(expected)
      })

      it('should handle multiple plate lookups without plate types', () => {
        const searchParams = new URLSearchParams(
          'plate=ABC1234:NY&plate=XYZ6789:NY'
        )
        const queryParser = new QueryParser(searchParams)

        const expected = {
          potentialVehicles: ['ABC1234:NY', 'XYZ6789:NY'],
        }

        const result = queryParser.getPotentialVehicles()

        expect(result).toEqual(expected)
      })

      it('should handle multiple plate lookups with plate types', () => {
        const searchParams = new URLSearchParams(
          'plate=ABC1234:NY:COM&plate=XYZ6789:NY:PAS'
        )
        const queryParser = new QueryParser(searchParams)

        const expected = {
          potentialVehicles: ['ABC1234:NY:COM', 'XYZ6789:NY:PAS'],
        }

        const result = queryParser.getPotentialVehicles()

        expect(result).toEqual(expected)
      })
    })

    describe('mixing current-style and legacy params', () => {
      it('should return an error if both types of params are used', () => {
        const searchParams = new URLSearchParams(
          'plate_id=ABC1234&state=NY&plate=XYZ6789:NY'
        )
        const queryParser = new QueryParser(searchParams)

        const expected = {
          error:
            "Cannot use both 'plate' and 'plate_id'. Use either 'plate=<PLATE>:<STATE>', " +
            "ex: 'api.howsmydrivingny.nyc/api/v1?plate=abc1234:ny&plate=1234abc:nj', " +
            "or 'plate=<PLATE>&state=<STATE>', ex: 'api.howsmydrivingny.nyc/api/v1?plate=abc1234&state=ny'",
        }

        const result = queryParser.getPotentialVehicles()

        expect(result).toEqual(expected)
      })
    })

    it('should return an error if no current-style or legacy params', () => {
      const searchParams = new URLSearchParams('chocolate=7')
      const queryParser = new QueryParser(searchParams)

      const expected = {
        error:
          "To query a vehicle, use 'plate=<PLATE>:<STATE>', ex: " +
          "'api.howsmydrivingny.nyc/api/v1?plate=abc1234:ny&plate=1234abc:nj'",
      }

      const result = queryParser.getPotentialVehicles()

      expect(result).toEqual(expected)
    })
  })
})
