import getMixpanelInstance from './mixpanel'

describe('mixpanel', () => {
  it('should return a mixpanel instance if process.env. is defined', () => {
    const realProjectId = process.env.MIXPANEL_PROJECT_ID 
    process.env.MIXPANEL_PROJECT_ID = '123456' // temporarily set for test's sake

    const mixpanelInstance = getMixpanelInstance()
    expect(mixpanelInstance).toBeDefined()

    process.env.MIXPANEL_PROJECT_ID = realProjectId // do not forget to do this
  })

  it('should return a mixpanel instance if process.env. is defined', () => {
    const realProjectId = process.env.MIXPANEL_PROJECT_ID 
    delete process.env.MIXPANEL_PROJECT_ID // temporarily remove for test's sake

    const mixpanelInstance = getMixpanelInstance()
    expect(mixpanelInstance).toBeUndefined()

    process.env.MIXPANEL_PROJECT_ID = realProjectId // do not forget to do this
  })
})