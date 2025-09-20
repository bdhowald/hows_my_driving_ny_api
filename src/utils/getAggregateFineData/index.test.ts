import { violationFactory } from '__fixtures__/violations'

import getAggregateFineDataForVehicle from '.'

describe('getAggregateFineDataForVehicle', () => {
  it('should sum up the fine data for all given violations', () => {
    const fined = Math.random() * 100
    const outstanding = Math.random() * 100
    const paid = Math.random() * 100
    const reduced = Math.random() * 100

    const violationsNotInJudgment = violationFactory.buildList(20, {
      fined,
      outstanding,
      paid,
      reduced,
    })

    const violationsInJudgment = violationFactory.buildList(20, {
      fined,
      judgmentEntryDate: '07/07/2023',
      outstanding,
      paid,
      reduced,
    })

    const violations = [...violationsNotInJudgment, ...violationsInJudgment]

    const aggregateFineData = getAggregateFineDataForVehicle(violations)

    const fineDataForViolations = violations.map((violation) => ({
      fined: violation.fined,
      inJudgment: violation.judgmentEntryDate !== undefined,
      outstanding: violation.outstanding,
      paid: violation.paid,
      reduced: violation.reduced,
    }))

    const initialValue = {
      totalFined: 0,
      totalInJudgment: 0,
      totalOutstanding: 0,
      totalPaid: 0,
      totalReduced: 0,
    }

    const expectedAggregateFineData = fineDataForViolations.reduce(
      (accum, currentViolation) => {
        accum.totalFined += currentViolation.fined ?? 0
        accum.totalInJudgment +=
          currentViolation.inJudgment && currentViolation.outstanding
            ? currentViolation.outstanding
            : 0
        accum.totalOutstanding += currentViolation.outstanding ?? 0
        accum.totalPaid += currentViolation.paid ?? 0
        accum.totalReduced += currentViolation.reduced ?? 0

        return accum
      },
      initialValue
    )

    expect(aggregateFineData.totalFined).toBe(
      expectedAggregateFineData.totalFined
    )
    expect(aggregateFineData.totalInJudgment).toBe(
      expectedAggregateFineData.totalInJudgment
    )
    expect(aggregateFineData.totalOutstanding).toBe(
      expectedAggregateFineData.totalOutstanding
    )
    expect(aggregateFineData.totalPaid).toBe(
      expectedAggregateFineData.totalPaid
    )
    expect(aggregateFineData.totalReduced).toBe(
      expectedAggregateFineData.totalReduced
    )
  })
})
