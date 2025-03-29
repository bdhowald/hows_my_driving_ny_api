import { DateTime } from 'luxon'

import issuingAgencies from 'constants/agencies'
import boroughs, { Borough, precinctsByBorough } from 'constants/boroughs'
import {
  HumanizedDescription,
  humanizedDescriptionsForOpenParkingAndCameraViolations,
  humanizedDescriptionsForFiscalYearDatabaseViolations,
  violationsToCodes,
} from 'constants/violationDescriptions'
import {
  DatabasePathName,
  FISCAL_YEAR_PATHS_TO_DATABASE_NAMES_MAP,
  NYC_OPEN_DATA_PORTAL_HOST,
} from 'constants/endpoints'
import getBoroughService from 'services/geocodingService'
import { RawViolation, Violation } from 'types/violations'
import getFullAddress from 'utils/addressUtils'
import { camelizeKeys } from 'utils/camelize'
import { isNumber, objectHasKey } from 'utils/typePredicates'

const DATE_FORMAT = /^\d{2}\/\d{2}\/\d{4}$/
const FOUR_DIGIT_TIME_FORMAT = /\d{4}/
const FOUR_DIGIT_WITH_COLON_TIME_FORMAT = /\d{2}:\d{2}/

type ViolationMultipleDescriptionCode = { description: string; startDate: Date }

export default async (
  rawViolations: RawViolation[],
  requestPathname: string,
  dataUpdatedAt: string,
): Promise<Violation[]> => {
  const normalizedViolations = rawViolations.map(
    async (rawViolation) =>
      await normalizeViolation(rawViolation, requestPathname, dataUpdatedAt)
  )

  return Promise.all(normalizedViolations)
}

const getBorough = async (
  violation: RawViolation,
  fullAddress: string | undefined
): Promise<Borough> => {
  if ('violationCounty' in violation && violation.violationCounty) {
    return boroughs[violation.violationCounty]
  }

  if (
    'violationPrecinct' in violation &&
    isNumber(violation.violationPrecinct)
  ) {
    const violationPrecinct = parseInt(violation.violationPrecinct).toString()
    if (objectHasKey(precinctsByBorough, violationPrecinct)) {
      return precinctsByBorough[violationPrecinct]
    }
  }

  if ('county' in violation && violation.county) {
    return boroughs[violation.county]
  }

  if ('precinct' in violation && isNumber(violation.precinct)) {
    const precinct = parseInt(violation.precinct).toString()
    if (objectHasKey(precinctsByBorough, precinct)) {
      return precinctsByBorough[precinct]
    }
  }

  const potentialBorough: Borough = await getBoroughService(fullAddress)

  return potentialBorough
}

const getFineDataForViolation = (violation: RawViolation) => {
  const amountDue = 'amountDue' in violation ? violation.amountDue : undefined

  const fineAmount =
    'fineAmount' in violation ? violation.fineAmount : undefined

  const interestAmount =
    'interestAmount' in violation ? violation.interestAmount : undefined

  const paymentAmount =
    'paymentAmount' in violation ? violation.paymentAmount : undefined

  const penaltyAmount =
    'penaltyAmount' in violation ? violation.penaltyAmount : undefined

  const reductionAmount =
    'reductionAmount' in violation ? violation.reductionAmount : undefined

  let fined = fineAmount ?? penaltyAmount ?? interestAmount ? 0 : undefined

  if (isNumber(fined)) {
    if (isNumber(fineAmount)) {
      fined += parseFloat(fineAmount)
    }
    if (isNumber(penaltyAmount)) {
      fined += parseFloat(penaltyAmount)
    }
    if (isNumber(interestAmount)) {
      fined += parseFloat(interestAmount)
    }
  }

  const interest = isNumber(interestAmount)
    ? parseFloat(interestAmount)
    : undefined
  const originalFine = isNumber(fineAmount) ? parseFloat(fineAmount) : undefined
  const outstanding = isNumber(amountDue) ? parseFloat(amountDue) : undefined
  const paid = isNumber(paymentAmount) ? parseFloat(paymentAmount) : undefined
  const penalized = isNumber(penaltyAmount)
    ? parseFloat(penaltyAmount)
    : undefined
  const reduced = isNumber(reductionAmount)
    ? parseFloat(reductionAmount)
    : undefined

  return {
    amountDue: outstanding,
    fined,
    fineAmount: originalFine,
    interestAmount: interest,
    outstanding,
    paid,
    paymentAmount: paid,
    penaltyAmount: penalized,
    reduced,
    reductionAmount: reduced,
  }
}

