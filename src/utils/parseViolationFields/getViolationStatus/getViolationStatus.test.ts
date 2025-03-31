import IssuingAgency from 'constants/issuingAgencies'

import getViolationStatus from './getViolationStatus'

describe('getViolationStatus', () => {
  test.each([
    {
      violationStatusish: undefined,
      outputViolationStatus: undefined,
    },
    {
      violationStatusish: '',
      outputViolationStatus: undefined,
    },
    {
      violationStatusish: 'ADMIN CLAIM DENIED',
      outputViolationStatus: 'Administrative Claim Denied',
    },
    {
      violationStatusish: 'ADMIN CLAIM GRANTED',
      outputViolationStatus: 'Administrative Claim Granted',
    },
    {
      violationStatusish: 'ADMIN REDUCTION',
      outputViolationStatus: 'Administrative Fines Reduction',
    },
    {
      violationStatusish: 'APPEAL ABANDONED',
      outputViolationStatus: 'Appeal Abandoned',
    },
    {
      violationStatusish: 'APPEAL AFFIRMED',
      outputViolationStatus: 'Appeal Affirmed',
    },
    {
      violationStatusish: 'APPEAL MODIFIED',
      outputViolationStatus: 'Appeal Modified',
    },
    {
      violationStatusish: 'APPEAL REMANDED',
      outputViolationStatus: 'Appeal Remanded',
    },
    {
      violationStatusish: 'APPEAL REVERSED',
      outputViolationStatus: 'Appeal Reversed',
    },
    {
      violationStatusish: 'HEARING ADJOURNMENT',
      outputViolationStatus: 'Hearing Adjourned',
    },
    {
      violationStatusish: 'HEARING HELD-GUILTY',
      outputViolationStatus: 'Hearing Held - Guilty',
    },
    {
      violationStatusish: 'HEARING HELD-GUILTY REDUCTION',
      outputViolationStatus: 'Hearing Held - Guilty, Fines Reduced',
    },
    {
      violationStatusish: 'HEARING HELD-NOT GUILTY',
      outputViolationStatus: 'Hearing Held - Not Guilty',
    },
    {
      violationStatusish: 'HEARING HELD-REINSTATEMENT',
      outputViolationStatus: 'Hearing Held - Fines Reinstated',
    },
    {
      violationStatusish: 'HEARING PENDING',
      outputViolationStatus: 'Hearing Pending',
    },
    {
      violationStatusish: 'HEARING WAIVED',
      outputViolationStatus: 'Hearing Waived',
    },
    {
      violationStatusish: 'HEARING LISTENING',
      outputViolationStatus: 'Unknown Violation Status',
    },
  ])(
    'successfully detects $outputViolationStatus from $violationStatusish',
    ({ violationStatusish, outputViolationStatus }) => {
      const issuingAgency = getViolationStatus(violationStatusish)

      expect(issuingAgency).toBe(outputViolationStatus)
    },
  )
})
