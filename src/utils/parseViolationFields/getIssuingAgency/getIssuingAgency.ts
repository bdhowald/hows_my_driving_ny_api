import IssuingAgency from 'constants/issuingAgencies'

const getIssuingAgency = (agencyish: string | undefined): IssuingAgency | undefined => {
  if (!agencyish) {
    return undefined
  }

  switch (agencyish) {
    case 'AMTRAK RAILROAD POLICE':
    case 'J':
      return IssuingAgency.AMTRAK_POLICE

    case 'D':
    case 'DEPARTMENT OF BUSINESS SERVICES':
    case 'DEPARTMENT OF CORRECTION':
    case 'I':
    case 'Q':
    case 'STATEN ISLAND RAPID TRANSIT POLICE':
      return IssuingAgency.NEW_YORK_CITY_DEPARTMENT_OF_CORRECTIONS

    case 'DEPARTMENT OF SANITATION':
    case 'S':
      return IssuingAgency.NEW_YORK_CITY_DEPARTMENT_OF_SANITATION

    case 'DEPARTMENT OF TRANSPORTATION':
    case 'U':
    case 'V':
      return IssuingAgency.NEW_YORK_CITY_DEPARTMENT_OF_TRANSPORTATION

    case '7':
    case 'SUNY MARITIME COLLEGE':
    case 'HEALTH AND HOSPITAL CORP. POLICE':
    case 'Y':
      return IssuingAgency.NEW_YORK_CITY_HEALTH_AND_HOSPITALS_POLICE

    case 'H':
    case 'HOUSING AUTHORITY':
      return IssuingAgency.NEW_YORK_CITY_HOUSING_AUTHORITY_POLICE 

    case 'F':
    case 'FIRE DEPARTMENT':
      return IssuingAgency.NEW_YORK_CITY_FIRE_DEPARTMENT

    case 'HEALTH DEPARTMENT POLICE':
    case 'W':
      return IssuingAgency.NEW_YORK_CITY_DEPARTMENT_OF_HEALTH_POLICE

    case 'METRO NORTH RAILROAD POLICE':
    case 'Z':
      return IssuingAgency.DEPARTMENT_OF_HOMELAND_SECURITY

    case '9':
    case 'NYC OFFICE OF THE SHERIFF':
      return IssuingAgency.NEW_YORK_CITY_SHERIFF

    case 'O':
    case 'NYS COURT OFFICERS':
      return IssuingAgency.NEW_YORK_STATE_COURT_OFFICERS

    case '1':
    case 'NYS OFFICE OF MENTAL HEALTH POLICE':
      return IssuingAgency.NEW_YORK_STATE_OFFICE_OF_MENTAL_HEALTH_POLICE

    case 'N':
    case 'NYS PARKS POLICE':
      return IssuingAgency.NEW_YORK_STATE_PARKS_POLICE

    case '2':
    case 'O M R D D':
      return IssuingAgency.NEW_YORK_STATE_OFFICE_FOR_PEOPLE_WITH_DEVELOPMENTAL_DISABILITIES

    case 'PARKING CONTROL UNIT':
      return IssuingAgency.NEW_YORK_CITY_DEPARTMENT_OF_TRANSPORTATION_PARKING_CONTROL_UNIT

    case 'K':
    case 'PARKS DEPARTMENT':
      return IssuingAgency.NEW_YORK_CITY_DEPARTMENT_OF_PARKS_AND_RECREATION

    case 'P':
    case 'POLICE DEPARTMENT':
      return IssuingAgency.NEW_YORK_CITY_POLICE_DEPARTMENT

    case 'A':
    case 'PORT AUTHORITY':
      return IssuingAgency.PORT_AUTHORITY_POLICE_DEPARTMENT

    case '3':
    case 'NYC TRANSIT AUTHORITY MANAGERS':
    case 'ROOSEVELT ISLAND SECURITY':
      return IssuingAgency.ROOSEVELT_ISLAND_PUBLIC_SAFETY

    case '4':
    case 'SEA GATE ASSOCIATION POLICE':
      return IssuingAgency.SEA_GATE_POLICE_DEPARTMENT

    case '5':
    case 'SNUG HARBOR CULTURAL CENTER RANGERS':
      return IssuingAgency.SNUG_HARBOR_CULTURAL_CENTER_RANGERS

    case 'G':
    case 'TAXI AND LIMOUSINE COMMISSION':
      return IssuingAgency.NEW_YORK_CITY_TAXI_AND_LIMOUSINE_COMMISSION

    case 'T':
    case 'TRAFFIC':
      return IssuingAgency.NEW_YORK_CITY_POLICE_DEPARTMENT_TRAFFIC_ENFORCEMENT

    case 'M':
    case 'R':
    case 'TRANSIT AUTHORITY':
      return IssuingAgency.METROPOLITAN_TRANSPORTATION_AUTHORITY_POLICE_DEPARTMENT

    case 'B':
    case 'TRIBOROUGH BRIDGE AND TUNNEL POLICE':
      return IssuingAgency.TRIBOROUGH_BRIDGE_AND_TUNNEL_AUTHORITY_POLICE

    case '6':
    case 'BOARD OF ESTIMATE':
    case 'C':
    case 'CON RAIL':
    case 'E':
    case 'L':
    case 'LONG ISLAND RAILROAD':
    case 'X':
    default:
      return IssuingAgency.UNKNOWN_ISSUER
  }
}

export default getIssuingAgency
