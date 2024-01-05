import { Borough } from 'constants/boroughs'
import { HumanizedDescription } from 'constants/violationDescriptions'

type FrequencyData = {
  boroughs: { [B in Borough]?: number }
  violationTypes: { [H in HumanizedDescription]?: number } //Record<HumanizedDescription, number>
  years: { [key: string]: number }
}

export default FrequencyData
