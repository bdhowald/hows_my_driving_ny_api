import IssuingAgency from 'constants/issuingAgencies'

import getIssuingAgency from './getIssuingAgency'

describe('getIssuingAgency', () => {
  test.each([
    {
      agencyish: undefined,
      outputIssuingAgency: IssuingAgency.UNKNOWN_ISSUER,
    },
    {
      agencyish: '',
      outputIssuingAgency: IssuingAgency.UNKNOWN_ISSUER,
    },
    {
      agencyish: '1',
      outputIssuingAgency: IssuingAgency.NEW_YORK_STATE_OFFICE_OF_MENTAL_HEALTH_POLICE,
    },
    {
      agencyish: '2',
      outputIssuingAgency: IssuingAgency.NEW_YORK_STATE_OFFICE_FOR_PEOPLE_WITH_DEVELOPMENTAL_DISABILITIES,
    },
    {
      agencyish: '3',
      outputIssuingAgency: IssuingAgency.ROOSEVELT_ISLAND_PUBLIC_SAFETY,
    },
    {
      agencyish: '4',
      outputIssuingAgency: IssuingAgency.SEA_GATE_POLICE_DEPARTMENT,
    },
    {
      agencyish: '5',
      outputIssuingAgency: IssuingAgency.SNUG_HARBOR_CULTURAL_CENTER_RANGERS,
    },
    {
      agencyish: '6',
      outputIssuingAgency: IssuingAgency.UNKNOWN_ISSUER,
    },
    {
      agencyish: '7',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_HEALTH_AND_HOSPITALS_POLICE,
    },
    {
      agencyish: '9',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_SHERIFF,
    },
    {
      agencyish: 'A',
      outputIssuingAgency: IssuingAgency.PORT_AUTHORITY_POLICE_DEPARTMENT,
    },
    {
      agencyish: 'AMTRAK RAILROAD POLICE',
      outputIssuingAgency: IssuingAgency.AMTRAK_POLICE,
    },
    {
      agencyish: 'B',
      outputIssuingAgency: IssuingAgency.TRIBOROUGH_BRIDGE_AND_TUNNEL_AUTHORITY_POLICE,
    },
    {
      agencyish: 'BOARD OF ESTIMATE',
      outputIssuingAgency: IssuingAgency.UNKNOWN_ISSUER,
    },
    {
      agencyish: 'C',
      outputIssuingAgency: IssuingAgency.UNKNOWN_ISSUER,
    },
    {
      agencyish: 'CON RAIL',
      outputIssuingAgency: IssuingAgency.UNKNOWN_ISSUER,
    },
    {
      agencyish: 'D',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_DEPARTMENT_OF_CORRECTIONS,
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
      agencyish: 'DEPARTMENT OF SANITATION',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_DEPARTMENT_OF_SANITATION,
    },
    {
      agencyish: 'DEPARTMENT OF TRANSPORTATION',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_DEPARTMENT_OF_TRANSPORTATION,
    },
    {
      agencyish: 'E',
      outputIssuingAgency: IssuingAgency.UNKNOWN_ISSUER,
    },
    {
      agencyish: 'F',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_FIRE_DEPARTMENT,
    },
    {
      agencyish: 'FIRE DEPARTMENT',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_FIRE_DEPARTMENT,
    },
    {
      agencyish: 'G',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_TAXI_AND_LIMOUSINE_COMMISSION,
    },
    {
      agencyish: 'H',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_HOUSING_AUTHORITY_POLICE,
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
      agencyish: 'I',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_DEPARTMENT_OF_CORRECTIONS,
    },
    {
      agencyish: 'J',
      outputIssuingAgency: IssuingAgency.AMTRAK_POLICE,
    },
    {
      agencyish: 'K',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_DEPARTMENT_OF_PARKS_AND_RECREATION,
    },
    {
      agencyish: 'L',
      outputIssuingAgency: IssuingAgency.UNKNOWN_ISSUER,
    },
    {
      agencyish: 'LONG ISLAND RAILROAD',
      outputIssuingAgency: IssuingAgency.UNKNOWN_ISSUER,
    },
    {
      agencyish: 'M',
      outputIssuingAgency: IssuingAgency.METROPOLITAN_TRANSPORTATION_AUTHORITY_POLICE_DEPARTMENT,
    },
    {
      agencyish: 'METRO NORTH RAILROAD POLICE',
      outputIssuingAgency: IssuingAgency.DEPARTMENT_OF_HOMELAND_SECURITY,
    },
    {
      agencyish: 'N',
      outputIssuingAgency: IssuingAgency.NEW_YORK_STATE_PARKS_POLICE,
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
      agencyish: 'O',
      outputIssuingAgency: IssuingAgency.NEW_YORK_STATE_COURT_OFFICERS,
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
      agencyish: 'P',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_POLICE_DEPARTMENT,
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
      agencyish: 'Q',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_DEPARTMENT_OF_CORRECTIONS,
    },
    {
      agencyish: 'ROOSEVELT ISLAND SECURITY',
      outputIssuingAgency: IssuingAgency.ROOSEVELT_ISLAND_PUBLIC_SAFETY,
    },
    {
      agencyish: 'R',
      outputIssuingAgency: IssuingAgency.METROPOLITAN_TRANSPORTATION_AUTHORITY_POLICE_DEPARTMENT,
    },
    {
      agencyish: 'S',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_DEPARTMENT_OF_SANITATION,
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
      agencyish: 'T',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_POLICE_DEPARTMENT_TRAFFIC_ENFORCEMENT,
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
    {
      agencyish: 'U',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_DEPARTMENT_OF_TRANSPORTATION,
    },
    {
      agencyish: 'V',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_DEPARTMENT_OF_TRANSPORTATION,
    },
    {
      agencyish: 'W',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_DEPARTMENT_OF_HEALTH_POLICE,
    },
    {
      agencyish: 'X',
      outputIssuingAgency: IssuingAgency.UNKNOWN_ISSUER,
    },
    {
      agencyish: 'Y',
      outputIssuingAgency: IssuingAgency.NEW_YORK_CITY_HEALTH_AND_HOSPITALS_POLICE,
    },
    {
      agencyish: 'Z',
      outputIssuingAgency: IssuingAgency.DEPARTMENT_OF_HOMELAND_SECURITY,
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
