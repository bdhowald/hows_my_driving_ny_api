import { DateTime } from 'luxon'

import getBoroughService from 'services/geocodingService'

import {
  rawFiscalYearDatabaseViolationFactory,
  rawOpenParkingAndCameraViolationFactory,
} from '__fixtures__/violations'
import { RawViolation } from 'types/violations'

import normalizeViolations from '.'

jest.mock('services/geocodingService')

describe('normalizeViolations', () => {
  const formattedTime = DateTime.fromISO('2023-06-09T09:11:00', {
    zone: 'America/New_York',
  })

  it('should normalize a fiscal year database violation', async () => {
    const databasePathname = '/resource/869v-vr48.json'

    const rawFiscalYearDatabaseViolation: RawViolation =
      rawFiscalYearDatabaseViolationFactory.build()

    const expectedViolation = {
      ...rawFiscalYearDatabaseViolation,
      amountDue: undefined,
      fineAmount: undefined,
      fined: undefined,
      formattedTime: formattedTime.toISO(),
      formattedTimeEastern: formattedTime.toISO(),
      formattedTimeUtc: formattedTime.toUTC().toISO(),
      fromDatabases: [
        {
          endpoint: `https://data.cityofnewyork.us${databasePathname}`,
          name: 'Parking Violations Issued - Fiscal Year 2023',
        },
      ],
      houseNumber: undefined,
      humanizedDescription: 'Blocking Pedestrian Ramp',
      interestAmount: undefined,
      issuerPrecinct: 43,
      issuingAgency: 'NYPD',
      judgmentEntryDate: undefined,
      location: 'I/o Taylor Ave Guerlain',
      outstanding: undefined,
      paid: undefined,
      paymentAmount: undefined,
      penaltyAmount: undefined,
      reduced: undefined,
      reductionAmount: undefined,
      summonsImage: undefined,
      violationCounty: 'Bronx',
      violationInFrontOfOrOpposite: undefined,
      violationLegalCode: undefined,
      violationPostCode: undefined,
      violationPrecinct: 43,
    }

    const normalizedViolations = await normalizeViolations(
      [rawFiscalYearDatabaseViolation],
      databasePathname
    )

    expect(normalizedViolations[0]).toEqual(expectedViolation)
  })

  it('should normalize an Open Parking and Camera Violations database violation', async () => {
    const databasePathname = '/resource/uvbq-3m68.json'

    const rawOpenParkingAndCameraViolation =
      rawOpenParkingAndCameraViolationFactory.build()

    const normalizedViolations = await normalizeViolations(
      [rawOpenParkingAndCameraViolation],
      databasePathname
    )

    const {
      county,
      licenseType,
      plate,
      precinct,
      state,
      violation,
      ...rawOpenParkingAndCameraViolationMinusRemovedFields
    } = rawOpenParkingAndCameraViolation

    const expectedViolation = {
      ...rawOpenParkingAndCameraViolationMinusRemovedFields,
      amountDue: 0,
      dateFirstObserved: undefined,
      daysParkingInEffect: undefined,
      feetFromCurb: undefined,
      fineAmount: 165,
      fined: 175,
      formattedTime: formattedTime.toISO(),
      formattedTimeEastern: formattedTime.toISO(),
      formattedTimeUtc: formattedTime.toUTC().toISO(),
      fromDatabases: [
        {
          endpoint: `https://data.cityofnewyork.us${databasePathname}`,
          name: 'Open Parking and Camera Violations',
        },
      ],
      fromHoursInEffect: undefined,
      houseNumber: undefined,
      humanizedDescription: 'Blocking Pedestrian Ramp',
      interestAmount: 0,
      intersectingStreet: undefined,
      issuerCode: undefined,
      issuerCommand: undefined,
      issuerPrecinct: undefined,
      issuerSquad: undefined,
      issuingAgency: 'NYPD',
      judgmentEntryDate: undefined,
      lawSection: undefined,
      location: undefined,
      meterNumber: undefined,
      outstanding: 0,
      paid: 175,
      paymentAmount: 175,
      penaltyAmount: 10,
      plateId: 'KZH2758',
      plateType: 'PAS',
      reduced: 0,
      reductionAmount: 0,
      registrationState: 'NY',
      streetCode1: undefined,
      streetCode2: undefined,
      streetCode3: undefined,
      streetName: undefined,
      subDivision: undefined,
      toHoursInEffect: undefined,
      unregisteredVehicle: undefined,
      vehicleBodyType: undefined,
      vehicleColor: undefined,
      vehicleExpirationDate: undefined,
      vehicleMake: undefined,
      vehicleYear: undefined,
      violationCode: '67',
      violationCounty: 'Bronx',
      violationInFrontOfOrOpposite: undefined,
      violationLegalCode: undefined,
      violationLocation: undefined,
      violationPostCode: undefined,
      violationPrecinct: 43,
    }

    expect(normalizedViolations[0]).toEqual(expectedViolation)
  })

  it('should obtain the borough from the county if possible and needed', async () => {
    const databasePathname = '/resource/uvbq-3m68.json'

    const rawOpenParkingAndCameraViolation: RawViolation = {
      county: 'BX',
      issueDate: '06/09/2023',
      issuingAgency: 'POLICE DEPARTMENT',
      licenseType: 'PAS',
      plate: 'KZH2758',
      state: 'NY',
      summonsNumber: '1159000000',
      violationTime: '09:11A',
    }

    const normalizedViolations = await normalizeViolations(
      [rawOpenParkingAndCameraViolation],
      databasePathname
    )

    const {
      county,
      licenseType,
      plate,
      state,
      ...rawOpenParkingAndCameraViolationMinusRemovedFields
    } = rawOpenParkingAndCameraViolation

    const expectedViolation = {
      ...rawOpenParkingAndCameraViolationMinusRemovedFields,
      amountDue: undefined,
      dateFirstObserved: undefined,
      daysParkingInEffect: undefined,
      feetFromCurb: undefined,
      fineAmount: undefined,
      fined: undefined,
      formattedTime: formattedTime.toISO(),
      formattedTimeEastern: formattedTime.toISO(),
      formattedTimeUtc: formattedTime.toUTC().toISO(),
      fromDatabases: [
        {
          endpoint: `https://data.cityofnewyork.us${databasePathname}`,
          name: 'Open Parking and Camera Violations',
        },
      ],
      fromHoursInEffect: undefined,
      houseNumber: undefined,
      humanizedDescription: 'No Violation Description Available',
      interestAmount: undefined,
      intersectingStreet: undefined,
      issuerCode: undefined,
      issuerCommand: undefined,
      issuerPrecinct: undefined,
      issuerSquad: undefined,
      issuingAgency: 'NYPD',
      judgmentEntryDate: undefined,
      lawSection: undefined,
      location: undefined,
      meterNumber: undefined,
      outstanding: undefined,
      paid: undefined,
      paymentAmount: undefined,
      penaltyAmount: undefined,
      plateId: 'KZH2758',
      plateType: 'PAS',
      reduced: undefined,
      reductionAmount: undefined,
      registrationState: 'NY',
      streetCode1: undefined,
      streetCode2: undefined,
      streetCode3: undefined,
      streetName: undefined,
      subDivision: undefined,
      summonsImage: undefined,
      toHoursInEffect: undefined,
      unregisteredVehicle: undefined,
      vehicleBodyType: undefined,
      vehicleColor: undefined,
      vehicleExpirationDate: undefined,
      vehicleMake: undefined,
      vehicleYear: undefined,
      violationCode: undefined,
      violationCounty: 'Bronx',
      violationInFrontOfOrOpposite: undefined,
      violationLegalCode: undefined,
      violationLocation: undefined,
      violationPostCode: undefined,
      violationPrecinct: undefined,
    }

    expect(normalizedViolations[0]).toEqual(expectedViolation)
  })

  it('should obtain the borough from the precinct if possible and needed', async () => {
    const databasePathname = '/resource/uvbq-3m68.json'

    const rawOpenParkingAndCameraViolation: RawViolation = {
      issueDate: '06/09/2023',
      issuingAgency: 'POLICE DEPARTMENT',
      licenseType: 'PAS',
      plate: 'KZH2758',
      precinct: '043',
      state: 'NY',
      summonsNumber: '1159000000',
      violationTime: '09:11A',
    }

    const normalizedViolations = await normalizeViolations(
      [rawOpenParkingAndCameraViolation],
      databasePathname
    )

    const {
      county,
      licenseType,
      plate,
      precinct,
      state,
      ...rawOpenParkingAndCameraViolationMinusRemovedFields
    } = rawOpenParkingAndCameraViolation

    const expectedViolation = {
      ...rawOpenParkingAndCameraViolationMinusRemovedFields,
      amountDue: undefined,
      dateFirstObserved: undefined,
      daysParkingInEffect: undefined,
      feetFromCurb: undefined,
      fineAmount: undefined,
      fined: undefined,
      formattedTime: formattedTime.toISO(),
      formattedTimeEastern: formattedTime.toISO(),
      formattedTimeUtc: formattedTime.toUTC().toISO(),
      fromDatabases: [
        {
          endpoint: `https://data.cityofnewyork.us${databasePathname}`,
          name: 'Open Parking and Camera Violations',
        },
      ],
      fromHoursInEffect: undefined,
      houseNumber: undefined,
      humanizedDescription: 'No Violation Description Available',
      interestAmount: undefined,
      intersectingStreet: undefined,
      issuerCode: undefined,
      issuerCommand: undefined,
      issuerPrecinct: undefined,
      issuerSquad: undefined,
      issuingAgency: 'NYPD',
      judgmentEntryDate: undefined,
      lawSection: undefined,
      location: undefined,
      meterNumber: undefined,
      outstanding: undefined,
      paid: undefined,
      paymentAmount: undefined,
      penaltyAmount: undefined,
      plateId: 'KZH2758',
      plateType: 'PAS',
      reduced: undefined,
      reductionAmount: undefined,
      registrationState: 'NY',
      streetCode1: undefined,
      streetCode2: undefined,
      streetCode3: undefined,
      streetName: undefined,
      subDivision: undefined,
      summonsImage: undefined,
      toHoursInEffect: undefined,
      unregisteredVehicle: undefined,
      vehicleBodyType: undefined,
      vehicleColor: undefined,
      vehicleExpirationDate: undefined,
      vehicleMake: undefined,
      vehicleYear: undefined,
      violationCode: undefined,
      violationCounty: 'Bronx',
      violationInFrontOfOrOpposite: undefined,
      violationLegalCode: undefined,
      violationLocation: undefined,
      violationPostCode: undefined,
      violationPrecinct: 43,
    }

    expect(normalizedViolations[0]).toEqual(expectedViolation)
  })

  it('should obtain the borough from violationCounty if possible and needed', async () => {
    const databasePathname = '/resource/869v-vr48.json'

    const rawFiscalYearDatabaseViolation: RawViolation = {
      issueDate: '2023-06-09T00:00:00.000',
      issuingAgency: 'P',
      plateId: 'KZH2758',
      plateType: 'PAS',
      registrationState: 'NY',
      summonsNumber: '1159000000',
      violationCounty: 'BX',
      violationTime: '09:11A',
    }

    const normalizedViolations = await normalizeViolations(
      [rawFiscalYearDatabaseViolation],
      databasePathname
    )

    const expectedViolation = {
      ...rawFiscalYearDatabaseViolation,
      amountDue: undefined,
      dateFirstObserved: undefined,
      daysParkingInEffect: undefined,
      feetFromCurb: undefined,
      fineAmount: undefined,
      fined: undefined,
      formattedTime: formattedTime.toISO(),
      formattedTimeEastern: formattedTime.toISO(),
      formattedTimeUtc: formattedTime.toUTC().toISO(),
      fromDatabases: [
        {
          endpoint: `https://data.cityofnewyork.us${databasePathname}`,
          name: 'Parking Violations Issued - Fiscal Year 2023',
        },
      ],
      fromHoursInEffect: undefined,
      houseNumber: undefined,
      humanizedDescription: 'No Violation Description Available',
      interestAmount: undefined,
      intersectingStreet: undefined,
      issuerCode: undefined,
      issuerCommand: undefined,
      issuerPrecinct: undefined,
      issuerSquad: undefined,
      issuingAgency: 'NYPD',
      judgmentEntryDate: undefined,
      lawSection: undefined,
      location: undefined,
      meterNumber: undefined,
      outstanding: undefined,
      paid: undefined,
      paymentAmount: undefined,
      penaltyAmount: undefined,
      plateId: 'KZH2758',
      plateType: 'PAS',
      reduced: undefined,
      reductionAmount: undefined,
      registrationState: 'NY',
      streetCode1: undefined,
      streetCode2: undefined,
      streetCode3: undefined,
      streetName: undefined,
      subDivision: undefined,
      summonsImage: undefined,
      toHoursInEffect: undefined,
      unregisteredVehicle: undefined,
      vehicleBodyType: undefined,
      vehicleColor: undefined,
      vehicleExpirationDate: undefined,
      vehicleMake: undefined,
      vehicleYear: undefined,
      violationCode: undefined,
      violationCounty: 'Bronx',
      violationInFrontOfOrOpposite: undefined,
      violationLegalCode: undefined,
      violationLocation: undefined,
      violationPostCode: undefined,
      violationPrecinct: undefined,
    }

    expect(normalizedViolations[0]).toEqual(expectedViolation)
  })

  it('should obtain the borough from violationPrecinct if possible and needed', async () => {
    const databasePathname = '/resource/869v-vr48.json'

    const rawFiscalYearDatabaseViolation: RawViolation = {
      issueDate: '2023-06-09T00:00:00.000',
      issuingAgency: 'P',
      plateId: 'KZH2758',
      plateType: 'PAS',
      registrationState: 'NY',
      summonsNumber: '1159000000',
      violationPrecinct: '43',
      violationTime: '09:11A',
    }

    const normalizedViolations = await normalizeViolations(
      [rawFiscalYearDatabaseViolation],
      databasePathname
    )

    const expectedViolation = {
      ...rawFiscalYearDatabaseViolation,
      amountDue: undefined,
      dateFirstObserved: undefined,
      daysParkingInEffect: undefined,
      feetFromCurb: undefined,
      fineAmount: undefined,
      fined: undefined,
      formattedTime: formattedTime.toISO(),
      formattedTimeEastern: formattedTime.toISO(),
      formattedTimeUtc: formattedTime.toUTC().toISO(),
      fromDatabases: [
        {
          endpoint: `https://data.cityofnewyork.us${databasePathname}`,
          name: 'Parking Violations Issued - Fiscal Year 2023',
        },
      ],
      fromHoursInEffect: undefined,
      houseNumber: undefined,
      humanizedDescription: 'No Violation Description Available',
      interestAmount: undefined,
      intersectingStreet: undefined,
      issuerCode: undefined,
      issuerCommand: undefined,
      issuerPrecinct: undefined,
      issuerSquad: undefined,
      issuingAgency: 'NYPD',
      judgmentEntryDate: undefined,
      lawSection: undefined,
      location: undefined,
      meterNumber: undefined,
      outstanding: undefined,
      paid: undefined,
      paymentAmount: undefined,
      penaltyAmount: undefined,
      plateId: 'KZH2758',
      plateType: 'PAS',
      reduced: undefined,
      reductionAmount: undefined,
      registrationState: 'NY',
      streetCode1: undefined,
      streetCode2: undefined,
      streetCode3: undefined,
      streetName: undefined,
      subDivision: undefined,
      summonsImage: undefined,
      toHoursInEffect: undefined,
      unregisteredVehicle: undefined,
      vehicleBodyType: undefined,
      vehicleColor: undefined,
      vehicleExpirationDate: undefined,
      vehicleMake: undefined,
      vehicleYear: undefined,
      violationCode: undefined,
      violationCounty: 'Bronx',
      violationInFrontOfOrOpposite: undefined,
      violationLegalCode: undefined,
      violationLocation: undefined,
      violationPostCode: undefined,
      violationPrecinct: 43,
    }

    expect(normalizedViolations[0]).toEqual(expectedViolation)
  })

  it('should obtain the borough from houseNumber and streetName if possible and needed', async () => {
    ;(getBoroughService as jest.Mock).mockImplementationOnce(
      async () => 'Brooklyn'
    )

    const houseNumber = '99'
    const streetName = 'Schermerhorn Street'

    const databasePathname = '/resource/869v-vr48.json'

    const rawFiscalYearDatabaseViolation: RawViolation = {
      houseNumber,
      issueDate: '2023-06-09T00:00:00.000',
      issuingAgency: 'P',
      plateId: 'KZH2758',
      plateType: 'PAS',
      registrationState: 'NY',
      streetName,
      summonsNumber: '1159000000',
      violationTime: '09:11A',
    }

    const normalizedViolations = await normalizeViolations(
      [rawFiscalYearDatabaseViolation],
      databasePathname
    )

    const expectedViolation = {
      ...rawFiscalYearDatabaseViolation,
      amountDue: undefined,
      dateFirstObserved: undefined,
      daysParkingInEffect: undefined,
      feetFromCurb: undefined,
      fineAmount: undefined,
      fined: undefined,
      formattedTime: formattedTime.toISO(),
      formattedTimeEastern: formattedTime.toISO(),
      formattedTimeUtc: formattedTime.toUTC().toISO(),
      fromDatabases: [
        {
          endpoint: `https://data.cityofnewyork.us${databasePathname}`,
          name: 'Parking Violations Issued - Fiscal Year 2023',
        },
      ],
      fromHoursInEffect: undefined,
      houseNumber,
      humanizedDescription: 'No Violation Description Available',
      interestAmount: undefined,
      intersectingStreet: undefined,
      issuerCode: undefined,
      issuerCommand: undefined,
      issuerPrecinct: undefined,
      issuerSquad: undefined,
      issuingAgency: 'NYPD',
      judgmentEntryDate: undefined,
      lawSection: undefined,
      location: '99 Schermerhorn Street',
      meterNumber: undefined,
      outstanding: undefined,
      paid: undefined,
      paymentAmount: undefined,
      penaltyAmount: undefined,
      plateId: 'KZH2758',
      plateType: 'PAS',
      reduced: undefined,
      reductionAmount: undefined,
      registrationState: 'NY',
      streetCode1: undefined,
      streetCode2: undefined,
      streetCode3: undefined,
      streetName,
      subDivision: undefined,
      summonsImage: undefined,
      toHoursInEffect: undefined,
      unregisteredVehicle: undefined,
      vehicleBodyType: undefined,
      vehicleColor: undefined,
      vehicleExpirationDate: undefined,
      vehicleMake: undefined,
      vehicleYear: undefined,
      violationCode: undefined,
      violationCounty: 'Brooklyn',
      violationInFrontOfOrOpposite: undefined,
      violationLegalCode: undefined,
      violationLocation: undefined,
      violationPostCode: undefined,
      violationPrecinct: undefined,
    }

    expect(normalizedViolations[0]).toEqual(expectedViolation)

    expect(getBoroughService).toHaveBeenCalledWith(
      `${houseNumber} ${streetName}`
    )
  })
})
