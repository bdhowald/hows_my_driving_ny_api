import { decamelizeKeysOneLevel } from '.'

describe('camelize', () => {
  describe('decamelizeKeysOneLevel', () => {
    it('should decamelize only the top level of an object', () => {
      const nestedObject = {
        topLevel: {
          middleLevel: {
            bottomLevel: 1
          }
        }
      }
  
      const expected = {
        top_level: {
          middleLevel: {
            bottomLevel: 1
          }
        }
      }
  
      const result = decamelizeKeysOneLevel(nestedObject)
      expect(result).toEqual(expected)
    })

    it('should not decamelize something that is not an object', () => {
      const notAnObject = [1,2,3]
  
      const result = decamelizeKeysOneLevel(notAnObject)
      expect(result).toEqual(notAnObject)
    })
  })
})