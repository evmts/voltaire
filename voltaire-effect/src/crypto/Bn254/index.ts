/**
 * BN254 (alt_bn128) elliptic curve module for Effect.
 * Used for zkSNARK verification and EVM precompiles.
 * @module
 * @since 0.0.1
 */
export { Bn254Service, Bn254Live, Bn254Test, type Bn254ServiceShape } from './Bn254Service.js'
export { g1Add, g1Mul, g1Generator, g2Add, g2Mul, g2Generator, pairingCheck } from './operations.js'
export type { BN254G1PointType, BN254G2PointType } from '@tevm/voltaire'
