import { FeatureFlagConfig, FeatureFlagVariation } from 'types/featureFlag'

const TOTAL_FEATURE_FLAG_PERCENTAGE = 100

const getFeatureFlagValue = (featureFlag: FeatureFlagConfig) => {
  const variations = featureFlag.variations as FeatureFlagVariation[]
  const totalPercentage = variations.reduce(
    (accum: number, variation: FeatureFlagVariation) => accum + variation.percentage,
    0
  )
  if (totalPercentage !== TOTAL_FEATURE_FLAG_PERCENTAGE) {
    throw Error(`Feature flag percentage is not 100% for ${featureFlag.name}`)
  }

  const randomIntegerValue = Math.floor(Math.random() * 100)

  let cumulative = 0
  const selectedVariation = variations.find((variation: FeatureFlagVariation) => {
    cumulative += variation.percentage
    if (randomIntegerValue < cumulative) {
      return true
    }
  }) as FeatureFlagVariation

  return selectedVariation.value
}

const useSocrataSodaV3Api = {
  name: 'useSocrataSodaV3Api',
  variations: [
    {
      name: 'control',
      percentage: 50,
      value: false,
    },
    {
      name: 'experimental',
      percentage: 50,
      value: true,
    },
  ],
}

const trackOpenDataRequestTime = {
  name: 'trackOpenDataRequestTime',
  variations: [
    {
      name: 'on',
      percentage: 100,
      value: true,
    },
    {
      name: 'off',
      percentage: 0,
      value: false,
    },
  ],
}

const featureFlags = {
  trackOpenDataRequestTime,
  useSocrataSodaV3Api,
}

export default {
  featureFlags,
  getFeatureFlagValue,
}
