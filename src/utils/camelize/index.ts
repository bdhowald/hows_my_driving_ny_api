import humps from 'humps'

// humps does't export its functions separately, so
// we have to import all of it and re-export the functions.

const camelize = humps.camelize
const camelizeKeys = humps.camelizeKeys
const decamelize = humps.decamelize
const decamelizeKeys = humps.decamelizeKeys

const decamelizeKeysOneLevel = (originalObject: any) => {
  if (
    !(typeof originalObject === 'object') &&
    Array.isArray(originalObject) &&
    originalObject === null
  ) {
    return originalObject
  }

  const keysToDecamelize = Object.keys(originalObject)
  const returnObject: Record<string | number, any> = {}
  keysToDecamelize.forEach(
    (key) => (returnObject[decamelize(key)] = originalObject[key])
  )

  return returnObject
}

export {
  camelize,
  camelizeKeys,
  decamelize,
  decamelizeKeys,
  decamelizeKeysOneLevel,
}
