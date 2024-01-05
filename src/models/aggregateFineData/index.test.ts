import AggregateFineData, { AggregatorFineDataProps } from '.'

describe('AggregateFineData', () => {
  describe('areFinesAssessed', () => {
    it('should return true if the amount fined is more than zero', () => {
      const aggregateFineData = new AggregateFineData({
        totalFined: 1,
        totalInJudgment: 0,
        totalOutstanding: 0,
        totalPaid: 0,
        totalReduced: 0,
      })

      expect(aggregateFineData.areFinesAssessed).toBe(true)
    })

    it('should return true if the amount fined is zero', () => {
      const aggregateFineData = new AggregateFineData({
        totalFined: 0,
        totalInJudgment: 0,
        totalOutstanding: 0,
        totalPaid: 0,
        totalReduced: 0,
      })

      expect(aggregateFineData.areFinesAssessed).toBe(false)
    })
  })

  describe('maxAmount', () => {
    const cases: [AggregatorFineDataProps, number][] = [
      [
        {
          totalFined: 1,
          totalInJudgment: 2,
          totalOutstanding: 3,
          totalPaid: 4,
          totalReduced: 5,
        },
        5,
      ],
      [
        {
          totalFined: 0,
          totalInJudgment: 0,
          totalOutstanding: 0,
          totalPaid: 0,
          totalReduced: 0,
        },
        0,
      ],
      [
        {
          totalFined: 0,
          totalInJudgment: 100,
          totalOutstanding: 0,
          totalPaid: 0,
          totalReduced: 0,
        },
        0,
      ],
    ]

    test.each(cases)(
      'given %o as input, maxAmount returns %p',
      (inputValues, expectedResult) => {
        const aggregateFineData = new AggregateFineData(inputValues)
        expect(aggregateFineData.maxAmount).toBe(expectedResult)
      }
    )
  })
})
