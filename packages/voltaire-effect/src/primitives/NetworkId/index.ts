/**
 * @module NetworkId
 * @description Effect Schemas for Ethereum network IDs (P2P networking layer).
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as NetworkId from 'voltaire-effect/primitives/NetworkId'
 *
 * function connectToPeer(networkId: NetworkId.NetworkIdType) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output | Description |
 * |--------|-------|--------|-------------|
 * | `NetworkId.Number` | number | NetworkIdType | Non-negative integer network ID |
 * | `NetworkId.BigInt` | bigint | NetworkIdType | Non-negative bigint network ID |
 * | `NetworkId.Hex` | string | NetworkIdType | Hex-encoded network ID |
 *
 * ## Usage
 *
 * ```typescript
 * import * as NetworkId from 'voltaire-effect/primitives/NetworkId'
 * import * as S from 'effect/Schema'
 *
 * // Decode from number
 * const mainnet = S.decodeSync(NetworkId.Number)(1)
 *
 * // Use predefined constants
 * console.log(NetworkId.MAINNET)  // 1
 * console.log(NetworkId.SEPOLIA)  // 11155111
 *
 * // Encode back
 * const num = S.encodeSync(NetworkId.Number)(mainnet)
 * ```
 *
 * ## Network ID vs Chain ID
 *
 * - Chain ID (EIP-155): Used in transaction signing to prevent replay attacks
 * - Network ID: Used in peer-to-peer networking to identify network peers
 *
 * For most networks these are the same, but they can differ.
 *
 * @since 0.1.0
 */

export { BigInt } from "./BigInt.js";
export { Hex } from "./Hex.js";
// Schemas
export {
	GOERLI,
	HOLESKY,
	MAINNET,
	type NetworkIdType,
	Number,
	SEPOLIA,
} from "./Number.js";
