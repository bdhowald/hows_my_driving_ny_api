export const NYC_OPEN_DATA_PORTAL_HOST = 'https://data.cityofnewyork.us'

export const NYC_OPEN_DATA_PORTAL_METADATA_PREFIX = `${NYC_OPEN_DATA_PORTAL_HOST}/api/views/metadata/v1/`

const nycOpenDataSocrataSodaV2DatabasePrefix = '/resource/'
const nycOpenDataSocrataSodaV3DatabasePrefix = '/api/v3/views/'

const nycOpenDataSocrataSodaV2DatabaseSuffix = '.json'
const nycOpenDataSocrataSodaV3DatabaseSuffix = 'query.json'

const medallionDatabaseEndpoint = 'rhe8-mgbb'

export const NYC_OPEN_DATA_SOCRATA_SODA_V2_MEDALLION_DATABASE_ENDPOINT = `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV2DatabasePrefix}${medallionDatabaseEndpoint}${nycOpenDataSocrataSodaV2DatabaseSuffix}`
export const NYC_OPEN_DATA_SOCRATA_SODA_V3_MEDALLION_DATABASE_ENDPOINT = `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV3DatabasePrefix}${medallionDatabaseEndpoint}/${nycOpenDataSocrataSodaV3DatabaseSuffix}`

const openParkingAndCameraViolationsPath = 'nc67-uf89'

const nycOpenDataSocrataSodaV2OpenParkingAndCameraViolationsPath = `${nycOpenDataSocrataSodaV2DatabasePrefix}${openParkingAndCameraViolationsPath}${nycOpenDataSocrataSodaV2DatabaseSuffix}`
const nycOpenDataSocrataSodaV3OpenParkingAndCameraViolationsPath = `${nycOpenDataSocrataSodaV3DatabasePrefix}${openParkingAndCameraViolationsPath}/${nycOpenDataSocrataSodaV3DatabaseSuffix}`

export const NYC_OPEN_DATA_SOCRATA_SODA_V2_OPEN_PARKING_AND_CAMERA_VIOLATIONS_ENDPOINT = `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV2OpenParkingAndCameraViolationsPath}`
export const NYC_OPEN_DATA_SOCRATA_SODA_V3_OPEN_PARKING_AND_CAMERA_VIOLATIONS_ENDPOINT = `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV3OpenParkingAndCameraViolationsPath}`

const parkingViolationsFiscalYear2014Path = 'jt7v-77mi'
const parkingViolationsFiscalYear2015Path = 'c284-tqph'
const parkingViolationsFiscalYear2016Path = 'kiv2-tbus'
const parkingViolationsFiscalYear2017Path = '2bnn-yakx'
const parkingViolationsFiscalYear2018Path = 'a5td-mswe'
const parkingViolationsFiscalYear2019Path = 'faiq-9dfq'
const parkingViolationsFiscalYear2020Path = 'p7t3-5i9s'
const parkingViolationsFiscalYear2021Path = 'kvfd-bves'
const parkingViolationsFiscalYear2022Path = '7mxj-7a6y'
const parkingViolationsFiscalYear2023Path = '869v-vr48'
const parkingViolationsFiscalYear2024Path = 'pvqr-7yc4'

const nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2014Path = `${nycOpenDataSocrataSodaV2DatabasePrefix}${parkingViolationsFiscalYear2014Path}${nycOpenDataSocrataSodaV2DatabaseSuffix}`
const nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2015Path = `${nycOpenDataSocrataSodaV2DatabasePrefix}${parkingViolationsFiscalYear2015Path}${nycOpenDataSocrataSodaV2DatabaseSuffix}`
const nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2016Path = `${nycOpenDataSocrataSodaV2DatabasePrefix}${parkingViolationsFiscalYear2016Path}${nycOpenDataSocrataSodaV2DatabaseSuffix}`
const nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2017Path = `${nycOpenDataSocrataSodaV2DatabasePrefix}${parkingViolationsFiscalYear2017Path}${nycOpenDataSocrataSodaV2DatabaseSuffix}`
const nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2018Path = `${nycOpenDataSocrataSodaV2DatabasePrefix}${parkingViolationsFiscalYear2018Path}${nycOpenDataSocrataSodaV2DatabaseSuffix}`
const nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2019Path = `${nycOpenDataSocrataSodaV2DatabasePrefix}${parkingViolationsFiscalYear2019Path}${nycOpenDataSocrataSodaV2DatabaseSuffix}`
const nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2020Path = `${nycOpenDataSocrataSodaV2DatabasePrefix}${parkingViolationsFiscalYear2020Path}${nycOpenDataSocrataSodaV2DatabaseSuffix}`
const nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2021Path = `${nycOpenDataSocrataSodaV2DatabasePrefix}${parkingViolationsFiscalYear2021Path}${nycOpenDataSocrataSodaV2DatabaseSuffix}`
const nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2022Path = `${nycOpenDataSocrataSodaV2DatabasePrefix}${parkingViolationsFiscalYear2022Path}${nycOpenDataSocrataSodaV2DatabaseSuffix}`
const nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2023Path = `${nycOpenDataSocrataSodaV2DatabasePrefix}${parkingViolationsFiscalYear2023Path}${nycOpenDataSocrataSodaV2DatabaseSuffix}`
const nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2024Path = `${nycOpenDataSocrataSodaV2DatabasePrefix}${parkingViolationsFiscalYear2024Path}${nycOpenDataSocrataSodaV2DatabaseSuffix}`

