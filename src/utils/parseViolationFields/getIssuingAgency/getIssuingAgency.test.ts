import IssuingAgency from 'constants/issuingAgencies'

import getIssuingAgency from './getIssuingAgency'

describe('getIssuingAgency', () => {
  test.each([
    {
      agencyish: undefined,
      outputIssuingAgency: 'Unknown Issuer',
    },
    {
      agencyish: '',
      outputIssuingAgency: 'Unknown Issuer',
    },
    {
      agencyish: '1',
      outputIssuingAgency: 'New York State Office of Mental Health Police',
    },
    {
      agencyish: '2',
      outputIssuingAgency: 'New York State Office for People With Developmental Disabilities',
    },
    {
      agencyish: '3',
      outputIssuingAgency: 'Roosevelt Island Security (RIOC)',
    },
    {
      agencyish: '4',
      outputIssuingAgency: 'Sea Gate Police Department',
    },
    {
      agencyish: '5',
      outputIssuingAgency: 'Snug Harbor Cultural Center Rangers',
    },
    {
      agencyish: '6',
      outputIssuingAgency: 'Unknown Issuer',
    },
    {
      agencyish: '7',
      outputIssuingAgency: 'NYC Health & Hospitals Police (NYC H+H)',
    },
    {
      agencyish: '9',
      outputIssuingAgency: 'New York City Sheriff',
    },
    {
      agencyish: 'A',
      outputIssuingAgency: 'Port Authority Police (PANYNJ)',
    },
    {
      agencyish: 'AMTRAK RAILROAD POLICE',
      outputIssuingAgency: 'Amtrak Police',
    },
    {
      agencyish: 'B',
      outputIssuingAgency: 'Triborough Bridge & Tunnel Authority Police (TBTA)',
    },
    {
      agencyish: 'BOARD OF ESTIMATE',
      outputIssuingAgency: 'Unknown Issuer',
    },
    {
      agencyish: 'C',
      outputIssuingAgency: 'Unknown Issuer',
    },
    {
      agencyish: 'CON RAIL',
      outputIssuingAgency: 'Unknown Issuer',
    },
    {
      agencyish: 'D',
      outputIssuingAgency: 'NYC Department of Corrections (NYC DOC)',
    },
    {
      agencyish: 'DEPARTMENT OF BUSINESS SERVICES',
      outputIssuingAgency: 'NYC Department of Corrections (NYC DOC)',
    },
    {
      agencyish: 'DEPARTMENT OF CORRECTION',
      outputIssuingAgency: 'NYC Department of Corrections (NYC DOC)',
    },
    {
      agencyish: 'DEPARTMENT OF SANITATION',
      outputIssuingAgency: 'Department of Sanitation (DSNY)',
    },
    {
      agencyish: 'DEPARTMENT OF TRANSPORTATION',
      outputIssuingAgency: 'Department of Transportation (NYC DOT)',
    },
    {
      agencyish: 'E',
      outputIssuingAgency: 'Unknown Issuer',
    },
    {
      agencyish: 'F',
      outputIssuingAgency: 'New York Fire Department (FDNY)',
    },
    {
      agencyish: 'FIRE DEPARTMENT',
      outputIssuingAgency: 'New York Fire Department (FDNY)',
    },
    {
      agencyish: 'G',
      outputIssuingAgency: 'NYC Taxi & Limousine Commission Police (TLC)',
    },
    {
      agencyish: 'H',
      outputIssuingAgency: 'NYC Housing Authority Police (NYCHA)',
    },
    {
      agencyish: 'HEALTH AND HOSPITAL CORP. POLICE',
      outputIssuingAgency: 'NYC Health & Hospitals Police (NYC H+H)',
    },
    {
      agencyish: 'HEALTH DEPARTMENT POLICE',
      outputIssuingAgency: 'NYC Department of Health Police (NYC DOHMH)',
    },
    {
      agencyish: 'HOUSING AUTHORITY',
      outputIssuingAgency: 'NYC Housing Authority Police (NYCHA)',
    },
    {
      agencyish: 'I',
      outputIssuingAgency: 'NYC Department of Corrections (NYC DOC)',
    },
    {
      agencyish: 'J',
      outputIssuingAgency: 'Amtrak Police',
    },
    {
      agencyish: 'K',
      outputIssuingAgency: 'NYC Parks',
    },
    {
      agencyish: 'L',
      outputIssuingAgency: 'Unknown Issuer',
    },
    {
      agencyish: 'LONG ISLAND RAILROAD',
      outputIssuingAgency: 'Unknown Issuer',
    },
    {
      agencyish: 'M',
      outputIssuingAgency: 'MTA Police',
    },
    {
      agencyish: 'METRO NORTH RAILROAD POLICE',
      outputIssuingAgency: 'Department of Homeland Security (DHS)',
    },
    {
      agencyish: 'N',
      outputIssuingAgency: 'New York State Parks Police',
    },
    {
      agencyish: 'NYC OFFICE OF THE SHERIFF',
      outputIssuingAgency: 'New York City Sheriff',
    },
    {
      agencyish: 'NYC TRANSIT AUTHORITY MANAGERS',
      outputIssuingAgency: 'Roosevelt Island Security (RIOC)',
    },
    {
      agencyish: 'NYS COURT OFFICERS',
      outputIssuingAgency: 'New York State Court Officers',
    },
    {
      agencyish: 'NYS OFFICE OF MENTAL HEALTH POLICE',
      outputIssuingAgency: 'New York State Office of Mental Health Police',
    },
    {
      agencyish: 'NYS PARKS POLICE',
      outputIssuingAgency: 'New York State Parks Police',
    },
    {
      agencyish: 'O',
      outputIssuingAgency: 'New York State Court Officers',
    },
    {
      agencyish: 'O M R D D',
      outputIssuingAgency: 'New York State Office for People With Developmental Disabilities',
    },
    {
      agencyish: 'OTHER/UNKNOWN AGENCIES',
      outputIssuingAgency: 'Unknown Issuer',
    },
    {
      agencyish: 'P',
      outputIssuingAgency: 'New York Police Department (NYPD)',
    },
    {
      agencyish: 'PARKING CONTROL UNIT',
      outputIssuingAgency: 'Deparment of Transportation (NYC DOT) Parking Control Unit',
    },
    {
      agencyish: 'PARKS DEPARTMENT',
      outputIssuingAgency: 'NYC Parks',
    },
    {
      agencyish: 'POLICE DEPARTMENT',
      outputIssuingAgency: 'New York Police Department (NYPD)',
    },
    {
      agencyish: 'PORT AUTHORITY',
      outputIssuingAgency: 'Port Authority Police (PANYNJ)',
    },
    {
      agencyish: 'Q',
      outputIssuingAgency: 'NYC Department of Corrections (NYC DOC)',
    },
    {
      agencyish: 'ROOSEVELT ISLAND SECURITY',
      outputIssuingAgency: 'Roosevelt Island Security (RIOC)',
    },
    {
      agencyish: 'R',
      outputIssuingAgency: 'MTA Police',
    },
    {
      agencyish: 'S',
      outputIssuingAgency: 'Department of Sanitation (DSNY)',
    },
    {
      agencyish: 'SEA GATE ASSOCIATION POLICE',
      outputIssuingAgency: 'Sea Gate Police Department',
    },
    {
      agencyish: 'SNUG HARBOR CULTURAL CENTER RANGERS',
      outputIssuingAgency: 'Snug Harbor Cultural Center Rangers',
    },
    {
      agencyish: 'STATEN ISLAND RAPID TRANSIT POLICE',
      outputIssuingAgency: 'NYC Department of Corrections (NYC DOC)',
    },
    {
      agencyish: 'SUNY MARITIME COLLEGE',
      outputIssuingAgency: 'NYC Health & Hospitals Police (NYC H+H)',
    },
    {
      agencyish: 'T',
      outputIssuingAgency: 'NYPD Traffic Enforcement',
    },
    {
      agencyish: 'TAXI AND LIMOUSINE COMMISSION',
      outputIssuingAgency: 'NYC Taxi & Limousine Commission Police (TLC)',
    },
    {
      agencyish: 'TRAFFIC',
      outputIssuingAgency: 'NYPD Traffic Enforcement',
    },
    {
      agencyish: 'TRANSIT AUTHORITY',
      outputIssuingAgency: 'MTA Police',
    },
    {
      agencyish: 'TRIBOROUGH BRIDGE AND TUNNEL POLICE',
      outputIssuingAgency: 'Triborough Bridge & Tunnel Authority Police (TBTA)',
    },
    {
      agencyish: 'U',
      outputIssuingAgency: 'Department of Transportation (NYC DOT)',
    },
    {
      agencyish: 'V',
      outputIssuingAgency: 'Department of Transportation (NYC DOT)',
    },
    {
      agencyish: 'W',
      outputIssuingAgency: 'NYC Department of Health Police (NYC DOHMH)',
    },
    {
      agencyish: 'X',
      outputIssuingAgency: 'Unknown Issuer',
    },
    {
      agencyish: 'Y',
      outputIssuingAgency: 'NYC Health & Hospitals Police (NYC H+H)',
    },
    {
      agencyish: 'Z',
      outputIssuingAgency: 'Department of Homeland Security (DHS)',
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
