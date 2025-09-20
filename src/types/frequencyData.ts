import { Borough } from 'constants/boroughs'
import { HumanizedDescription } from 'constants/violationDescriptions'

type SnakeCase<S extends string> =
  S extends `${infer Head} ${infer Tail}`
    ? Tail extends Uncapitalize<Tail> // if next character is lowercase or no uppercase found
      ? `${Lowercase<Head>}${SnakeCase<Tail>}`
      : Tail extends `${infer First}${infer Rest}`
        ? First extends Uppercase<First> // If next character is uppercase
          ? `${Lowercase<Head>}_${Lowercase<First>}${SnakeCase<Rest>}`
          : `${Lowercase<Head>}${SnakeCase<Tail>}`
        : Lowercase<S>
    : Lowercase<S>

type SnakeCasedBorough = {
  [B in typeof Borough[keyof typeof Borough]]: SnakeCase<B>
}
export type SnakeCasedBoroughValues = SnakeCasedBorough[keyof SnakeCasedBorough]

type FrequencyData = {
  boroughs: { [SCBV in SnakeCasedBoroughValues]?: number }
  violationTypes: { [H in HumanizedDescription]?: number }
  years: { [key: string]: number }
}

export default FrequencyData
