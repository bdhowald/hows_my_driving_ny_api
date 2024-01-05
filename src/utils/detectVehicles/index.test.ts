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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
      ]
      const result = detectVehicles([potentialVehicle])

      expect(result).toEqual(expected)
    })

    it('should detect a valid plate and an invalid plate among two', () => {
      const invalidPlate = 'notaplate'
      const validPlate = 'abc1234:ny:pas'

      const potentialVehicles = [
        invalidPlate,
        validPlate,
      ]

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
  })

  describe('invalid plates', () => {
    it('should detect an invalid plate with an invalid state', () => {
      const potentialVehicle = 'abc1234:xx'

      const expected = [
        {
          originalString: potentialVehicle,
          validPlate: false,
        }
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
        }
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
        }
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
        }
      ]
      const result = detectVehicles([potentialVehicle])

      expect(result).toEqual(expected)
    })
  })
})