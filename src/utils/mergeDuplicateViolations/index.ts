import {
  NYC_OPEN_DATA_SOCRATA_SODA_V2_OPEN_PARKING_AND_CAMERA_VIOLATIONS_ENDPOINT,
  NYC_OPEN_DATA_SOCRATA_SODA_V3_OPEN_PARKING_AND_CAMERA_VIOLATIONS_ENDPOINT,
} from 'constants/endpoints'
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
  const violationIsFromOpenParkingAndCameraViolationDatabase = [
    NYC_OPEN_DATA_SOCRATA_SODA_V2_OPEN_PARKING_AND_CAMERA_VIOLATIONS_ENDPOINT,
    NYC_OPEN_DATA_SOCRATA_SODA_V3_OPEN_PARKING_AND_CAMERA_VIOLATIONS_ENDPOINT,
  ].includes(baseViolation.fromDatabases[0].endpoint)

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
        sanitized: {
          issuingAgency:
            duplicateViolation.sanitized.issuingAgency ??
            baseViolation.sanitized.issuingAgency,
          vehicleBodyType:
            duplicateViolation.sanitized.vehicleBodyType ??
            baseViolation.sanitized.vehicleBodyType,
          violationStatus:
            duplicateViolation.sanitized.violationStatus ??
            baseViolation.sanitized.violationStatus,
        },
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
        sanitized: {
          issuingAgency:
            baseViolation.sanitized.issuingAgency ??
            duplicateViolation.sanitized.issuingAgency,
          vehicleBodyType:
            baseViolation.sanitized.vehicleBodyType ??
            duplicateViolation.sanitized.vehicleBodyType,
          violationStatus:
            baseViolation.sanitized.violationStatus ??
            duplicateViolation.sanitized.violationStatus,
        },
      },
    }

    return mergedViolation
  }
}

export default mergeDuplicateViolationRecords
