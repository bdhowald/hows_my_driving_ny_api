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

      expect(fullAddress).toBe('1752 Pk Avenue 122nd Street')
    })

    it('should when it has a houseNumber, streetName, and intersectingStreet, and houseNumber is 20 chars long with a trailing space', () => {
      const houseNumber = 'SUPEEER LONG STREET '
      const streetName = 'PK AVE'
      const intersectingStreet = '122 ST'

      const rawFiscalYearDatabaseViolation: RawViolation =
        rawFiscalYearDatabaseViolationFactory.build({
          houseNumber,
          streetName,
          intersectingStreet,
        })

      const fullAddress = getFullAddress(rawFiscalYearDatabaseViolation)

      expect(fullAddress).toBe('Supeeer Long Street Pk Avenue 122nd Street')
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

      expect(fullAddress).toBe('157 Rockaway Beach Boulevard Jacob Riis Park East')
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

      expect(fullAddress).toBe('51 East 44th Street')
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

      expect(fullAddress).toBe('C/o 126th Street 38th Avenue')
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

      expect(fullAddress).toBe("E/s of West Farms Road 100' south of East 173")
    })

    it('should when it has a streetName and intersectingStreet, but no houseNumber, and streetName is 20 chars long with a trailing period', () => {
      const streetName = 'OCEAN PKWY(N/B)@AVE.'
      const intersectingStreet = 'X-LN-3'

      const rawFiscalYearDatabaseViolation: RawViolation =
        rawFiscalYearDatabaseViolationFactory.build({
          houseNumber: undefined,
          streetName,
          intersectingStreet,
        })

      const fullAddress = getFullAddress(rawFiscalYearDatabaseViolation)

      expect(fullAddress).toBe('Ocean Parkway and Avenue X')
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

      expect(fullAddress).toBe('Midland Beach Lot 6 Father Capodanno Boulevard')
    })

    it('should when it only has a streetName', () => {
      const streetName = '72ND STREET'

      const rawFiscalYearDatabaseViolation: RawViolation =
        rawFiscalYearDatabaseViolationFactory.build({
          houseNumber: undefined,
          streetName,
          intersectingStreet: undefined,
        })

      const fullAddress = getFullAddress(rawFiscalYearDatabaseViolation)

      expect(fullAddress).toBe('72nd Street')
    })
  })
})
