import { isNumber, isPresent, objectHasKey } from '.'

describe('isNumber', () => {
  describe('numbers', () => {
    it('should return true for an integer', () => {
      expect(isNumber(1)).toBe(true)
    })

    it('should return true for a float', () => {
      expect(isNumber(1.1)).toBe(true)
    })
  })

  describe('text representing a number', () => {
    it('should return true for text representing an integer', () => {
      expect(isNumber('1')).toBe(true)
    })

    it('should return true for text representing a float', () => {
      expect(isNumber('1.1')).toBe(true)
    })
  })

  describe('text not representing a number', () => {
    it('should return false for text not representing a number', () => {
      expect(isNumber('hi')).toBe(false)
    })

    it('should return false for NaN', () => {
      expect(isNumber(NaN)).toBe(false)
    })

    it('should return false for a boolean', () => {
      expect(isNumber(true)).toBe(false)
    })
  })
})

describe('isPresent', () => {
  describe('non-null, non-undefined objects', () => {
    it('should return true for text', () => {
      expect(isPresent('')).toBe(true)
    })

    it('should return true for a number', () => {
      expect(isPresent(1)).toBe(true)
    })

    it('should return true for a boolean', () => {
      expect(isPresent(false)).toBe(true)
    })

    it('should return true for an array', () => {
      expect(isPresent([])).toBe(true)
    })

    it('should return true for an object', () => {
      expect(isPresent({})).toBe(true)
    })
  })

  it('should return false for null', () => {
    expect(isPresent(null)).toBe(false)
  })

  it('should return false for undefined', () => {
    expect(isPresent(undefined)).toBe(false)
  })
})

describe('objectHasKey', () => {
  it('should return true if an object has a key', () => {
    const obj = { a: 1 }
    expect(objectHasKey(obj, 'a')).toBe(true)
  })

  it('should return true if an object has a key whose value is undefined', () => {
    const obj = { a: undefined }
    expect(objectHasKey(obj, 'a')).toBe(true)
  })

  it('should return true if an object has a key whose value is null', () => {
    const obj = { a: null }
    expect(objectHasKey(obj, 'a')).toBe(true)
  })

  it('should return false if an object does not have a key', () => {
    const obj = { a: null }
    expect(objectHasKey(obj, 'b')).toBe(false)
  })
})
