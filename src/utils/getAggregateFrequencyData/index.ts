import { Borough } from 'constants/boroughs'
import { HumanizedDescription } from 'constants/violationDescriptions'
import FrequencyData from 'types/frequencyData'
import { Violation } from 'types/violations'

/**
 * Gets stats for a lookup on borough, year, violation type frequency
 *
 * @param {Array<Violation>} violations - all the violations for a vehicle available in open data
 * @returns {FrequencyData}
 */
const getAggregateFrequencyData = (violations: Violation[]): FrequencyData => {
  const years: FrequencyData['years'] = {}
  const boroughs: FrequencyData['boroughs'] = {}
  const violationTypes: FrequencyData['violationTypes'] = {}

  violations.forEach((violation) => {
    const borough: Borough = violation.violationCounty

    if (boroughs[borough]) {
      ;(boroughs[borough] as number) += 1
    } else {
      boroughs[borough] = 1
    }

    const violationYear = violation.formattedTimeEastern
      ? new Date(violation.formattedTimeEastern).getFullYear().toString()
      : 'No Year Available'

    if (years[violationYear]) {
      years[violationYear] += 1
    } else {
      years[violationYear] = 1
    }

    const humanReadableViolationDescription: HumanizedDescription =
      violation.humanizedDescription ?? 'No Violation Description Available'

    if (violationTypes[humanReadableViolationDescription]) {
      ;(violationTypes[humanReadableViolationDescription] as number) += 1
    } else {
      violationTypes[humanReadableViolationDescription] = 1
    }
  })

  return {
    boroughs,
    violationTypes,
    years,
  }
}

export default getAggregateFrequencyData
