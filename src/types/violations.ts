import { Borough } from 'constants/boroughs'
import { HumanizedDescription } from 'constants/violationDescriptions'
import {
  FiscalYearDatabaseViolationName,
  OpenParkingAndCameraViolationName,
} from 'types/humanizedDescriptions'

type SummonsImageType = {
  url: string
  description: 'View Summons'
}

type FromDatabasesType = {
  endpoint: string
  name: string
}

export type RawFiscalYearDatabaseViolation = {
  dateFirstObserved?: string
  daysParkingInEffect?: string
  feetFromCurb?: string
  fromHoursInEffect?: string
  houseNumber?: string
  intersectingStreet?: string
  issueDate: string
  issuerCode?: string
  issuerCommand?: string
  issuerPrecinct?: string
  issuerSquad?: string
  issuingAgency: string
  lawSection?: string
  meterNumber?: string
  plateId: string
  plateType: string
  registrationState: string
  streetCode1?: string
  streetCode2?: string
  streetCode3?: string
  streetName?: string
  subDivision?: string
  summonsNumber: string
  toHoursInEffect?: string
  unregisteredVehicle?: string
  vehicleBodyType?: string
  vehicleColor?: string
  vehicleExpirationDate?: string
  vehicleMake?: string
  vehicleYear?: string
  violationCode?: FiscalYearDatabaseViolationName
  violationCounty?: string
  violationDescription?: FiscalYearDatabaseViolationName
  violationInFrontOfOr?: string
  violationInFrontOfOrOpposite?: string
  violationLegalCode?: string
  violationLocation?: string
  violationPostCode?: string
  violationPrecinct?: string
  violationTime: string
}

export type RawOpenParkingAndCameraViolation = {
  amountDue?: string
  county?: string
  fineAmount?: string
  interestAmount?: string
  issueDate: string
  issuingAgency: string
  judgmentEntryDate?: string
  licenseType: string
  paymentAmount?: string
  penaltyAmount?: string
  plate: string
  precinct?: string
  reductionAmount?: string
  state: string
  summonsImage?: SummonsImageType
  summonsNumber: string
  violation?: OpenParkingAndCameraViolationName
  violationTime: string
}

export type RawViolation =
  | RawFiscalYearDatabaseViolation
  | RawOpenParkingAndCameraViolation

export type Violation = {
  amountDue: number | undefined
  dateFirstObserved: string | undefined
  daysParkingInEffect: string | undefined
  feetFromCurb: string | undefined
  fineAmount: number | undefined
  fined: number | undefined
  formattedTime: string | null | undefined
  formattedTimeEastern: string | null | undefined
  formattedTimeUtc: string | null | undefined
  fromDatabases: FromDatabasesType[]
  fromHoursInEffect: string | undefined
  houseNumber: string | undefined
  humanizedDescription: HumanizedDescription
  interestAmount: number | undefined
  intersectingStreet: string | undefined
  issueDate: string
  issuerCode: string | undefined
  issuerCommand: string | undefined
  issuerPrecinct: number | undefined
  issuerSquad: string | undefined
  issuingAgency: string | undefined
  judgmentEntryDate: string | undefined
  lawSection: string | undefined
  location: string | undefined
  meterNumber: string | undefined
  outstanding: number | undefined
  paid: number | undefined
  paymentAmount: number | undefined
  penaltyAmount: number | undefined
  plateId: string
  plateType: string
  reduced: number | undefined
  reductionAmount: number | undefined
  registrationState: string
  streetCode1: string | undefined
  streetCode2: string | undefined
  streetCode3: string | undefined
  streetName: string | undefined
  subDivision: string | undefined
  summonsImage: SummonsImageType | undefined
  summonsNumber: string
  toHoursInEffect?: string
  unregisteredVehicle: string | undefined
  vehicleBodyType: string | undefined
  vehicleColor: string | undefined
  vehicleExpirationDate: string | undefined
  vehicleMake: string | undefined
  vehicleYear: string | undefined
  violationCode: string | undefined
  violationCounty: Borough
  violationInFrontOfOrOpposite: string | undefined
  violationLegalCode: string | undefined
  violationLocation: string | undefined
  violationPostCode: string | undefined
  violationPrecinct: number | undefined
  violationTime: string
}
