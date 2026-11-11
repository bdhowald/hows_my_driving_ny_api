import mixpanel, { Mixpanel, PropertyDict } from 'mixpanel'

import FeatureFlags from 'utils/featureFlags/featureFlags'

class MixpanelWithCircuitBreaker {
  mixpanelInstance: Mixpanel

  constructor(mixpanelInstance: Mixpanel) {
    this.mixpanelInstance = mixpanelInstance
  }

  track(eventName: string, properties: PropertyDict) {
    const useMixpanelLogging = FeatureFlags.getFeatureFlagValue(
      FeatureFlags.featureFlags.useSocrataSodaV3Api
    ) as boolean

    if (useMixpanelLogging) {
      return this.mixpanelInstance.track(eventName, properties)
    }
  }
}

const getMixpanelInstance = () => {
  if (process.env.MIXPANEL_PROJECT_ID) {
    const mixpanelInstance = mixpanel.init(process.env.MIXPANEL_PROJECT_ID)
    return new MixpanelWithCircuitBreaker(mixpanelInstance)
  }
  return undefined
}

export default getMixpanelInstance