export const NYC_OPEN_DATA_SOCRATA_SODA_V2_DATABASE_FISCAL_YEAR_ENDPOINTS = [
  `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2014Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2015Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2016Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2017Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2018Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2019Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2020Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2021Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2022Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2023Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2024Path}`,
]

const nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2014Path = `${nycOpenDataSocrataSodaV3DatabasePrefix}${parkingViolationsFiscalYear2014Path}/${nycOpenDataSocrataSodaV3DatabaseSuffix}`
const nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2015Path = `${nycOpenDataSocrataSodaV3DatabasePrefix}${parkingViolationsFiscalYear2015Path}/${nycOpenDataSocrataSodaV3DatabaseSuffix}`
const nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2016Path = `${nycOpenDataSocrataSodaV3DatabasePrefix}${parkingViolationsFiscalYear2016Path}/${nycOpenDataSocrataSodaV3DatabaseSuffix}`
const nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2017Path = `${nycOpenDataSocrataSodaV3DatabasePrefix}${parkingViolationsFiscalYear2017Path}/${nycOpenDataSocrataSodaV3DatabaseSuffix}`
const nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2018Path = `${nycOpenDataSocrataSodaV3DatabasePrefix}${parkingViolationsFiscalYear2018Path}/${nycOpenDataSocrataSodaV3DatabaseSuffix}`
const nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2019Path = `${nycOpenDataSocrataSodaV3DatabasePrefix}${parkingViolationsFiscalYear2019Path}/${nycOpenDataSocrataSodaV3DatabaseSuffix}`
const nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2020Path = `${nycOpenDataSocrataSodaV3DatabasePrefix}${parkingViolationsFiscalYear2020Path}/${nycOpenDataSocrataSodaV3DatabaseSuffix}`
const nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2021Path = `${nycOpenDataSocrataSodaV3DatabasePrefix}${parkingViolationsFiscalYear2021Path}/${nycOpenDataSocrataSodaV3DatabaseSuffix}`
const nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2022Path = `${nycOpenDataSocrataSodaV3DatabasePrefix}${parkingViolationsFiscalYear2022Path}/${nycOpenDataSocrataSodaV3DatabaseSuffix}`
const nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2023Path = `${nycOpenDataSocrataSodaV3DatabasePrefix}${parkingViolationsFiscalYear2023Path}/${nycOpenDataSocrataSodaV3DatabaseSuffix}`
const nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2024Path = `${nycOpenDataSocrataSodaV3DatabasePrefix}${parkingViolationsFiscalYear2024Path}/${nycOpenDataSocrataSodaV3DatabaseSuffix}`

export const NYC_OPEN_DATA_SOCRATA_SODA_V3_DATABASE_FISCAL_YEAR_ENDPOINTS = [
  `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2014Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2015Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2016Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2017Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2018Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2019Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2020Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2021Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2022Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2023Path}`,
  `${NYC_OPEN_DATA_PORTAL_HOST}${nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2024Path}`,
]

export const NYC_OPEN_DATA_VIOLATION_DATABASE_METADATA_ENDPOINTS = [
  `${NYC_OPEN_DATA_PORTAL_METADATA_PREFIX}${parkingViolationsFiscalYear2014Path}.json`,
  `${NYC_OPEN_DATA_PORTAL_METADATA_PREFIX}${parkingViolationsFiscalYear2015Path}.json`,
  `${NYC_OPEN_DATA_PORTAL_METADATA_PREFIX}${parkingViolationsFiscalYear2016Path}.json`,
  `${NYC_OPEN_DATA_PORTAL_METADATA_PREFIX}${parkingViolationsFiscalYear2017Path}.json`,
  `${NYC_OPEN_DATA_PORTAL_METADATA_PREFIX}${parkingViolationsFiscalYear2018Path}.json`,
  `${NYC_OPEN_DATA_PORTAL_METADATA_PREFIX}${parkingViolationsFiscalYear2019Path}.json`,
  `${NYC_OPEN_DATA_PORTAL_METADATA_PREFIX}${parkingViolationsFiscalYear2020Path}.json`,
  `${NYC_OPEN_DATA_PORTAL_METADATA_PREFIX}${parkingViolationsFiscalYear2021Path}.json`,
  `${NYC_OPEN_DATA_PORTAL_METADATA_PREFIX}${parkingViolationsFiscalYear2022Path}.json`,
  `${NYC_OPEN_DATA_PORTAL_METADATA_PREFIX}${parkingViolationsFiscalYear2023Path}.json`,
  `${NYC_OPEN_DATA_PORTAL_METADATA_PREFIX}${parkingViolationsFiscalYear2024Path}.json`,
  `${NYC_OPEN_DATA_PORTAL_METADATA_PREFIX}${openParkingAndCameraViolationsPath}.json`,
]

