import { PLATE_QUERY_FORMAT_HINT } from 'constants/errors'
import LookupSource from 'constants/lookupSources'
import ParsedQueryStringForApiLookup from 'types/queryStringParsing'
import { camelize } from 'utils/camelize'

type AnalyticsFields = 'fingerprintId' | 'lookupSource' | 'mixpanelId'

type AnalyticsData = {
  fingerprintId: string | undefined
  lookupSource: LookupSource | undefined
  mixpanelId: string | undefined
}

type Query = { [key: string]: string | string[] | undefined }

/**
 * Class to encapsulate parsing the query string into usable parameters
 */
class QueryParser {
  query: Query

  constructor(searchParams: URLSearchParams) {
    const query: { [key: string]: string | string[] } = {}

    searchParams.forEach((value, key) => {
      const camelizedKey = camelize(key)

      if (query[camelizedKey]) {
        const currentValue = query[camelizedKey]
        if (Array.isArray(currentValue)) {
          currentValue.push(value)
        } else {
          query[camelizedKey] = [currentValue, value]
        }
      } else {
        query[camelizedKey] = value
      }
    })

    this.query = query
  }

  /**
   *
   * @param fieldsFromQuery
   */
  findFilterFields = (fieldsFromQuery?: string | string[] | undefined) => {
    const possibleFilterFields = fieldsFromQuery ?? this.query['fields']

    const returnFields: { [key: string]: object } = {}

    if (possibleFilterFields == undefined || possibleFilterFields == '') {
      return returnFields
    }
    const fields: string = Array.isArray(possibleFilterFields)
      ? possibleFilterFields.join(',')
      : possibleFilterFields

    const selectedFields: string[] = fields
      .replace(/(\([^)]*\))/g, '')
      .split(',')

    selectedFields.forEach((field: string) => {
      if (fields[fields.indexOf(field) + field.length] == '(') {
        var re = new RegExp(field + '\\([\\w|,]*\\)', 'g')

        const matches: RegExpMatchArray | null = fields.match(re)
        if (matches) {
          const subfields = matches[0].replace(field, '')
          const subFieldsWithoutParentheses = subfields.substring(
            1,
            subfields.length - 1
          )

          if (subFieldsWithoutParentheses) {
            returnFields[field] = this.findFilterFields(
              subFieldsWithoutParentheses.replace(/[\(|\)]/g, '')
            )
          }
        }
      } else {
        returnFields[field] = {}
      }
    })

