export type AggregatorFineDataProps = {
  totalFined: number
  totalInJudgment: number
  totalOutstanding: number
  totalPaid: number
  totalReduced: number
}

export default class AggregateFineData {
  totalFined: number
  totalInJudgment: number
  totalOutstanding: number
  totalPaid: number
  totalReduced: number

  constructor(props: AggregatorFineDataProps) {
    this.totalFined = props.totalFined
    this.totalOutstanding = props.totalOutstanding
    this.totalPaid = props.totalPaid
    this.totalReduced = props.totalReduced
    this.totalInJudgment = props.totalInJudgment
  }

  get areFinesAssessed() {
    return this.totalFined > 0
  }

  get maxAmount() {
    return Math.max(
      this.totalFined,
      this.totalOutstanding,
      this.totalPaid,
      this.totalReduced
    )
  }
}
