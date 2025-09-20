export const NYC_OPEN_DATA_PORTAL_HOST = 'https://data.cityofnewyork.us'

export const NYC_OPEN_DATA_PORTAL_METADATA_PREFIX = `${NYC_OPEN_DATA_PORTAL_HOST}/api/views/metadata/v1/`

export const MEDALLION_DATABASE_ENDPOINT = `${NYC_OPEN_DATA_PORTAL_HOST}/resource/rhe8-mgbb.json`

const parkingViolationsFiscalYear2014Path = '/resource/jt7v-77mi.json'
const parkingViolationsFiscalYear2015Path = '/resource/c284-tqph.json'
const parkingViolationsFiscalYear2016Path = '/resource/kiv2-tbus.json'
const parkingViolationsFiscalYear2017Path = '/resource/2bnn-yakx.json'
const parkingViolationsFiscalYear2018Path = '/resource/a5td-mswe.json'
const parkingViolationsFiscalYear2019Path = '/resource/faiq-9dfq.json'
const parkingViolationsFiscalYear2020Path = '/resource/p7t3-5i9s.json'
const parkingViolationsFiscalYear2021Path = '/resource/kvfd-bves.json'
const parkingViolationsFiscalYear2022Path = '/resource/7mxj-7a6y.json'
const parkingViolationsFiscalYear2023Path = '/resource/869v-vr48.json'
const parkingViolationsFiscalYear2024Path = '/resource/pvqr-7yc4.json'

export const fiscalYearEndpoints = [
  `${NYC_OPEN_DATA_PORTAL_HOST}${parkingViolationsFiscalYear2014Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${parkingViolationsFiscalYear2015Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${parkingViolationsFiscalYear2016Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${parkingViolationsFiscalYear2017Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${parkingViolationsFiscalYear2018Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${parkingViolationsFiscalYear2019Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${parkingViolationsFiscalYear2020Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${parkingViolationsFiscalYear2021Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${parkingViolationsFiscalYear2022Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${parkingViolationsFiscalYear2023Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${parkingViolationsFiscalYear2024Path}`,
]

const OPEN_PARKING_AND_CAMERA_VIOLATIONS_PATH = '/resource/nc67-uf89.json'
export const openParkingAndCameraViolationsEndpoint = `${NYC_OPEN_DATA_PORTAL_HOST}${OPEN_PARKING_AND_CAMERA_VIOLATIONS_PATH}`

type FiscalYearViolationsDatabasePathName =
  | '/resource/jt7v-77mi.json'
  | '/resource/c284-tqph.json'
  | '/resource/kiv2-tbus.json'
  | '/resource/2bnn-yakx.json'
  | '/resource/a5td-mswe.json'
  | '/resource/faiq-9dfq.json'
  | '/resource/p7t3-5i9s.json'
  | '/resource/kvfd-bves.json'
  | '/resource/7mxj-7a6y.json'
  | '/resource/869v-vr48.json'
  | '/resource/pvqr-7yc4.json'

type OpenParkingAndCameraViolationsDatabasePathName = '/resource/nc67-uf89.json'

export type DatabasePathName =
  | FiscalYearViolationsDatabasePathName
  | OpenParkingAndCameraViolationsDatabasePathName

const FISCAL_YEAR_PATHS = [
  parkingViolationsFiscalYear2014Path,
  parkingViolationsFiscalYear2015Path,
  parkingViolationsFiscalYear2016Path,
  parkingViolationsFiscalYear2017Path,
  parkingViolationsFiscalYear2018Path,
  parkingViolationsFiscalYear2019Path,
  parkingViolationsFiscalYear2020Path,
  parkingViolationsFiscalYear2021Path,
  parkingViolationsFiscalYear2022Path,
  parkingViolationsFiscalYear2023Path,
]

export const FISCAL_YEAR_PATHS_TO_DATABASE_NAMES_MAP: Record<
  DatabasePathName,
  string
> = {
  [parkingViolationsFiscalYear2014Path]:
    'Parking Violations Issued - Fiscal Year 2014',
  [parkingViolationsFiscalYear2015Path]:
    'Parking Violations Issued - Fiscal Year 2015',
  [parkingViolationsFiscalYear2016Path]:
    'Parking Violations Issued - Fiscal Year 2016',
  [parkingViolationsFiscalYear2017Path]:
    'Parking Violations Issued - Fiscal Year 2017',
  [parkingViolationsFiscalYear2018Path]:
    'Parking Violations Issued - Fiscal Year 2018',
  [parkingViolationsFiscalYear2019Path]:
    'Parking Violations Issued - Fiscal Year 2019',
  [parkingViolationsFiscalYear2020Path]:
    'Parking Violations Issued - Fiscal Year 2020',
  [parkingViolationsFiscalYear2021Path]:
    'Parking Violations Issued - Fiscal Year 2021',
  [parkingViolationsFiscalYear2022Path]:
    'Parking Violations Issued - Fiscal Year 2022',
  [parkingViolationsFiscalYear2023Path]:
    'Parking Violations Issued - Fiscal Year 2023',
  [parkingViolationsFiscalYear2024Path]:
    'Parking Violations Issued - Fiscal Year 2024',
  [OPEN_PARKING_AND_CAMERA_VIOLATIONS_PATH]:
    'Open Parking and Camera Violations',
}

export const HOWS_MY_DRIVING_NY_WEBSITE_URL = 'https://howsmydrivingny.nyc'

export const API_LOOKUP_PATH = '/api/v1'
export const EXISTING_LOOKUP_PATH = '/api/v1/lookup'

export const TWITTER_WEBHOOK_ENDPOINT = '/webhook/twitter'

export const SERVER_PORT = 8080
export const LOCAL_SERVER_LOCATION = `localhost:${SERVER_PORT}`