export type ViolationDatabasePathname =
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
  | '/resource/nc67-uf89.json'
  | '/api/v3/views/jt7v-77mi/query.json'
  | '/api/v3/views/c284-tqph/query.json'
  | '/api/v3/views/kiv2-tbus/query.json'
  | '/api/v3/views/2bnn-yakx/query.json'
  | '/api/v3/views/a5td-mswe/query.json'
  | '/api/v3/views/faiq-9dfq/query.json'
  | '/api/v3/views/p7t3-5i9s/query.json'
  | '/api/v3/views/kvfd-bves/query.json'
  | '/api/v3/views/7mxj-7a6y/query.json'
  | '/api/v3/views/869v-vr48/query.json'
  | '/api/v3/views/pvqr-7yc4/query.json'
  | '/api/v3/views/nc67-uf89/query.json'

type ViolationDatabaseName =
  | 'Parking Violations Issued - Fiscal Year 2014'
  | 'Parking Violations Issued - Fiscal Year 2015'
  | 'Parking Violations Issued - Fiscal Year 2016'
  | 'Parking Violations Issued - Fiscal Year 2017'
  | 'Parking Violations Issued - Fiscal Year 2018'
  | 'Parking Violations Issued - Fiscal Year 2019'
  | 'Parking Violations Issued - Fiscal Year 2020'
  | 'Parking Violations Issued - Fiscal Year 2021'
  | 'Parking Violations Issued - Fiscal Year 2022'
  | 'Parking Violations Issued - Fiscal Year 2023'
  | 'Parking Violations Issued - Fiscal Year 2024'
  | 'Open Parking and Camera Violations'

export const API_PATHNAMES_TO_DATABASE_NAMES_MAP: Record<
  ViolationDatabasePathname,
  ViolationDatabaseName
> = {
  [nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2014Path]:
    'Parking Violations Issued - Fiscal Year 2014',
  [nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2015Path]:
    'Parking Violations Issued - Fiscal Year 2015',
  [nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2016Path]:
    'Parking Violations Issued - Fiscal Year 2016',
  [nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2017Path]:
    'Parking Violations Issued - Fiscal Year 2017',
  [nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2018Path]:
    'Parking Violations Issued - Fiscal Year 2018',
  [nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2019Path]:
    'Parking Violations Issued - Fiscal Year 2019',
  [nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2020Path]:
    'Parking Violations Issued - Fiscal Year 2020',
  [nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2021Path]:
    'Parking Violations Issued - Fiscal Year 2021',
  [nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2022Path]:
    'Parking Violations Issued - Fiscal Year 2022',
  [nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2023Path]:
    'Parking Violations Issued - Fiscal Year 2023',
  [nycOpenDataSocrataSodaV2ParkingViolationsFiscalYear2024Path]:
    'Parking Violations Issued - Fiscal Year 2024',
  [nycOpenDataSocrataSodaV2OpenParkingAndCameraViolationsPath]:
    'Open Parking and Camera Violations',
  [nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2014Path]:
    'Parking Violations Issued - Fiscal Year 2014',
  [nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2015Path]:
    'Parking Violations Issued - Fiscal Year 2015',
  [nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2016Path]:
    'Parking Violations Issued - Fiscal Year 2016',
  [nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2017Path]:
    'Parking Violations Issued - Fiscal Year 2017',
  [nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2018Path]:
    'Parking Violations Issued - Fiscal Year 2018',
  [nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2019Path]:
    'Parking Violations Issued - Fiscal Year 2019',
  [nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2020Path]:
    'Parking Violations Issued - Fiscal Year 2020',
  [nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2021Path]:
    'Parking Violations Issued - Fiscal Year 2021',
  [nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2022Path]:
    'Parking Violations Issued - Fiscal Year 2022',
  [nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2023Path]:
    'Parking Violations Issued - Fiscal Year 2023',
  [nycOpenDataSocrataSodaV3ParkingViolationsFiscalYear2024Path]:
    'Parking Violations Issued - Fiscal Year 2024',
  [nycOpenDataSocrataSodaV3OpenParkingAndCameraViolationsPath]:
    'Open Parking and Camera Violations',
} as Record<ViolationDatabasePathname, ViolationDatabaseName>
// The above is needed due to a typescript bug on computed keys.

export const HOWS_MY_DRIVING_NY_WEBSITE_URL = 'https://howsmydrivingny.nyc'

export const API_LOOKUP_PATH = '/api/v1'
export const EXISTING_LOOKUP_PATH = '/api/v1/lookup'

export const TWITTER_WEBHOOK_ENDPOINT = '/webhook/twitter'

export const SERVER_PORT = 8080
export const LOCAL_SERVER_LOCATION = `localhost:${SERVER_PORT}`
