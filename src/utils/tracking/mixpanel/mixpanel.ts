import mixpanel from 'mixpanel'

const getMixpanelInstance = () => {
  if (process.env.MIXPANEL_PROJECT_ID) {
    return mixpanel.init(process.env.MIXPANEL_PROJECT_ID)
  }
  return undefined
}

export default getMixpanelInstance
