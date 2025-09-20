import ViolationStatus from 'constants/violationStatuses'

const getViolationStatus = (violationStatusish: string | undefined): ViolationStatus | undefined => {
  if (!violationStatusish) {
    return undefined
  }

  switch (violationStatusish) {
    case 'ADMIN CLAIM DENIED':
      return ViolationStatus.ADMINISTRATIVE_CLAIM_DENIED
    
    case 'ADMIN CLAIM GRANTED':
      return ViolationStatus.ADMINISTRATIVE_CLAIM_GRANTED

    case 'ADMIN REDUCTION':
      return ViolationStatus.ADMINISTRATIVE_REDUCTION

    case 'APPEAL ABANDONED':
      return ViolationStatus.APPEAL_ABANDONED

    case 'APPEAL AFFIRMED':
      return ViolationStatus.APPEAL_AFFIRMED

    case 'APPEAL MODIFIED':
      return ViolationStatus.APPEAL_MODIFIED

    case 'APPEAL REMANDED':
      return ViolationStatus.APPEAL_REMANDED

    case 'APPEAL REVERSED':
      return ViolationStatus.APPEAL_REVERSED

    case 'HEARING ADJOURNMENT':
      return ViolationStatus.HEARING_ADJOURNED

    case 'HEARING HELD-GUILTY':
      return ViolationStatus.HEARING_HELD_GUILTY

    case 'HEARING HELD-GUILTY REDUCTION':
      return ViolationStatus.HEARING_HELD_GUILTY_REDUCTION

    case 'HEARING HELD-NOT GUILTY':
      return ViolationStatus.HEARING_HELD_NOT_GUILTY

    case 'HEARING HELD-REINSTATEMENT':
      return ViolationStatus.HEARING_HELD_FINES_REINSTATED

    case 'HEARING PENDING':
      return ViolationStatus.HEARING_PENDING

    case 'HEARING WAIVED':
      return ViolationStatus.HEARING_WAIVED

    default:
      return ViolationStatus.UNKNOWN
  }
}

export default getViolationStatus
