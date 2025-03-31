enum ViolationStatus {
  ADMINISTRATIVE_CLAIM_DENIED = 'Administrative Claim Denied',
  ADMINISTRATIVE_CLAIM_GRANTED = 'Administrative Claim Granted',
  ADMINISTRATIVE_REDUCTION = 'Administrative Fines Reduction',
  APPEAL_ABANDONED = 'Appeal Abandoned',
  APPEAL_AFFIRMED = 'Appeal Affirmed',
  APPEAL_MODIFIED = 'Appeal Modified',
  APPEAL_REMANDED = 'Appeal Remanded',
  APPEAL_REVERSED = 'Appeal Reversed',
  HEARING_ADJOURNED = 'Hearing Adjourned',
  HEARING_HELD_GUILTY = 'Hearing Held: Guilty',
  HEARING_HELD_GUILTY_REDUCTION = 'Hearing Held: Guilty, Fines Reduced',
  HEARING_HELD_NOT_GUILTY = 'Hearing Held: Not Guilty',
  HEARING_HELD_FINES_REINSTATED = 'Hearing Held: Fines Reinstated',
  HEARING_PENDING = 'Hearing Pending',
  HEARING_WAIVED = 'Hearing Waived',
  UNKNOWN = 'Unknown Violation Status',
}

export default ViolationStatus