    return returnFields
  }

  /**
   * Get data that represents the user and lookup type
   */
  getAnalyticsData = (): AnalyticsData => {
    if (Object.keys(this.query).length) {
      let lookupSource: LookupSource | undefined

      const fingerprintId = this.query['fingerprintId'] as string | undefined
      const lookupSourceAsString = this.query['lookupSource'] as
        | string
        | undefined
      const mixpanelId = this.query['mixpanelId'] as string | undefined

      if (
        lookupSourceAsString &&
        Object.values(LookupSource).includes(
          lookupSourceAsString as LookupSource
        )
      ) {
        lookupSource = lookupSourceAsString as LookupSource
      }

      return {
        fingerprintId,
        lookupSource,
        mixpanelId,
      }
    }

    return {
      fingerprintId: undefined,
      lookupSource: undefined,
      mixpanelId: undefined,
    }
  }

  // /**
  //  * Find fields client wishes us to incorporate in our response
  //  *
  //  * @param {string} fieldsString
  //  * @returns
  //  */
  // private const findFilterFields = (fieldsString: string | null) => {
  //   const returnFields: { [key: string]: any } = {}

  //   if (!fieldsString) {
  //     return returnFields
  //   }

  //   const fields = fieldsString.replace(/(\([^)]*\))/g, "").split(",")

  //   fields.forEach((field) => {
  //     if (fieldsString[fieldsString.indexOf(field) + field.length] === "(") {
  //       const re = new RegExp(field + "\\([\\w|,]*\\)", "g")

  //       const regexMatches = fieldsString.match(re)

  //       let nestedFields: string | undefined

  //       if (regexMatches) {
  //         nestedFields = regexMatches[0].replace(field, "")
  //         nestedFields = nestedFields.substring(1, nestedFields.length - 1)
  //       }

  //       if (nestedFields) {
  //         returnFields[field] = findFilterFields(
  //           nestedFields.replace(/[(|)]/g, "")
  //         )
  //       } else if (nestedFields === "") {
  //         returnFields[field] = {}
  //       }
  //     } else {
  //       returnFields[field] = {}
  //     }
  //   })

  //   return returnFields
  // }

  private validateApiLookupParams = () => {
    const legacyPlateParam = this.query.plateId

    // Cannot look up multiple plates with legacy plate params.
    if (Array.isArray(legacyPlateParam)) {
      return {
        error:
          "To query multiple vehicles, use 'plate=<PLATE>:<STATE>', ex: " +
          "'api.howsmydrivingny.nyc/api/v1?plate=abc1234:ny&plate=1234abc:nj'",
      }
    }

    const plateParam = this.query.plate

    // Cannot look up plates mixing legacy and current-style params.
    if (legacyPlateParam && plateParam) {
      return {
        error:
          "Cannot use both 'plate' and 'plate_id'. " +
          "Use either 'plate=<PLATE>:<STATE>', ex: " +
          "'api.howsmydrivingny.nyc/api/v1?plate=abc1234:ny&plate=1234abc:nj', " +
          "or 'plate=<PLATE>&state=<STATE>', ex: " +
          "'api.howsmydrivingny.nyc/api/v1?plate=abc1234&state=ny'",
      }
    }

    const legacyStateParam = this.query.state
    // Cannot look up multiple plates with legacy state params.
    if (Array.isArray(legacyStateParam)) {
      return {
        error:
          "To query multiple vehicles, use 'plate=<PLATE>:<STATE>', ex: " +
          "'api.howsmydrivingny.nyc/api/v1?plate=abc1234:ny&plate=1234abc:nj'",
      }
    }

    // Cannot look up a plate using plate params without both one plate and one state.
    if (legacyPlateParam && !legacyStateParam) {
      return {
        error: `Missing state: ${PLATE_QUERY_FORMAT_HINT}`,
      }
    }

    if (legacyStateParam && !legacyPlateParam) {
      return {
        error: `Missing plate: ${PLATE_QUERY_FORMAT_HINT}`,
      }
    }

    // We have valid current-style plate params
    if (plateParam && !legacyPlateParam && !legacyStateParam) {
      return {}
    }

    // We have valid legacy-style plate params
    if (!plateParam && legacyPlateParam && legacyStateParam) {
      return {}
    }

    return {
      error:
        "To query a vehicle, use 'plate=<PLATE>:<STATE>', ex: " +
        "'api.howsmydrivingny.nyc/api/v1?plate=abc1234:ny&plate=1234abc:nj'",
    }
  }

  private getPlateWithLegacyFormat = (): string | undefined => {
    if (!this.query.plateId) {
      return undefined
    } else if (Array.isArray(this.query.plateId)) {
      throw new Error('Cannot query with multiple plate_ids and states.')
    } else {
      return this.query.plateId
    }
  }

  private getPlateTypesWithLegacyFormat = (): string[] | undefined => {
    if (!this.query.plateTypes) {
      return undefined
    }
    let arr: string[]
    if (Array.isArray(this.query.plateTypes)) {
      arr = this.query.plateTypes
    } else {
      arr = this.query.plateTypes.split(',')
    }
    return arr.map((item: any) => item.trim())
  }

  private getStateWithLegacyFormat = (): string | undefined => {
    if (!this.query.state) {
      return undefined
    } else if (Array.isArray(this.query.state)) {
      throw new Error('Cannot query with multiple plate_ids and states.')
    } else {
      return this.query.state
    }
  }

  getPotentialVehicles = (): ParsedQueryStringForApiLookup => {
    const apiLookupValidationErrors = this.validateApiLookupParams()
    if (
      'error' in apiLookupValidationErrors &&
      apiLookupValidationErrors.error
    ) {
      return apiLookupValidationErrors
    }

    const legacyFormatVehicle: string[] =
      this.getPotentialVehicleWithLegacyFormat()
    const newFormatVehicles: string[] = this.getPotentialVehiclesWithNewFormat()
    const potentialVehicles: string[] = [
      ...legacyFormatVehicle,
      ...newFormatVehicles,
    ]

    return {
      potentialVehicles: potentialVehicles,
    }
  }

  private getPotentialVehiclesWithNewFormat = (): string[] => {
    if (!this.query.plate) {
      return []
    } else if (Array.isArray(this.query.plate)) {
      return this.query.plate
    } else {
      return [this.query.plate]
    }
  }

  private getPotentialVehicleWithLegacyFormat = (): string[] => {
    const plate: string | undefined = this.getPlateWithLegacyFormat()
    const state: string | undefined = this.getStateWithLegacyFormat()
    const plateTypes: string[] | undefined =
      this.getPlateTypesWithLegacyFormat()

    if (plate && state) {
      return [
        `${plate}:${state}${plateTypes ? `:${plateTypes.join(',')}` : ''}`,
      ]
    }
    return []
  }
}

export default QueryParser