/**
 * NYC Department of Finance (DOF) reuses violation codes over the years.
 * Using the cutover dates for several of these violation code changes
 * (inferred by some detective work), we can determine what the correct
 * description was at the time this violation was issued.
 * @param {string} violationCode - the NYC DOF code for this violation
 * @param {string | undefined} violationIssueDate - date violation was issued
 * @param {string | undefined} violationIssueTime - date violation was issued
 * @returns {string | null}
 */
const determineViolationFromViolationCodeAndDate = (
  violationCode: string,
  violationIssueDate: string,
  violationIssueTime: string,
) => {
  // The same violation codes or descriptions in the fiscal year
  // databases are used to refer to different violation types depending
  // on the date on which that code was used.

  const violationCodeDefinition:
    | HumanizedDescription
    | Array<ViolationMultipleDescriptionCode> =
    humanizedDescriptionsForFiscalYearDatabaseViolations[
      violationCode as keyof typeof humanizedDescriptionsForFiscalYearDatabaseViolations
    ]

  if (Array.isArray(violationCodeDefinition)) {
    // Iterate over the definitions to find the one that matches the
    // time period of the violation.

    let descriptionForUpdatedViolatedCode

    violationCodeDefinition.forEach(
      (possibleDescription: ViolationMultipleDescriptionCode) => {
        const violationDateTimes = getFormattedTimes(
          violationIssueDate,
          violationIssueTime,
        )
        if (
          violationDateTimes &&
          DateTime.fromJSDate(possibleDescription.startDate) <=
            violationDateTimes.formattedTimeUtc
        ) {
          descriptionForUpdatedViolatedCode = possibleDescription.description
        }
      }
    )

    if (descriptionForUpdatedViolatedCode) {
      return descriptionForUpdatedViolatedCode
    }

    throw Error(
      'Unrecognized time period for fiscal year violation description'
    )
  }

  return violationCodeDefinition
}

const getFormattedTimes = (
  violationDate: string,
  violationTime: string
):
  | undefined
  | {
      formattedTime: DateTime
      formattedTimeEastern: DateTime
      formattedTimeUtc: DateTime
    } => {
  if (!violationDate) {
    return undefined
  }

  let formattedTime: string | undefined

  const dateMatch = violationDate.match('T')
  const date = dateMatch ? violationDate.split('T')[0] : violationDate

  if (violationTime) {
    const isAM = violationTime.includes('A')
    const isPM = violationTime.includes('P')

    const fourDigitTimeMatch = violationTime.match(FOUR_DIGIT_TIME_FORMAT)
    const fourDigitWithColonTimeMatch = violationTime.match(
      FOUR_DIGIT_WITH_COLON_TIME_FORMAT
    )

    let hour: string | undefined = undefined
    let minute: string | undefined = undefined

    if (fourDigitTimeMatch) {
      // e.g. value is '0521P'
      hour = fourDigitTimeMatch[0].substring(0, 2)
      minute = fourDigitTimeMatch[0].substring(2, 4)
    } else if (fourDigitWithColonTimeMatch) {
      // e.g. value is '05:21P'
      hour = fourDigitWithColonTimeMatch[0].split(':')[0]
      minute = fourDigitWithColonTimeMatch[0].split(':')[1]
    } else {
      throw Error('Unexpected time format')
    }

    // Change 12-hour PM format to 24-hour format
    if (isPM && parseInt(hour) < 12) {
      // e.g. hour is '05' and time is PM
      hour = (parseInt(hour) + 12).toString()
    } else if (isAM && parseInt(hour) === 12) {
      // e.g. hour is '12' and time is AM
      hour = '00'
    }

    // If violation date in MM/DD/YYYY format
    if (date?.match(DATE_FORMAT)) {
      // replace slashes with dashes
      const [month, day, year] = date.split('/')

      formattedTime = `${year}-${month}-${day}T${hour}:${minute}`
    } else {
      formattedTime = `${date}T${hour}:${minute}`
    }
  } else {
    // If no time data, just assume midnight (Eastern).
    // replace slashes with dashes
    formattedTime = `${date.replace(/\//g, '-')}T00:00`
  }

  const violationTimeInEasternTime = DateTime.fromISO(formattedTime, {
    zone: 'America/New_York',
  })

  return {
    formattedTime: violationTimeInEasternTime,
    formattedTimeEastern: violationTimeInEasternTime,
    formattedTimeUtc: violationTimeInEasternTime.toUTC(),
  }
}

