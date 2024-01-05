import { describe, expect, it } from '@jest/globals'

import { rawFiscalYearDatabaseViolationFactory } from '__fixtures__/violations'
import { RawViolation } from 'types/violations'

import getFullAddress from '.'

describe('addressUtils', () => {
  describe('construct the full address', () => {
    it('should when it has a houseNumber, streetName, and intersectingStreet', () => {
      const houseNumber = '1752'
      const streetName = 'PK AVE'
      const intersectingStreet = '122 ST'

      const rawFiscalYearDatabaseViolation: RawViolation =
        rawFiscalYearDatabaseViolationFactory.build({
          houseNumber,
          streetName,
          intersectingStreet,
        })

      const fullAddress = getFullAddress(rawFiscalYearDatabaseViolation)

      expect(fullAddress).toBe('1752 Pk Ave 122 St')
    })

    it('should when it has a houseNumber, streetName, and intersectingStreet, and streetName is 20 chars long', () => {
      const houseNumber = '114-52'
      const streetName = 'FRANCIS LEWIS BOULEV'
      const intersectingStreet = 'ARD'

      const rawFiscalYearDatabaseViolation: RawViolation =
        rawFiscalYearDatabaseViolationFactory.build({
          houseNumber,
          streetName,
          intersectingStreet,
        })

      const fullAddress = getFullAddress(rawFiscalYearDatabaseViolation)

      expect(fullAddress).toBe('114-52 Francis Lewis Boulevard')
    })

    it('should when it has a houseNumber, streetName, and intersectingStreet, and streetName is 19 chars long', () => {
      const houseNumber = '157'
      const streetName = 'ROCKAWAY BEACH BLVD'
      const intersectingStreet = 'JACOB RIIS PARK EAST'

      const rawFiscalYearDatabaseViolation: RawViolation =
        rawFiscalYearDatabaseViolationFactory.build({
          houseNumber,
          streetName,
          intersectingStreet,
        })

      const fullAddress = getFullAddress(rawFiscalYearDatabaseViolation)

      expect(fullAddress).toBe('157 Rockaway Beach Blvd Jacob Riis Park East')
    })

    it('should when it has a houseNumber and streetName, but no intersectingStreet', () => {
      const houseNumber = '51'
      const streetName = 'E 44TH ST'

      const rawFiscalYearDatabaseViolation: RawViolation =
        rawFiscalYearDatabaseViolationFactory.build({
          houseNumber,
          streetName,
          intersectingStreet: undefined,
        })

      const fullAddress = getFullAddress(rawFiscalYearDatabaseViolation)

      expect(fullAddress).toBe('51 E 44th St')
    })

    it('should when it has a streetName and intersectingStreet, but no houseNumber', () => {
      const streetName = 'C/O 126 ST'
      const intersectingStreet = '38 AVE'

      const rawFiscalYearDatabaseViolation: RawViolation =
        rawFiscalYearDatabaseViolationFactory.build({
          houseNumber: undefined,
          streetName,
          intersectingStreet,
        })

      const fullAddress = getFullAddress(rawFiscalYearDatabaseViolation)

      expect(fullAddress).toBe('C/o 126 St 38 Ave')
    })

    it('should when it has a streetName and intersectingStreet, but no houseNumber, and streetName is 20 chars long', () => {
      const streetName = 'E/S of WEST FARMS RO'
      const intersectingStreet = "AD 100' S/O EAST 173"

      const rawFiscalYearDatabaseViolation: RawViolation =
        rawFiscalYearDatabaseViolationFactory.build({
          houseNumber: undefined,
          streetName,
          intersectingStreet,
        })

      const fullAddress = getFullAddress(rawFiscalYearDatabaseViolation)

      expect(fullAddress).toBe("E/s Of West Farms Road 100' S/o East 173")
    })

    it('should when it has a streetName and intersectingStreet, but no houseNumber, and streetName is 19 chars long', () => {
      const streetName = 'MIDLAND BEACH LOT 6'
      const intersectingStreet = 'FATHER CAPODANNO BLV'

      const rawFiscalYearDatabaseViolation: RawViolation =
        rawFiscalYearDatabaseViolationFactory.build({
          houseNumber: undefined,
          streetName,
          intersectingStreet,
        })

      const fullAddress = getFullAddress(rawFiscalYearDatabaseViolation)

      expect(fullAddress).toBe('Midland Beach Lot 6 Father Capodanno Blv')
    })
  })
})
