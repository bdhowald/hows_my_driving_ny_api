import IssuingAgency from 'constants/issuingAgencies'

import getIssuingAgency from './getIssuingAgency'

describe('getIssuingAgency', () => {
  test.each([
    // Blank
    {
      agencyish: '',
      outputIssuingAgency: IssuingAgency.UNKNOWN_ISSUER,
    },
    {
      agencyish: 'AMTRAK RAILROAD POLICE',
      outputIssuingAgency: IssuingAgency.AMTRAK_POLICE,
    },
    {
      agencyish: 'BOARD OF ESTIMATE',
      outputIssuingAgency: IssuingAgency.UNKNOWN_ISSUER,
    },
    {
      agencyish: 'CON RAIL',
      outputIssuingAgency: IssuingAgency.UNKNOWN_ISSUER,
    },
    {
      agencyish: 'DEPARTMENT OF BUSINESS SERVICES',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_DEPARTMENT_OF_CORRECTIONS,
    },
    {
      agencyish: 'DEPARTMENT OF CORRECTION',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_DEPARTMENT_OF_CORRECTIONS,
    },
    {
      agencyish: 'DEPARTMENT OF TRANSPORTATION',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_DEPARTMENT_OF_TRANSPORTATION,
    },
    {
      agencyish: 'FIRE DEPARTMENT',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_FIRE_DEPARTMENT,
    },
    {
      agencyish: 'HEALTH AND HOSPITAL CORP. POLICE',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_HEALTH_AND_HOSPITALS_POLICE,
    },
    {
      agencyish: 'HEALTH DEPARTMENT POLICE',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_DEPARTMENT_OF_HEALTH_POLICE,
    },
    {
      agencyish: 'HOUSING AUTHORITY',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_HOUSING_AUTHORITY_POLICE,
    },
    {
      agencyish: 'LONG ISLAND RAILROAD',
      outputIssuingAgency: IssuingAgency.UNKNOWN_ISSUER,
    },
    {
      agencyish: 'METRO NORTH RAILROAD POLICE',
      outputIssuingAgency: IssuingAgency.DEPARTMENT_OF_HOMELAND_SECURITY,
    },
    {
      agencyish: 'NYC OFFICE OF THE SHERIFF',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_SHERIFF,
    },
    {
      agencyish: 'NYC TRANSIT AUTHORITY MANAGERS',
      outputIssuingAgency: IssuingAgency.ROOSEVELT_ISLAND_PUBLIC_SAFETY,
    },
    {
      agencyish: 'NYS COURT OFFICERS',
      outputIssuingAgency: IssuingAgency.NEW_YORK_STATE_COURT_OFFICERS,
    },
    {
      agencyish: 'NYS OFFICE OF MENTAL HEALTH POLICE',
      outputIssuingAgency: IssuingAgency.NEW_YORK_STATE_OFFICE_OF_MENTAL_HEALTH_POLICE,
    },
    {
      agencyish: 'NYS PARKS POLICE',
      outputIssuingAgency: IssuingAgency.NEW_YORK_STATE_PARKS_POLICE,
    },
    {
      agencyish: 'O M R D D',
      outputIssuingAgency: IssuingAgency.NEW_YORK_STATE_OFFICE_FOR_PEOPLE_WITH_DEVELOPMENTAL_DISABILITIES,
    },
    {
      agencyish: 'OTHER/UNKNOWN AGENCIES',
      outputIssuingAgency: IssuingAgency.UNKNOWN_ISSUER,
    },
    {
      agencyish: 'PARKING CONTROL UNIT',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_DEPARTMENT_OF_TRANSPORTATION_PARKING_CONTROL_UNIT,
    },
    {
      agencyish: 'PARKS DEPARTMENT',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_DEPARTMENT_OF_PARKS_AND_RECREATION,
    },
    {
      agencyish: 'POLICE DEPARTMENT',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_POLICE_DEPARTMENT,
    },
    {
      agencyish: 'PORT AUTHORITY',
      outputIssuingAgency: IssuingAgency.PORT_AUTHORITY_POLICE_DEPARTMENT,
    },
    {
      agencyish: 'ROOSEVELT ISLAND SECURITY',
      outputIssuingAgency: IssuingAgency.ROOSEVELT_ISLAND_PUBLIC_SAFETY,
    },
    {
      agencyish: 'SEA GATE ASSOCIATION POLICE',
      outputIssuingAgency: IssuingAgency.SEA_GATE_POLICE_DEPARTMENT,
    },
    {
      agencyish: 'SNUG HARBOR CULTURAL CENTER RANGERS',
      outputIssuingAgency: IssuingAgency.SNUG_HARBOR_CULTURAL_CENTER_RANGERS,
    },
    {
      agencyish: 'STATEN ISLAND RAPID TRANSIT POLICE',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_DEPARTMENT_OF_CORRECTIONS,
    },
    {
      agencyish: 'SUNY MARITIME COLLEGE',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_HEALTH_AND_HOSPITALS_POLICE,
    },
    {
      agencyish: 'TAXI AND LIMOUSINE COMMISSION',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_TAXI_AND_LIMOUSINE_COMMISSION,
    },
    {
      agencyish: 'TRAFFIC',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_POLICE_DEPARTMENT_TRAFFIC_ENFORCEMENT,
    },
    {
      agencyish: 'TRANSIT AUTHORITY',
      outputIssuingAgency: IssuingAgency.METROPOLITAN_TRANSPORTATION_AUTHORITY_POLICE_DEPARTMENT,
    },
    {
      agencyish: 'TRIBOROUGH BRIDGE AND TUNNEL POLICE',
      outputIssuingAgency: IssuingAgency.TRIBOROUGH_BRIDGE_AND_TUNNEL_AUTHORITY_POLICE,
    },
  ])(
    'successfully detects $outputIssuingAgency from $agencyish',
    ({ agencyish, outputIssuingAgency }) => {
      const issuingAgency = getIssuingAgency(agencyish)

      if (!issuingAgency) {
        fail('color is not defined')
      }

      expect(issuingAgency).toBe(outputIssuingAgency)
    },
  )
})
