import humps from 'humps'

// humps does't export its functions separately, so
// we have to import all of it and re-export the functions.

const camelize = humps.camelize
const camelizeKeys = humps.camelizeKeys
const decamelize = humps.decamelize

const decamelizeKeys = <T extends object>(obj: T): SnakeCaseKeys<T> => {
  return humps.decamelizeKeys(obj) as unknown as SnakeCaseKeys<T>
}

const decamelizeKeysOneLevel = (originalObject: any) => {
  if (
    typeof originalObject !== 'object' ||
    Array.isArray(originalObject) ||
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

type Decamelize<T extends string> = T extends `${infer First}${infer Rest}`
  ? Rest extends Uncapitalize<Rest> // Check if the next character is uppercase-ish / transition point
    ? `${Lowercase<First>}${Decamelize<Rest>}`
    : `${Lowercase<First>}_${Decamelize<Rest>}`
  : T

export type SnakeCaseKeys<T> = T extends Array<infer U>
  ? Array<SnakeCaseKeys<U>>
  : T extends object
  ? {
      [K in keyof T as K extends string ? Decamelize<K> : K]: SnakeCaseKeys<
        T[K]
      >
    }
  : T

export {
  camelize,
  camelizeKeys,
  decamelize,
  decamelizeKeys,
  decamelizeKeysOneLevel,
}
