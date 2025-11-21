type BaseFeatureFlagVariation = {
  name: string
  percentage: number
}

export type BooleanFeatureFlagVariation = BaseFeatureFlagVariation & {
  value: boolean
}

type NumberFeatureFlagVariation = BaseFeatureFlagVariation & {
  value: number
}

type StringFeatureFlagVariation = BaseFeatureFlagVariation & {
  value: string
}

export type FeatureFlagVariation =
  | BooleanFeatureFlagVariation
  | NumberFeatureFlagVariation
  | StringFeatureFlagVariation

export type FeatureFlagConfig = {
  name: string
  variations:
    | BooleanFeatureFlagVariation[]
    | NumberFeatureFlagVariation[]
    | StringFeatureFlagVariation[]
}
