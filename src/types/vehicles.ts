export type PotentialVehicle = {
  originalString: string
  plate?: string
  state?: string
  types?: string
  validPlate: boolean | undefined
}

export type Vehicle = {
  plate: string
  state: string
  types: string[]
}
