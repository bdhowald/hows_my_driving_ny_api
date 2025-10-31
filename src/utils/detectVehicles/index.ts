import plateTypesRegex from 'constants/plateTypes'
import regionsRegex from 'constants/regions'
import { PotentialVehicle } from 'types/vehicles'

const VALID_PLATE_PART_LENGTHS = [2, 3]

const detectPlateTypesIndex = (plateParts: string[]): number => {
  const plateTypesBools = plateParts.map((part) => detectPlateTypes(part))

  // More than one part could be plate types, gather those parts.
  const possiblePlateTypesIndices = plateTypesBools.flatMap((value, index) => (value ? [index] : []))

  if (possiblePlateTypesIndices.length > 1) {
    const indexOfPartWithComma = possiblePlateTypesIndices.find((possiblePlateTypesIndex) =>
      plateParts[possiblePlateTypesIndex].indexOf(',') !== -1
    )

    if (indexOfPartWithComma) {
      // If there's a comma in a part, it's probably the plate type.
      return indexOfPartWithComma
    } else {
      // With no heuristic to rely on, just use the first element.
      return 0
    }
  }

  return plateTypesBools.indexOf(true)
}

const detectPlateTypes = (potentialPlateTypeString: string) => {
  if (potentialPlateTypeString.indexOf(',') !== -1) {
    const parts = potentialPlateTypeString.split(',')
    const bools = parts.map((part) => !!part.match(plateTypesRegex))
    return bools.some((bool) => !!bool)
  } else {
    return !(potentialPlateTypeString.match(plateTypesRegex) == undefined)
  }
}

const detectState = (potentialStateString: string) =>
  !!potentialStateString.match(regionsRegex)

const detectVehicles = (potentialVehicles: string[]): PotentialVehicle[] => {
  return potentialVehicles.map((plate) => {
    const parts = plate
      .toUpperCase()
      .trim()
      .split(':')
      .filter((part) => !!part)

    if (VALID_PLATE_PART_LENGTHS.includes(parts.length)) {
      const stateBools = parts.map((part) => detectState(part))
      const stateIndex = stateBools.indexOf(true)
      const plateTypesIndex = detectPlateTypesIndex(parts)

      const plateTypes = parts[plateTypesIndex]
        ?.split(',')
        .filter((possiblePlateType) => detectPlateTypes(possiblePlateType))
        .sort()
        .join()

      const plateIndex = [...Array(parts.length).keys()].filter(
        (part) => ![stateIndex, plateTypesIndex].includes(part)
      )[0]

      const haveValidPlate =
        plateIndex !== undefined &&
        (parts.length === 2 && stateIndex != -1) ||
        (parts.length === 3 && ![plateTypesIndex, stateIndex].includes(-1))

      if (haveValidPlate) {
        return {
          originalString: plate,
          plate: parts[plateIndex],
          state: parts[stateIndex],
          types: plateTypes,
          validPlate: true,
        }
      }
    }

    return {
      originalString: plate,
      validPlate: false,
    }
  })
}

export default detectVehicles
