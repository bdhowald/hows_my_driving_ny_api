import { openParkingAndCameraViolationsEndpoint } from 'constants/endpoints'
import { Violation } from 'types/violations'
import { isPresent } from 'utils/typePredicates'

/**
 * OMerge duplicate violations records from different databases
 *
 * @param {Array<Violation>} violations - the possibly duplicated violations for this vehicle
 */
export const mergeDuplicateViolationRecords = (violations: Violation[]) => {
  const deduplicatedViolations: Violation[] = []

  violations.forEach((violation: Violation) => {
    const duplicates: Violation[] = deduplicatedViolations.filter(
      (otherViolation: Violation) => {
        return violation.summonsNumber == otherViolation.summonsNumber
      }
    )

    if (duplicates.length) {
      const duplicateViolationIndex = deduplicatedViolations.indexOf(
        duplicates[0]
      )
      const duplicateViolation = deduplicatedViolations[duplicateViolationIndex]

      deduplicatedViolations[duplicateViolationIndex] =
        mergeMultipleRecordsOfSameViolation(violation, duplicateViolation)
      return
    }

    deduplicatedViolations.push(violation)
  })

  return deduplicatedViolations
}

/**
 *
 */
const mergeMultipleRecordsOfSameViolation = (
  baseViolation: Violation,
  duplicateViolation: Violation
): Violation => {
  const violationIsFromOpenParkingAndCameraViolationDatabase =
    baseViolation.fromDatabases[0].endpoint ==
    openParkingAndCameraViolationsEndpoint

  if (violationIsFromOpenParkingAndCameraViolationDatabase) {
    // We want to prefer the fiscal year database properties
    // when those properties exist on both types of violations.
    const definedProperties = Object.fromEntries(
      Object.entries(duplicateViolation).filter(([_, value]) =>
        isPresent(value)
      )
    )

    const mergedViolation: Violation = {
      ...baseViolation,
      ...definedProperties,
      ...{
        fromDatabases: [
          ...duplicateViolation.fromDatabases,
          ...baseViolation.fromDatabases,
        ],
      },
    }

    return mergedViolation
  } else {
    const definedProperties = Object.fromEntries(
      Object.entries(baseViolation).filter(([_, value]) => isPresent(value))
    )

    const mergedViolation: Violation = {
      ...duplicateViolation,
      ...definedProperties,
      ...{
        fromDatabases: [
          ...baseViolation.fromDatabases,
          ...duplicateViolation.fromDatabases,
        ],
      },
    }

    return mergedViolation
  }
}

export default mergeDuplicateViolationRecords