const getHumanizedDescription = (
  violation: RawViolation
): HumanizedDescription => {
  // Fiscal year database uses one of two fields to describe the violation
  const fiscalYearDescriptionKey =
    'violationDescription' in violation
      ? violation.violationDescription
      : 'violationCode' in violation
      ? violation.violationCode
      : undefined

  if (fiscalYearDescriptionKey) {
    // The same violation codes or descriptions in the fiscal year
    // databases are used to refer to different violation types depending
    // on the date on which that code was used.
    const violationCodeDefinition:
      | HumanizedDescription
      | Array<ViolationMultipleDescriptionCode> =
      humanizedDescriptionsForFiscalYearDatabaseViolations[
        fiscalYearDescriptionKey
      ]

    if (Array.isArray(violationCodeDefinition)) {
      // Iterate over the definitions to find the one that matches the
      // time period of the violation.

      let descriptionForUpdatedViolatedCode

      violationCodeDefinition.forEach(
        (possibleDescription: ViolationMultipleDescriptionCode) => {
          const violationDateTimes = getFormattedTimes(
            violation.issueDate,
            violation.violationTime
          )
          if (
            violationDateTimes &&
            DateTime.fromJSDate(possibleDescription.startDate) <=
              violationDateTimes.formattedTimeUtc
          ) {
            descriptionForUpdatedViolatedCode = possibleDescription.description
          }
        }
      )
      if (descriptionForUpdatedViolatedCode) {
        return descriptionForUpdatedViolatedCode
      }

      throw Error(
        'Unrecognized time period for fiscal year violation description'
      )
    }

    return violationCodeDefinition
  }

  // Open Parking & Camera Violations uses another
  const openParkingAndCameraViolationsDescriptionKey =
    'violation' in violation ? violation.violation : undefined

  if (openParkingAndCameraViolationsDescriptionKey) {

    const humanizedDescription: HumanizedDescription = humanizedDescriptionsForOpenParkingAndCameraViolations[
      openParkingAndCameraViolationsDescriptionKey
    ]

    const inferredViolationCode = violationsToCodes[
      humanizedDescription
    ]

    const inferredViolationDescription = determineViolationFromViolationCodeAndDate(
      inferredViolationCode,
      violation.issueDate,
      violation.violationTime,
    )

    if (inferredViolationDescription) {
      return inferredViolationDescription
    }

    return humanizedDescription
  }

  return HumanizedDescription.NoViolationDescriptionAvailable
}

const getPrecinct = (violation: RawViolation): number | undefined => {
  if ('violationPrecinct' in violation && violation.violationPrecinct) {
    return parseInt(violation.violationPrecinct)
  } else if ('precinct' in violation && violation.precinct) {
    return parseInt(violation.precinct)
  }
  return
}

