import { RawViolation } from 'types/violations'

const STREET_FIELD_MAX_LENGTH = 20

export default (violation: RawViolation): string | undefined => {
  const houseNumber: string | undefined =
    'houseNumber' in violation ? violation.houseNumber : undefined
  const street1: string | undefined =
    'streetName' in violation ? violation.streetName : undefined
  const street2: string | undefined =
    'intersectingStreet' in violation ? violation.intersectingStreet : undefined

  const fullAddress: string | undefined = gatherAddressParts(
    houseNumber,
    street1,
    street2
  )

  if (!fullAddress) {
    return undefined
  }

  const normalizedCapitalizedAddress = fullAddress
    .split(' ')
    .map((strPart) => strPart.toLowerCase())
    .map((strPart) => strPart.charAt(0).toUpperCase() + strPart.substr(1))
    .join(' ')

  return normalizedCapitalizedAddress
}

const gatherAddressParts = (
  houseNumber: string | undefined,
  street1: string | undefined,
  street2: string | undefined
) => {
  if (!street1) {
    return undefined
  }

  const street1NeedsTrailingPadding =
    street1.length !== STREET_FIELD_MAX_LENGTH ||
    street1.charAt(STREET_FIELD_MAX_LENGTH - 1) === ' '

  const street1WithTailingPaddingIfNeeded = street1NeedsTrailingPadding
    ? `${street1} `
    : street1

  const houseNumberIfExistsWithTailingPadding = houseNumber
    ? houseNumber.length == STREET_FIELD_MAX_LENGTH &&
      houseNumber.charAt(STREET_FIELD_MAX_LENGTH - 1) === ' '
      ? houseNumber
      : `${houseNumber} `
    : undefined

  if (street2 && houseNumber) {
    return `${houseNumberIfExistsWithTailingPadding}${street1WithTailingPaddingIfNeeded}${street2}`
  }

  if (street2) {
    return `${street1WithTailingPaddingIfNeeded}${street2}`
  }

  if (houseNumber) {
    return `${houseNumberIfExistsWithTailingPadding}${street1}`
  }

  return street1
}
