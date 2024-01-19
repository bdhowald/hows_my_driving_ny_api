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

  it('should properly handle violation codes that have changed over time', async () => {
    const databasePathname = '/resource/869v-vr48.json'

    const rawFiscalYearDatabaseViolation: RawViolation =
      rawFiscalYearDatabaseViolationFactory.build({
        violationCode: '12'
      })

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
      humanizedDescription: 'Mobile Bus Lane Violation',
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

  it('should throw an error for a variable violation code whose date is outside any valid range', async () => {
    const databasePathname = '/resource/869v-vr48.json'

    const rawFiscalYearDatabaseViolation: RawViolation =
      rawFiscalYearDatabaseViolationFactory.build({
        issueDate: '1960-01-01T00:00:00.000',
        violationCode: '12',
      })

    expect(normalizeViolations(
      [rawFiscalYearDatabaseViolation],
      databasePathname
    )).rejects.toThrow('Unrecognized time period for fiscal year violation description')
  })

  it('should handle a violation with only partial fine data', async () => {
    const databasePathname = '/resource/uvbq-3m68.json'

    const rawOpenParkingAndCameraViolation =
      rawOpenParkingAndCameraViolationFactory.build({
        amountDue: undefined,
        interestAmount: undefined,
        paymentAmount: undefined,
        penaltyAmount: undefined,
        reductionAmount: undefined,
      })

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
      amountDue: undefined,
      dateFirstObserved: undefined,
      daysParkingInEffect: undefined,
      feetFromCurb: undefined,
      fineAmount: 165,
      fined: 165,
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

  it('should normalize open parking and camera database violations with partial information', async () => {
    const databasePathname = '/resource/uvbq-3m68.json'

    const rawOpenParkingAndCameraViolation =
      rawOpenParkingAndCameraViolationFactory.build({
        amountDue: undefined,
        county: undefined,
        fineAmount: undefined,
        interestAmount: undefined,
        issuingAgency: undefined,
        paymentAmount: undefined,
        penaltyAmount: '50',
        precinct: '99',
        reductionAmount: undefined,
      })

    const {
      county,
      licenseType,
      plate,
      precinct,
      state,
      violation,
      ...rawOpenParkingAndCameraViolationMinusRemovedFields
    } = rawOpenParkingAndCameraViolation

    const expectedOpenParkingAndCameraViolation = {
      ...rawOpenParkingAndCameraViolationMinusRemovedFields,
      amountDue: undefined,
      dateFirstObserved: undefined,
      daysParkingInEffect: undefined,
      feetFromCurb: undefined,
      fineAmount: undefined,
      fined: 50,
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
      interestAmount: undefined,
      intersectingStreet: undefined,
      issuerCode: undefined,
      issuerCommand: undefined,
      issuerPrecinct: undefined,
      issuerSquad: undefined,
      issuingAgency: undefined,
      judgmentEntryDate: undefined,
      lawSection: undefined,
      location: undefined,
      meterNumber: undefined,
      outstanding: undefined,
      paid: undefined,
      paymentAmount: undefined,
      penaltyAmount: 50,
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
      toHoursInEffect: undefined,
      unregisteredVehicle: undefined,
      vehicleBodyType: undefined,
      vehicleColor: undefined,
      vehicleExpirationDate: undefined,
      vehicleMake: undefined,
      vehicleYear: undefined,
      violationCode: '67',
      violationCounty: undefined,
      violationInFrontOfOrOpposite: undefined,
      violationLegalCode: undefined,
      violationLocation: undefined,
      violationPostCode: undefined,
      violationPrecinct: 99,
    }

    const normalizedViolation = await normalizeViolations(
      [rawOpenParkingAndCameraViolation],
      databasePathname
    )

    expect(normalizedViolation).toEqual([expectedOpenParkingAndCameraViolation])
  })

  it('should normalize fiscal year database violations with partial information', async () => {
    const databasePathname = '/resource/869v-vr48.json'

    const rawFiscalYearDatabaseViolation: RawViolation = {
      issueDate: '2023-06-09T00:00:00.000',
      issuingAgency: 'P',
      plateId: 'KZH2758',
      plateType: 'PAS',
      registrationState: 'NY',
      summonsNumber: '1159000000',
      violationDescription: 'BUS LANE VIOLATION',
      violationInFrontOfOrOpposite: 'F',
      violationPrecinct: '99',
      violationTime: '09:11A',
    }

    const {
      violationDescription,
      ...rawFiscalYearDatabaseViolationMinusRemovedFields
    } = rawFiscalYearDatabaseViolation

    const expectedFiscalYearDatabaseViolation = {
      ...rawFiscalYearDatabaseViolationMinusRemovedFields,
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
      humanizedDescription: 'Bus Lane Violation',
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
      violationCode: '5',
      violationCounty: undefined,
      violationInFrontOfOrOpposite: 'F',
      violationLegalCode: undefined,
      violationLocation: undefined,
      violationPostCode: undefined,
      violationPrecinct: 99,
    }

    const normalizedViolation = await normalizeViolations(
      [rawFiscalYearDatabaseViolation],
      databasePathname
    )

    expect(normalizedViolation).toEqual([expectedFiscalYearDatabaseViolation])
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
      violationInFrontOfOr: 'O',
      violationLegalCode: 'T',
      violationPostCode: '001',
      violationTime: '09:11A',
    }

    const normalizedViolations = await normalizeViolations(
      [rawFiscalYearDatabaseViolation],
      databasePathname
    )

    const {
      violationInFrontOfOr,
      ...rawFiscalYearDatabaseViolationMinusRemovedFields
    } = rawFiscalYearDatabaseViolation

    const expectedViolation = {
      ...rawFiscalYearDatabaseViolationMinusRemovedFields,
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
      violationInFrontOfOrOpposite: 'O',
      violationLegalCode: 'T',
      violationLocation: undefined,
      violationPostCode: '001',
      violationPrecinct: undefined,
    }

    expect(normalizedViolations[0]).toEqual(expectedViolation)
  })

  it('should obtain the borough from violationPrecinct if possible and needed', async () => {
    const databasePathname = '/resource/869v-vr48.json'

    const formattedEarlyMorningTime = DateTime.fromISO('2023-06-09T00:11:00', {
      zone: 'America/New_York',
    })

    const rawFiscalYearDatabaseViolation: RawViolation = {
      issueDate: '2023-06-09T00:00:00.000',
      issuingAgency: 'P',
      plateId: 'KZH2758',
      plateType: 'PAS',
      registrationState: 'NY',
      summonsNumber: '1159000000',
      violationPrecinct: '43',
      violationTime: '12:11A',
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
      formattedTime: formattedEarlyMorningTime.toISO(),
      formattedTimeEastern: formattedEarlyMorningTime.toISO(),
      formattedTimeUtc: formattedEarlyMorningTime.toUTC().toISO(),
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

    const formattedEveningTime = DateTime.fromISO('2023-06-09T21:11:00', {
      zone: 'America/New_York',
    })

    const rawFiscalYearDatabaseViolation: RawViolation = {
      houseNumber,
      issueDate: '2023-06-09T00:00:00.000',
      issuingAgency: 'P',
      plateId: 'KZH2758',
      plateType: 'PAS',
      registrationState: 'NY',
      streetName,
      summonsNumber: '1159000000',
      violationTime: '09:11P',
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
      formattedTime: formattedEveningTime.toISO(),
      formattedTimeEastern: formattedEveningTime.toISO(),
      formattedTimeUtc: formattedEveningTime.toUTC().toISO(),
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

  it('should handle a violation with a date it entered judgment', async () => {
    const databasePathname = '/resource/uvbq-3m68.json'

    const rawOpenParkingAndCameraViolation =
      rawOpenParkingAndCameraViolationFactory.build({
        judgmentEntryDate: '01/02/2003'
      })

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
      judgmentEntryDate: '01/02/2003',
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

  it('should handle a fiscal year database violation with no issue date', async () => {
    const databasePathname = '/resource/869v-vr48.json'

    const rawFiscalYearDatabaseViolation: RawViolation =
      rawFiscalYearDatabaseViolationFactory.build({
        issueDate: undefined
      })

    const expectedViolation = {
      ...rawFiscalYearDatabaseViolation,
      amountDue: undefined,
      fineAmount: undefined,
      fined: undefined,
      formattedTime: undefined,
      formattedTimeEastern: undefined,
      formattedTimeUtc: undefined,
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

  it('should handle an open parking and camera violations database violation with no issue date', async () => {
    const databasePathname = '/resource/uvbq-3m68.json'

    const rawOpenParkingAndCameraViolation: RawViolation = {
      issueDate: '',
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
      formattedTime: undefined,
      formattedTimeEastern: undefined,
      formattedTimeUtc: undefined,
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

  it('should handle a violation with no violation time', async () => {
    const databasePathname = '/resource/869v-vr48.json'

    const rawFiscalYearDatabaseViolation: RawViolation =
      rawFiscalYearDatabaseViolationFactory.build({
        violationTime: undefined
      })

    const formattedMidnight = DateTime.fromISO('2023-06-09T00:00:00', {
      zone: 'America/New_York',
    })

    const expectedViolation = {
      ...rawFiscalYearDatabaseViolation,
      amountDue: undefined,
      fineAmount: undefined,
      fined: undefined,
      formattedTime: formattedMidnight.toISO(),
      formattedTimeEastern: formattedMidnight.toISO(),
      formattedTimeUtc: formattedMidnight.toUTC().toISO(),
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

  it('should throw an error for an unexpected time format', async () => {
    const databasePathname = '/resource/869v-vr48.json'

    const rawFiscalYearDatabaseViolation: RawViolation =
      rawFiscalYearDatabaseViolationFactory.build({
        violationTime: '123A'
      })

    expect(normalizeViolations(
      [rawFiscalYearDatabaseViolation],
      databasePathname
    )).rejects.toThrow('Unexpected time format')
  })
})
