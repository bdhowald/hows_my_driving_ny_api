import { Borough } from 'constants/boroughs'
import { HumanizedDescription } from 'constants/violationDescriptions'

type CamelCase<S extends string> =
  S extends`${infer Head} ${infer Tail}`
    ? `${Lowercase<Head>}${Capitalize<CamelCase<Tail>>}`
    : Lowercase<S>

type CamelizedBorough = {
  [B in typeof Borough[keyof typeof Borough]]: CamelCase<B>
}
export type CamelizedBoroughValues = CamelizedBorough[keyof CamelizedBorough]

type FrequencyData = {
  boroughs: { [CBV in CamelizedBoroughValues]?: number }
  violationTypes: { [H in HumanizedDescription]?: number } //Record<HumanizedDescription, number>
  years: { [key: string]: number }
}

export default FrequencyData