const normalizeViolation = async (
  rawViolation: RawViolation,
  requestPathname: string,
  dataUpdatedAt: string,
): Promise<Violation> => {
  const violation = camelizeKeys(rawViolation) as RawViolation

  const humanizedDescription = getHumanizedDescription(violation)
  const precinct = getPrecinct(violation)
  const fullAddress = getFullAddress(violation)
  const violationCounty = await getBorough(violation, fullAddress)
  const fineData = getFineDataForViolation(violation)
  const formattedTimes = getFormattedTimes(
    violation.issueDate,
    violation.violationTime
  )

  const plateId = 'plateId' in violation ? violation.plateId : violation.plate

  const plateType =
    'plateType' in violation ? violation.plateType : violation.licenseType

  const registrationState =
    'registrationState' in violation
      ? violation.registrationState
      : violation.state

  const normalizedViolation: Violation = {
    amountDue: fineData.amountDue,
    dateFirstObserved:
      'dateFirstObserved' in violation
        ? violation.dateFirstObserved
        : undefined,
    daysParkingInEffect:
      'daysParkingInEffect' in violation
        ? violation.daysParkingInEffect
        : undefined,
    feetFromCurb:
      'feetFromCurb' in violation ? violation.feetFromCurb : undefined,
    fineAmount: fineData.fineAmount,
    fined: fineData.fined,
    formattedTime: formattedTimes?.formattedTime.toISO(),
    formattedTimeEastern: formattedTimes?.formattedTimeEastern.toISO(),
    formattedTimeUtc: formattedTimes?.formattedTimeUtc.toISO(),
    fromDatabases: [
      {
        dataUpdatedAt,
        endpoint: `${NYC_OPEN_DATA_PORTAL_HOST}${requestPathname}`,
        name: FISCAL_YEAR_PATHS_TO_DATABASE_NAMES_MAP[
          requestPathname as DatabasePathName
        ],
      },
    ],
    fromHoursInEffect:
      'fromHoursInEffect' in violation
        ? violation.fromHoursInEffect
        : undefined,
    houseNumber: 'houseNumber' in violation ? violation.houseNumber : undefined,
    humanizedDescription: humanizedDescription,
    interestAmount: fineData.interestAmount,
    intersectingStreet:
      'intersectingStreet' in violation
        ? violation.intersectingStreet
        : undefined,
    issueDate: violation.issueDate,
    issuerCode: 'issuerCode' in violation ? violation.issuerCode : undefined,
    issuerCommand:
      'issuerCommand' in violation ? violation.issuerCommand : undefined,
    issuerPrecinct:
      'issuerPrecinct' in violation && violation.issuerPrecinct
        ? parseInt(violation.issuerPrecinct)
        : undefined,
    issuerSquad: 'issuerSquad' in violation ? violation.issuerSquad : undefined,
    issuingAgency: violation.issuingAgency
      ? issuingAgencies[violation.issuingAgency]
      : undefined,
    judgmentEntryDate:
      'judgmentEntryDate' in violation
        ? violation.judgmentEntryDate
        : undefined,
    lawSection: 'lawSection' in violation ? violation.lawSection : undefined,
    location: fullAddress,
    meterNumber: 'meterNumber' in violation ? violation.meterNumber : undefined,
    outstanding: fineData.outstanding,
    paid: fineData.paid,
    paymentAmount: fineData.paymentAmount,
    penaltyAmount: fineData.penaltyAmount,
    plateId: plateId,
    plateType: plateType,
    reduced: fineData.reduced,
    reductionAmount: fineData.reductionAmount,
    registrationState: registrationState,
    streetCode1: 'streetCode1' in violation ? violation.streetCode1 : undefined,
    streetCode2: 'streetCode2' in violation ? violation.streetCode2 : undefined,
    streetCode3: 'streetCode3' in violation ? violation.streetCode3 : undefined,
    streetName: 'streetName' in violation ? violation.streetName : undefined,
    subDivision: 'subDivision' in violation ? violation.subDivision : undefined,
    summonsImage:
      'summonsImage' in violation ? violation.summonsImage : undefined,
    summonsNumber: violation.summonsNumber,
    toHoursInEffect:
      'toHoursInEffect' in violation ? violation.toHoursInEffect : undefined,
    unregisteredVehicle:
      'unregisteredVehicle' in violation
        ? violation.unregisteredVehicle
        : undefined,
    vehicleBodyType:
      'vehicleBodyType' in violation ? violation.vehicleBodyType : undefined,
    vehicleColor:
      'vehicleColor' in violation ? violation.vehicleColor : undefined,
    vehicleExpirationDate:
      'vehicleExpirationDate' in violation
        ? violation.vehicleExpirationDate
        : undefined,
    vehicleMake: 'vehicleMake' in violation ? violation.vehicleMake : undefined,
    vehicleYear: 'vehicleYear' in violation ? violation.vehicleYear : undefined,
    violationCode:
      humanizedDescription && violationsToCodes[humanizedDescription]
        ? violationsToCodes[humanizedDescription]
        : undefined,
    violationCounty: violationCounty,
    violationInFrontOfOrOpposite:
      'violationInFrontOfOrOpposite' in violation
        ? violation.violationInFrontOfOrOpposite
        : 'violationInFrontOfOr' in violation
          ? violation.violationInFrontOfOr
          : undefined,
    violationLegalCode:
      'violationLegalCode' in violation
        ? violation.violationLegalCode
        : undefined,
    violationLocation:
      'violationLocation' in violation
        ? violation.violationLocation
        : undefined,
    violationPostCode:
      'violationPostCode' in violation
        ? violation.violationPostCode
        : undefined,
    violationPrecinct: precinct,
    violationTime: violation.violationTime,
  }

  const sortedNormalizedViolation = Object.fromEntries(
    Object.entries(normalizedViolation).sort()
  ) as Violation

  return sortedNormalizedViolation
}
