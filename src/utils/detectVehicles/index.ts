import plateTypesRegex from 'constants/plateTypes'
import regionsRegex from 'constants/regions'
import { PotentialVehicle } from 'types/vehicles'

const VALID_PLATE_PART_LENGTHS = [2, 3]

const detectPlateTypes = (potentialPlateTypeString: string) => {
  if (potentialPlateTypeString.indexOf(',') !== -1) {
    const parts = potentialPlateTypeString.split(',')
    const bools = parts.map(
      (part) => !!part.match(plateTypesRegex)
    )
    return bools.some((bool) => !!bool)
  } else {
    return !(potentialPlateTypeString.match(plateTypesRegex) == undefined)
  }
}

const detectState = (potentialStateString: string) =>
  !!potentialStateString.match(regionsRegex)

const detectVehicles = (potentialVehicles: string[]): PotentialVehicle[] => {
  return potentialVehicles.map((plate) => {
    const parts = plate.toUpperCase().trim().split(':').filter((part) => !!part)

    if (VALID_PLATE_PART_LENGTHS.includes(parts.length)) {
      const stateBools = parts.map((part) => detectState(part))
      const stateIndex = stateBools.indexOf(true)

      const plateTypesBools = parts.map((part) => detectPlateTypes(part))
      const plateTypesIndex = plateTypesBools.indexOf(true)

      const plateTypes = parts[plateTypesIndex]?.split(',')
        .filter((possiblePlateType) => detectPlateTypes(possiblePlateType))
        .sort()
        .join()

      const haveValidPlate =
        (parts.length === 2 && stateIndex != -1) ||
        (parts.length === 3 && ![plateTypesIndex, stateIndex].includes(-1))

      if (haveValidPlate) {
        const plateIndex = [...Array(parts.length).keys()].filter(
          (part) => ![stateIndex, plateTypesIndex].includes(part)
        )[0]

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