import {
  humanizedDescriptionsForFiscalYearDatabaseViolations,
  humanizedDescriptionsForOpenParkingAndCameraViolations,
} from 'constants/violationDescriptions'

export type FiscalYearDatabaseViolationName =
  keyof typeof humanizedDescriptionsForFiscalYearDatabaseViolations

export type OpenParkingAndCameraViolationName =
  keyof typeof humanizedDescriptionsForOpenParkingAndCameraViolations
