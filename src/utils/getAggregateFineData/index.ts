import AggregateFineData from 'models/aggregateFineData'
import { Violation } from 'types/violations'

const getAggregateFineDataForVehicle = (violations: Violation[]) => {
  let totalFined = 0
  let totalPaid = 0
  let totalReduced = 0
  let totalOutstanding = 0
  let totalInJudgment = 0

  violations.forEach((violation) => {
    totalFined += violation.fined ?? 0
    totalPaid += violation.paid ?? 0
    totalReduced += violation.reduced ?? 0
    totalOutstanding += violation.outstanding ?? 0
    totalInJudgment +=
      violation.judgmentEntryDate && violation.outstanding
        ? violation.outstanding
        : 0
  })

  return new AggregateFineData({
    totalFined,
    totalInJudgment,
    totalOutstanding,
    totalPaid,
    totalReduced,
  })
}

export default getAggregateFineDataForVehicle
