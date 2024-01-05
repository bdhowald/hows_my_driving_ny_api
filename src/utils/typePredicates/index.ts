export function isNumber(possibleNumber: any): possibleNumber is number {
  // Number(false) evaluates to 0 and Number(true) evaluates to 1
  return !!possibleNumber !== possibleNumber && !isNaN(Number(possibleNumber))
}

export function isPresent<T>(t: T | undefined | null | void): t is T {
  return t !== undefined && t !== null
}

export function objectHasKey<T>(obj: T, key: PropertyKey): key is keyof T {
  return Object.prototype.hasOwnProperty.call(obj, key)
}
