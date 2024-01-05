export default {
  baseFrequencyQuery:
    'select count(*) as frequency ' +
    '  from plate_lookups ' +
    ' where plate = ? ' +
    '   and state = ? ' +
    '   and count_towards_frequency = 1',
  baseNumTicketsQuery:
    'select num_tickets ' +
    '     , created_at' +
    '  from plate_lookups ' +
    ' where plate = ? ' +
    '   and state = ? ' +
    '   and count_towards_frequency = 1',
  orderByCreatedAtLimitOneQueryPart: ' ORDER BY created_at DESC LIMIT 1',
  plateTypesQueryPart: ' and plate_types = ?',
  selectExternalLookupSource:
    'select * from authorized_external_users where api_key = ?',
  uniqueIdentifierQueryPart: ' and unique_identifier <> ?',
}
