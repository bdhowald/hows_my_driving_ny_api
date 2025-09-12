import { Factory } from 'fishery'
import { DateTime } from 'luxon'

import { Borough } from 'constants/boroughs'
import { NEW_YORK_TIME_ZONE } from 'constants/locale'
import { HumanizedDescription } from 'constants/violationDescriptions'
import {
  RawFiscalYearDatabaseViolation,
  RawOpenParkingAndCameraViolation,
  Violation,
} from 'types/violations'

export const rawFiscalYearDatabaseViolationFactory =
  Factory.define<RawFiscalYearDatabaseViolation>(({ sequence }) => {
    return {
      dateFirstObserved: '0',
      daysParkingInEffect: 'BBBBBBB',
      feetFromCurb: '0',
      fromHoursInEffect: 'ALL',
      intersectingStreet: 'GUERLAIN',
      issueDate: '2023-06-09T00:00:00.000',
      issuerCode: '972773',
      issuerCommand: '0043',
      issuerPrecinct: '43',
      issuerSquad: '0000',
      issuingAgency: 'P',
      lawSection: '408',
      meterNumber: '-',
      plateId: 'KZH2758',
      plateType: 'PAS',
      registrationState: 'NY',
      streetCode1: '0',
      streetCode2: '0',
      streetCode3: '0',
      streetName: 'I/O TAYLOR AVE',
      subDivision: 'E5',
      summonsNumber: (1159000000 + sequence).toString(),
      toHoursInEffect: 'ALL',
      unregisteredVehicle: '0',
      vehicleBodyType: 'VAN',
      vehicleColor: 'BLUE',
      vehicleExpirationDate: '20250201',
      vehicleMake: 'HONDA',
      vehicleYear: '2006',
      violationCode: '67',
      violationCounty: 'BX',
      violationLocation: '0043',
      violationPrecinct: '43',
      violationTime: '0911A',
    }
  })

export const rawOpenParkingAndCameraViolationFactory =
  Factory.define<RawOpenParkingAndCameraViolation>(({ sequence }) => {
    return {
      amountDue: '0',
      county: 'BX',
      fineAmount: '165',
      interestAmount: '0',
      issueDate: '06/09/2023',
      issuingAgency: 'POLICE DEPARTMENT',
      licenseType: 'PAS',
      paymentAmount: '175',
      penaltyAmount: '10',
      plate: 'KZH2758',
      precinct: '043',
      reductionAmount: '0',
      state: 'NY',
      summonsImage: {
        url: 'http://nycserv.nyc.gov/NYCServWeb/ShowImage?searchID=VFZSRk1VOVVXWHBPZWsxNlRuYzlQUT09&locationName=_____________________',
        description: 'View Summons',
      },
      summonsNumber: (1159000000 + sequence).toString(),
      violation: 'PEDESTRIAN RAMP',
      violationTime: '09:11A',
    }
  })

export const violationFactory = Factory.define<Violation>(({ sequence }) => {
  const formattedTime = '2023-06-09T09:11'
  const violationInEasternTime = DateTime.fromISO(formattedTime, {
    zone: NEW_YORK_TIME_ZONE,
  })

  return {
    amountDue: 0,
    dateFirstObserved: '0',
    daysParkingInEffect: 'BBBBBBB',
    feetFromCurb: '0',
    fineAmount: 165,
    fined: 175,
    formattedTime: violationInEasternTime.toISO(),
    formattedTimeEastern: violationInEasternTime.toISO(),
    formattedTimeUtc: violationInEasternTime.toUTC().toISO(),
    fromDatabases: [
      {
        dataUpdatedAt: '2023-11-14T17:54:58.000Z',
        endpoint: 'https://data.cityofnewyork.us/resource/869v-vr48.json',
        name: 'Parking Violations Issued - Fiscal Year 2023',
      },
    ],
    fromHoursInEffect: 'ALL',
    houseNumber: undefined,
    humanizedDescription: 'Blocking Pedestrian Ramp' as HumanizedDescription,
    interestAmount: 0,
    intersectingStreet: 'GUERLAIN',
    issueDate: '2023-06-09T00:00:00.000',
    issuerCode: '972773',
    issuerCommand: '0043',
    issuerPrecinct: 43,
    issuerSquad: '0000',
    issuingAgency: 'P',
    judgmentEntryDate: undefined,
    lawSection: '408',
    location: 'I/o Taylor Avenue Guerlain',
    meterNumber: '-',
    outstanding: 0,
    paid: 175,
    paymentAmount: 175,
    penaltyAmount: 10,
    plateId: 'KZH2758',
    plateType: 'PAS',
    reduced: 0,
    reductionAmount: 0,
    registrationState: 'NY',
    sanitized: {
      issuingAgency: 'New York Police Department (NYPD)',
      vehicleBodyType: 'Van',
      violationStatus: undefined,
    },
    streetCode1: '0',
    streetCode2: '0',
    streetCode3: '0',
    streetName: 'I/O TAYLOR AVE',
    subDivision: 'E5',
    summonsImage: {
      url: 'http://nycserv.nyc.gov/NYCServWeb/ShowImage?searchID=VFZSRk1VOVVXWHBPZWsxNlRuYzlQUT09&locationName=_____________________',
      description: 'View Summons',
    },
    summonsNumber: `1159${sequence}`,
    toHoursInEffect: 'ALL',
    unregisteredVehicle: '0',
    vehicleBodyType: 'VAN',
    vehicleColor: 'BLUE',
    vehicleExpirationDate: '20250201',
    vehicleMake: 'HONDA',
    vehicleYear: '2006',
    violationCode: '67',
    violationCounty: 'Bronx' as Borough,
    violationInFrontOfOrOpposite: undefined,
    violationLegalCode: undefined,
    violationLocation: '0043',
    violationPostCode: undefined,
    violationPrecinct: 43,
    violationStatus: undefined,
    violationTime: '0911A',
  }
})
