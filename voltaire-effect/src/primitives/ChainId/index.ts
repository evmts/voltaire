/**
 * @module ChainId
 * @description Effect Schemas for Ethereum chain IDs (EIP-155).
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as ChainId from 'voltaire-effect/primitives/ChainId'
 *
 * function getNetworkName(chainId: ChainId.ChainIdType) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output | Description |
 * |--------|-------|--------|-------------|
 * | `ChainId.Number` | number | ChainIdType | Positive integer chain ID |
 * | `ChainId.BigInt` | bigint | ChainIdType | Positive bigint chain ID |
 * | `ChainId.Hex` | string | ChainIdType | Hex-encoded chain ID |
 *
 * ## Usage
 *
 * ```typescript
 * import * as ChainId from 'voltaire-effect/primitives/ChainId'
 * import * as S from 'effect/Schema'
 *
 * // Decode from number
 * const mainnet = S.decodeSync(ChainId.Number)(1)
 * const sepolia = S.decodeSync(ChainId.Number)(11155111)
 *
 * // Decode from hex
 * const fromHex = S.decodeSync(ChainId.Hex)('0x1')
 *
 * // Encode back
 * const num = S.encodeSync(ChainId.Number)(mainnet)
 * const hex = S.encodeSync(ChainId.Hex)(mainnet)
 * ```
 *
 * ## Common Chain IDs
 *
 * - 1: Ethereum Mainnet
 * - 11155111: Sepolia Testnet
 * - 17000: Holesky Testnet
 * - 137: Polygon
 * - 42161: Arbitrum One
 * - 10: Optimism
 *
 * @since 0.1.0
 */

// Schemas
export { Number, type ChainIdType } from "./Number.js";
export { BigInt } from "./BigInt.js";
export { Hex } from "./Hex.js";
