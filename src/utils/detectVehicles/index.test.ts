import plateTypesRegex from 'constants/plateTypes'

import detectVehicles from '.'

describe('detectVehicles', () => {
  describe('valid plates', () => {
    it('should detect a valid plate without plate types', () => {
      const potentialVehicle = 'abc1234:ny'

      const expected = [
        {
          originalString: potentialVehicle,
          plate: 'ABC1234',
          state: 'NY',
          types: undefined,
          validPlate: true,
        },
      ]
      const result = detectVehicles([potentialVehicle])

      expect(result).toEqual(expected)
    })

    it('should detect a valid plate with a single valid plate type', () => {
      const potentialVehicle = 'abc1234:ny:pas'

      const expected = [
        {
          originalString: potentialVehicle,
          plate: 'ABC1234',
          state: 'NY',
          types: 'PAS',
          validPlate: true,
        },
      ]
      const result = detectVehicles([potentialVehicle])

      expect(result).toEqual(expected)
    })

    it('should detect a valid plate with multiple valid plate types', () => {
      const potentialVehicle = 'abc1234:ny:pas,com'

      const expected = [
        {
          originalString: potentialVehicle,
          plate: 'ABC1234',
          state: 'NY',
          types: 'COM,PAS',
          validPlate: true,
        },
      ]
      const result = detectVehicles([potentialVehicle])

      expect(result).toEqual(expected)
    })

    it('should detect a valid plate with a mix of valid and invalid plate types', () => {
      const potentialVehicle = 'abc1234:ny:pas,pie'

      const expected = [
        {
          originalString: potentialVehicle,
          plate: 'ABC1234',
          state: 'NY',
          types: 'PAS',
          validPlate: true,
        },
      ]
      const result = detectVehicles([potentialVehicle])

      expect(result).toEqual(expected)
    })

    it('should detect a valid plate with plate types regardless of order', () => {
      const potentialVehicle = 'com,pas:abc1234:ny'

      const expected = [
        {
          originalString: potentialVehicle,
          plate: 'ABC1234',
          state: 'NY',
          types: 'COM,PAS',
          validPlate: true,
        },
      ]
      const result = detectVehicles([potentialVehicle])

      expect(result).toEqual(expected)
    })

    it('should detect a valid plate when multiple parts of the plate match plate type codes', () => {
      const potentialVehicle = 'cbs:cbs:ny'

      const expected = [
        {
          originalString: potentialVehicle,
          plate: 'CBS',
          state: 'NY',
          types: 'CBS',
          validPlate: true,
        },
      ]
      const result = detectVehicles([potentialVehicle])

      expect(result).toEqual(expected)
    })

    it('should detect a valid plate with a trailing colon', () => {
      const potentialVehicle = 'abc1234:ny:'

      const expected = [
        {
          originalString: potentialVehicle,
          plate: 'ABC1234',
          state: 'NY',
          types: undefined,
          validPlate: true,
        },
      ]
      const result = detectVehicles([potentialVehicle])

      expect(result).toEqual(expected)
    })

    it('should detect a valid plate with plate types regardless of alphabetization', () => {
      const potentialVehicle = 'cOm,PaS:aBc1234:Ny'

      const expected = [
        {
          originalString: potentialVehicle,
          plate: 'ABC1234',
          state: 'NY',
          types: 'COM,PAS',
          validPlate: true,
        },
      ]
      const result = detectVehicles([potentialVehicle])

      expect(result).toEqual(expected)
    })

    it('should detect a valid plate and an invalid plate among two', () => {
      const invalidPlate = 'notaplate'
      const validPlate = 'abc1234:ny:pas'

      const potentialVehicles = [invalidPlate, validPlate]

      const expected = [
        {
          originalString: invalidPlate,
          validPlate: false,
        },
        {
          originalString: validPlate,
          plate: 'ABC1234',
          state: 'NY',
          types: 'PAS',
          validPlate: true,
        },
      ]
      const result = detectVehicles(potentialVehicles)

      expect(result).toEqual(expected)
    })

    it('should detect a valid plate with two parts, a state and another value that could be a plate type, but will be treated as the plate', () => {
      const potentialVehicle = 'nyc:ny'

      const expected = [
        {
          originalString: potentialVehicle,
          plate: 'NYC',
          state: 'NY',
          types: undefined,
          validPlate: true,
        },
      ]
      const result = detectVehicles([potentialVehicle])

      expect(result).toEqual(expected)
    })

    it('should detect a valid plate with three parts, a state and two values that could each be a plate type', () => {
      const potentialVehicle = 'nyc:ny:agr'

      const expected = [
        {
          originalString: potentialVehicle,
          plate: 'AGR',
          state: 'NY',
          types: 'NYC',
          validPlate: true,
        },
      ]
      const result = detectVehicles([potentialVehicle])

      expect(result).toEqual(expected)
    })

    describe('plate types', () => {
      const plate = 'abc1234'
      const state = 'ny'
      const cases = plateTypesRegex.source
        .toLowerCase().split(/[\^\$\(\)\|]/)
        .filter((stringPart) => !!stringPart)

      test.each(cases)(
        `given ${plate}:${state}:%s as input, successfully detects a plate with plate types`,
        (plateType) => {
          const potentialVehicle = `${plate}:${state}:${plateType}`

          const expected = [
            {
              originalString: potentialVehicle,
              plate: 'ABC1234',
              state: 'NY',
              types: plateType.toUpperCase(),
              validPlate: true,
            },
          ]
          const result = detectVehicles([potentialVehicle])

          expect(result).toEqual(expected)
        }
      )
    })
  })

  describe('invalid plates', () => {
    it('should detect an invalid plate with an invalid state', () => {
      const potentialVehicle = 'abc1234:xx'

      const expected = [
        {
          originalString: potentialVehicle,
          validPlate: false,
        },
      ]
      const result = detectVehicles([potentialVehicle])

      expect(result).toEqual(expected)
    })

    it('should detect an invalid plate with an invalid plate type', () => {
      const potentialVehicle = 'abc1234:ny:pie'

      const expected = [
        {
          originalString: potentialVehicle,
          validPlate: false,
        },
      ]
      const result = detectVehicles([potentialVehicle])

      expect(result).toEqual(expected)
    })

    it('should detect an invalid plate with fewer than two parts', () => {
      const potentialVehicle = 'abc1234'

      const expected = [
        {
          originalString: potentialVehicle,
          validPlate: false,
        },
      ]
      const result = detectVehicles([potentialVehicle])

      expect(result).toEqual(expected)
    })

    it('should detect an invalid plate with nothing but colons', () => {
      const potentialVehicle = ':::'

      const expected = [
        {
          originalString: potentialVehicle,
          validPlate: false,
        },
      ]
      const result = detectVehicles([potentialVehicle])

      expect(result).toEqual(expected)
    })
  })
})
